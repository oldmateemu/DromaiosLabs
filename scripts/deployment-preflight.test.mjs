import assert from "node:assert/strict";
import test from "node:test";
import { validateDeploymentEnvironment } from "./deployment-preflight.mjs";

const safeProductionEnv = {
  DEPLOYMENT_MODE: "production",
  SESSION_SECRET: "sample-session-secret-with-32-plus-chars",
  ADMIN_EMAIL: "callum@example.com",
  ADMIN_PASSWORD: "sample-admin-password-32",
  POSTGRES_PASSWORD: "sample-db-password-32",
  COCKPIT_BIND_IP: "127.0.0.1",
  POSTGRES_BIND_IP: "127.0.0.1",
  COOKIE_SECURE: "false"
};

test("production deployment rejects placeholder credentials", () => {
  const result = validateDeploymentEnvironment({
    ...safeProductionEnv,
    SESSION_SECRET: "replace-with-at-least-24-random-characters",
    ADMIN_EMAIL: "admin@dromaios.local",
    ADMIN_PASSWORD: "change-me-now",
    POSTGRES_PASSWORD: "dromaios"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /SESSION_SECRET/);
  assert.match(result.errors.join("\n"), /ADMIN_EMAIL/);
  assert.match(result.errors.join("\n"), /ADMIN_PASSWORD/);
  assert.match(result.errors.join("\n"), /POSTGRES_PASSWORD/);
});

test("production deployment rejects broad app and database binds", () => {
  const result = validateDeploymentEnvironment({
    ...safeProductionEnv,
    COCKPIT_BIND_IP: "0.0.0.0",
    POSTGRES_BIND_IP: "0.0.0.0"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /COCKPIT_BIND_IP/);
  assert.match(result.errors.join("\n"), /POSTGRES_BIND_IP/);
});

test("production deployment rejects database passwords that are unsafe in the composed database url", () => {
  const result = validateDeploymentEnvironment({
    ...safeProductionEnv,
    POSTGRES_PASSWORD: "sample:db@password/32"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /POSTGRES_PASSWORD/);
});

test("local deployment mode accepts local placeholders for development compose use", () => {
  const result = validateDeploymentEnvironment({
    DEPLOYMENT_MODE: "local",
    SESSION_SECRET: "replace-with-at-least-24-random-characters",
    ADMIN_EMAIL: "admin@dromaios.local",
    ADMIN_PASSWORD: "change-me-now",
    POSTGRES_PASSWORD: "dromaios",
    COCKPIT_BIND_IP: "127.0.0.1",
    POSTGRES_BIND_IP: "127.0.0.1"
  });

  assert.equal(result.ok, true);
});

test("production deployment accepts non-placeholder secrets and local/VPN binds", () => {
  const result = validateDeploymentEnvironment(safeProductionEnv);

  assert.deepEqual(result, { ok: true, errors: [] });
});
