#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildNextDevArgs } from "./next-dev-command.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const nextBin = resolve(rootDir, "node_modules", "next", "dist", "bin", "next");
const defaultHost = process.env.NEXT_DEV_HOST ?? "127.0.0.1";
const defaultPort = process.env.NEXT_DEV_PORT ?? process.env.PORT ?? "3000";
const nextArgs = buildNextDevArgs(process.argv.slice(2), { defaultHost, defaultPort });

process.chdir(rootDir);

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  env: process.env,
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(`Failed to start Next dev server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
