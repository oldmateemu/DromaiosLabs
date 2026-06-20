import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, prismaMock, redirectMock } = vi.hoisted(() => {
  const store = new Map<string, string>();
  const cookieStore = {
    store,
    get: (name: string) => (store.has(name) ? { name, value: store.get(name) } : undefined),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (name: string) => {
      store.delete(name);
    }
  };
  const prismaMock = {
    user: { findUnique: vi.fn() },
    session: { create: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn() }
  };
  const redirectMock = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  return { cookieStore, prismaMock, redirectMock };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("./db", () => ({ prisma: prismaMock }));

const { loginWithPassword, logout, getCurrentUser, requireUser } = await import("./auth");

const SESSION_COOKIE = "dromaios_session";
const PASSWORD = "correct-horse-battery";
const passwordHash = bcrypt.hashSync(PASSWORD, 8);

const user = { id: "user-1", email: "founder@dromaios.test", name: "Founder", passwordHash };

const originalEnv = { ...process.env };

beforeEach(() => {
  cookieStore.store.clear();
  vi.clearAllMocks();
  process.env.SESSION_SECRET = "a-test-session-secret-of-32-chars!!";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

/** Logs in successfully and returns the signed token written to the cookie. */
async function loginAndGetToken(sessionId = "sess-1") {
  prismaMock.user.findUnique.mockResolvedValue(user);
  prismaMock.session.create.mockResolvedValue({ id: sessionId });
  const result = await loginWithPassword(user.email, PASSWORD);
  expect(result).toEqual({ ok: true });
  return cookieStore.store.get(SESSION_COOKIE) as string;
}

describe("loginWithPassword", () => {
  it("rejects an unknown email without revealing which field failed", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await loginWithPassword("missing@dromaios.test", PASSWORD);

    expect(result).toEqual({ ok: false, message: "Invalid email or password." });
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await loginWithPassword(user.email, "wrong-password");

    expect(result).toEqual({ ok: false, message: "Invalid email or password." });
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it("normalises the email, creates a session, and sets a signed cookie", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.session.create.mockResolvedValue({ id: "sess-1" });

    const result = await loginWithPassword("  Founder@Dromaios.Test  ", PASSWORD);

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "founder@dromaios.test" } });
    expect(prismaMock.session.create).toHaveBeenCalledWith({
      data: { userId: "user-1", expiresAt: expect.any(Date) }
    });
    const token = cookieStore.store.get(SESSION_COOKIE);
    expect(token).toMatch(/^sess-1\..+/);
  });

  it("refuses to issue a session when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET;
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.session.create.mockResolvedValue({ id: "sess-1" });

    await expect(loginWithPassword(user.email, PASSWORD)).rejects.toThrow(
      "SESSION_SECRET must be set to at least 24 characters."
    );
  });

  it("refuses to issue a session when SESSION_SECRET is too short", async () => {
    process.env.SESSION_SECRET = "too-short";
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.session.create.mockResolvedValue({ id: "sess-1" });

    await expect(loginWithPassword(user.email, PASSWORD)).rejects.toThrow(
      "SESSION_SECRET must be set to at least 24 characters."
    );
  });
});

describe("getCurrentUser", () => {
  it("returns null when no session cookie is present", async () => {
    expect(await getCurrentUser()).toBeNull();
    expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
  });

  it("resolves the user for a valid signed token", async () => {
    await loginAndGetToken("sess-1");
    prismaMock.session.findUnique.mockResolvedValue({
      id: "sess-1",
      expiresAt: new Date(Date.now() + 60_000),
      user
    });

    const result = await getCurrentUser();

    expect(result).toEqual(user);
    expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
      where: { id: "sess-1" },
      include: { user: true }
    });
  });

  it("rejects a tampered token without hitting the database", async () => {
    await loginAndGetToken("sess-1");
    cookieStore.store.set(SESSION_COOKIE, "sess-1.forged-signature");

    expect(await getCurrentUser()).toBeNull();
    expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
  });

  it("clears and rejects an expired session", async () => {
    await loginAndGetToken("sess-exp");
    prismaMock.session.findUnique.mockResolvedValue({
      id: "sess-exp",
      expiresAt: new Date(Date.now() - 60_000),
      user
    });

    expect(await getCurrentUser()).toBeNull();
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { id: "sess-exp" } });
  });
});

describe("logout", () => {
  it("deletes the stored session and clears the cookie", async () => {
    await loginAndGetToken("sess-1");

    await logout();

    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { id: "sess-1" } });
    expect(cookieStore.store.has(SESSION_COOKIE)).toBe(false);
  });

  it("clears the cookie even when no valid session token is present", async () => {
    cookieStore.store.set(SESSION_COOKIE, "garbage");

    await logout();

    expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
    expect(cookieStore.store.has(SESSION_COOKIE)).toBe(false);
  });
});

describe("requireUser", () => {
  it("returns the user when authenticated", async () => {
    await loginAndGetToken("sess-1");
    prismaMock.session.findUnique.mockResolvedValue({
      id: "sess-1",
      expiresAt: new Date(Date.now() + 60_000),
      user
    });

    expect(await requireUser()).toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when unauthenticated", async () => {
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
