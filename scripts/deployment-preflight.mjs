#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const PLACEHOLDER_VALUES = new Set([
  "replace-with-at-least-24-random-characters",
  "change-me-now",
  "dromaios",
  "postgres",
  "password",
  "changeme"
]);

const BROAD_BIND_ADDRESSES = new Set(["0.0.0.0", "::", "[::]", "*"]);
const LOOPBACK_BIND_ADDRESSES = new Set(["127.0.0.1", "::1", "localhost"]);

export function validateDeploymentEnvironment(env = process.env) {
  const errors = [];
  const mode = readEnv(env, "DEPLOYMENT_MODE", "local").toLowerCase();

  if (mode !== "production") {
    return { ok: true, errors };
  }

  requireSecret(errors, env, "SESSION_SECRET", { minLength: 32 });
  requireEmail(errors, env, "ADMIN_EMAIL", { disallowed: ["admin@dromaios.local"] });
  requireSecret(errors, env, "ADMIN_PASSWORD", { minLength: 16 });
  requireSecret(errors, env, "POSTGRES_PASSWORD", { minLength: 16 });
  requireUrlSafeDatabasePassword(errors, env, "POSTGRES_PASSWORD");
  rejectBroadBind(errors, env, "COCKPIT_BIND_IP", "127.0.0.1");
  requireLoopbackBind(errors, env, "POSTGRES_BIND_IP", "127.0.0.1");
  requireBoolean(errors, env, "COOKIE_SECURE", "false");

  return { ok: errors.length === 0, errors };
}

function requireSecret(errors, env, key, { minLength }) {
  const value = readEnv(env, key);
  const normalized = value.toLowerCase();
  if (!value) {
    errors.push(`${key} is required for DEPLOYMENT_MODE=production.`);
    return;
  }
  if (value.length < minLength) {
    errors.push(`${key} must be at least ${minLength} characters for production.`);
  }
  if (PLACEHOLDER_VALUES.has(normalized) || normalized.includes("replace-with")) {
    errors.push(`${key} is still using a placeholder/default value.`);
  }
}

function requireUrlSafeDatabasePassword(errors, env, key) {
  const value = readEnv(env, key);
  if (!value || /^[A-Za-z0-9._~-]+$/.test(value)) return;
  errors.push(`${key} must use URL-safe characters because docker-compose.yml builds DATABASE_URL from it.`);
}

function requireEmail(errors, env, key, { disallowed = [] } = {}) {
  const value = readEnv(env, key);
  if (!value) {
    errors.push(`${key} is required for DEPLOYMENT_MODE=production.`);
    return;
  }
  if (!value.includes("@")) {
    errors.push(`${key} must be an email address.`);
  }
  if (disallowed.includes(value.toLowerCase())) {
    errors.push(`${key} must not use the local development admin address.`);
  }
}

function rejectBroadBind(errors, env, key, defaultValue) {
  const value = readEnv(env, key, defaultValue);
  if (BROAD_BIND_ADDRESSES.has(value)) {
    errors.push(`${key} must not be a broad host bind. Use 127.0.0.1 or the server VPN interface address.`);
  }
}

function requireLoopbackBind(errors, env, key, defaultValue) {
  const value = readEnv(env, key, defaultValue);
  if (BROAD_BIND_ADDRESSES.has(value) || !LOOPBACK_BIND_ADDRESSES.has(value)) {
    errors.push(`${key} must stay on 127.0.0.1 so Postgres is not exposed outside Docker and the host.`);
  }
}

function requireBoolean(errors, env, key, defaultValue) {
  const value = readEnv(env, key, defaultValue).toLowerCase();
  if (!["true", "false", "1", "0", "yes", "no"].includes(value)) {
    errors.push(`${key} must be true or false.`);
  }
}

function readEnv(env, key, defaultValue = "") {
  return String(env[key] ?? defaultValue).trim();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = validateDeploymentEnvironment();
  if (!result.ok) {
    console.error("Deployment preflight failed:");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Deployment preflight passed.");
}
