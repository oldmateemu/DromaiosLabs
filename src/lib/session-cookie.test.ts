import { describe, expect, it } from "vitest";
import { shouldUseSecureSessionCookie } from "./session-cookie";

describe("shouldUseSecureSessionCookie", () => {
  it("defaults to local-http friendly cookies even under next start", () => {
    expect(shouldUseSecureSessionCookie({ NODE_ENV: "production" })).toBe(false);
  });

  it("uses secure cookies only when explicitly enabled", () => {
    expect(shouldUseSecureSessionCookie({ COOKIE_SECURE: "true" })).toBe(true);
    expect(shouldUseSecureSessionCookie({ COOKIE_SECURE: "1" })).toBe(true);
    expect(shouldUseSecureSessionCookie({ COOKIE_SECURE: "false" })).toBe(false);
  });
});
