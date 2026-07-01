import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  collectInboxCandidates,
  copyInboxCandidateToStore,
  discardInboxFile,
  ensureIntakeDirs,
  guessMimeType,
  intakeRoot,
  moveToArchive,
  readStoredFile,
  storeUploadedFile
} from "./document-intake-store";

const originalEnv = { ...process.env };
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "intake-store-test-"));
  process.env.INTAKE_DIR = root;
  // Disable the "still being written" settle window so freshly-created test
  // files are collected immediately.
  process.env.INTAKE_SETTLE_MS = "0";
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await rm(root, { recursive: true, force: true });
});

describe("intakeRoot", () => {
  it("uses INTAKE_DIR when set", () => {
    expect(intakeRoot()).toBe(root);
  });

  it("falls back to ./.intake when unset", () => {
    delete process.env.INTAKE_DIR;
    expect(intakeRoot()).toBe(join(process.cwd(), ".intake"));
  });
});

describe("ensureIntakeDirs", () => {
  it("creates the inbox, store, and archive folders", async () => {
    await ensureIntakeDirs();
    const scan = await readdir(join(root, "inbox", "scan"));
    const email = await readdir(join(root, "inbox", "email"));
    const store = await readdir(join(root, "store"));
    const archive = await readdir(join(root, "archive"));
    expect(scan).toEqual([]);
    expect(email).toEqual([]);
    expect(store).toEqual([]);
    expect(archive).toEqual([]);
  });
});

describe("guessMimeType", () => {
  it("maps known extensions", () => {
    expect(guessMimeType("a.pdf")).toBe("application/pdf");
    expect(guessMimeType("scan.PNG")).toBe("image/png");
    expect(guessMimeType("photo.jpeg")).toBe("image/jpeg");
  });

  it("defaults unknown extensions to octet-stream", () => {
    expect(guessMimeType("mystery.xyz")).toBe("application/octet-stream");
  });
});

describe("storeUploadedFile and readStoredFile", () => {
  it("writes a content-addressed copy and reads it back", async () => {
    const bytes = Buffer.from("hello invoice");
    const stored = await storeUploadedFile("Invoice 42.pdf", bytes);

    expect(stored.filename).toBe("Invoice 42.pdf");
    expect(stored.mimeType).toBe("application/pdf");
    expect(stored.byteSize).toBe(bytes.byteLength);
    expect(stored.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.storedPath).toContain(join(root, "store"));
    expect(stored.storedPath.endsWith(`${stored.contentHash}.pdf`)).toBe(true);

    const readBack = await readStoredFile(stored.storedPath);
    expect(readBack.equals(bytes)).toBe(true);
  });

  it("produces the same hash for identical content (dedup key)", async () => {
    const a = await storeUploadedFile("one.pdf", Buffer.from("same"));
    const b = await storeUploadedFile("two.pdf", Buffer.from("same"));
    expect(a.contentHash).toBe(b.contentHash);
  });
});

describe("collectInboxCandidates", () => {
  it("tags scan-folder files as FOLDER and email-folder files as EMAIL, ignoring dotfiles", async () => {
    await ensureIntakeDirs();
    await writeFile(join(root, "inbox", "scan", "receipt.jpg"), "scan-bytes");
    await writeFile(join(root, "inbox", "email", "contract.pdf"), "email-bytes");
    await writeFile(join(root, "inbox", "scan", ".gitkeep"), "");

    const candidates = await collectInboxCandidates();
    const byName = Object.fromEntries(candidates.map((c) => [c.filename, c]));

    expect(candidates).toHaveLength(2);
    expect(byName["receipt.jpg"].source).toBe("FOLDER");
    expect(byName["receipt.jpg"].mimeType).toBe("image/jpeg");
    expect(byName["contract.pdf"].source).toBe("EMAIL");
    expect(byName["contract.pdf"].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns nothing when inboxes are empty", async () => {
    await ensureIntakeDirs();
    expect(await collectInboxCandidates()).toEqual([]);
  });

  it("skips files still within the settle window", async () => {
    process.env.INTAKE_SETTLE_MS = "60000";
    await ensureIntakeDirs();
    await writeFile(join(root, "inbox", "scan", "still-writing.pdf"), "partial");
    expect(await collectInboxCandidates()).toEqual([]);
  });
});

describe("copyInboxCandidateToStore and discardInboxFile", () => {
  it("copies a candidate into the store but leaves the inbox original until discarded", async () => {
    await ensureIntakeDirs();
    await writeFile(join(root, "inbox", "scan", "receipt.pdf"), "receipt-content");
    const [candidate] = await collectInboxCandidates();

    const stored = await copyInboxCandidateToStore(candidate);

    expect(stored.storedPath.endsWith(`${candidate.contentHash}.pdf`)).toBe(true);
    const readBack = await readStoredFile(stored.storedPath);
    expect(readBack.toString()).toBe("receipt-content");
    // Inbox original is still present (deleted only after the DB row exists).
    expect(await readdir(join(root, "inbox", "scan"))).toEqual(["receipt.pdf"]);

    await discardInboxFile(candidate.absPath);
    expect(await readdir(join(root, "inbox", "scan"))).toEqual([]);
  });

  it("discardInboxFile removes a duplicate original", async () => {
    await ensureIntakeDirs();
    const dup = join(root, "inbox", "scan", "dup.pdf");
    await writeFile(dup, "dup");
    await discardInboxFile(dup);
    expect(await readdir(join(root, "inbox", "scan"))).toEqual([]);
  });
});

describe("moveToArchive", () => {
  it("moves a stored file into the archive folder", async () => {
    const stored = await storeUploadedFile("keep.pdf", Buffer.from("archive me"));
    const archivedPath = await moveToArchive(stored.storedPath);

    expect(archivedPath).toContain(join(root, "archive"));
    const readBack = await readFile(archivedPath);
    expect(readBack.toString()).toBe("archive me");
    // Original store copy no longer exists.
    await expect(readFile(stored.storedPath)).rejects.toBeTruthy();
  });

  it("returns the original path when the source is missing", async () => {
    await mkdir(join(root, "archive"), { recursive: true });
    const missing = join(root, "store", "does-not-exist.pdf");
    expect(await moveToArchive(missing)).toBe(missing);
  });

  it("returns the archive target when the source was already moved", async () => {
    await ensureIntakeDirs();
    const name = "abc123.pdf";
    await writeFile(join(root, "archive", name), "already archived");
    const result = await moveToArchive(join(root, "store", name));
    expect(result).toBe(join(root, "archive", name));
  });
});
