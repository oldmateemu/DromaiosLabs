#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs dependencies and generates the Prisma client so that
# `pnpm lint`, `pnpm test`, and `pnpm build` work during the session.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install dependencies. `pnpm install` (not `--frozen-lockfile`/ci) benefits
# from container state caching and is safe to re-run.
pnpm install

# Generate the Prisma client (needed for typechecking, lint, tests, and build).
pnpm db:generate
