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

# Use the same pnpm major the project and CI target (11.x). pnpm 11 reads the
# overrides-only pnpm-workspace.yaml and hoists eslint plugins correctly;
# older majors leave `pnpm lint` unable to resolve eslint-plugin-react-hooks.
PNPM="corepack pnpm@11.5.2"

# CI=true keeps the install non-interactive (no modules-purge TTY prompt when
# switching pnpm versions on resume).
export CI=true

# `prisma/schema.prisma` references env("DATABASE_URL"). `prisma generate`
# doesn't connect, but provide a harmless placeholder (matching CI) so it never
# fails on a fresh web checkout that has no .env yet.
export DATABASE_URL="${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public}"

# Install dependencies. `pnpm install` (not `--frozen-lockfile`/ci) benefits
# from container state caching and is safe to re-run.
$PNPM install

# Generate the Prisma client (needed for typechecking, lint, tests, and build).
$PNPM db:generate
