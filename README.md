# Dromaios Cockpit

Private company command cockpit for Dromaios Labs.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- Postgres
- Ollama for local assistant drafts
- Docker Compose for local/VPN-first deployment

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
   Keep `COOKIE_SECURE=false` for local or VPN-only HTTP. Set it to `true` only after serving the app over HTTPS.
3. Start Postgres: `docker compose up -d postgres`.
4. Install dependencies: `pnpm install`.
5. Generate Prisma client: `pnpm db:generate`.
6. Apply migrations during development: `pnpm db:migrate`.
7. Seed initial data: `pnpm db:seed`.
8. Run the app: `pnpm dev`.

## Hetzner Deployment

This repo is packaged for a local/VPN-first Hetzner Docker Compose deployment using the root `Dockerfile`, `docker-compose.yml`, and `Caddyfile`.

Start with:

- `docs/deployment/HETZNER_RUNBOOK.md`
- `docs/deployment/ENV_CHECKLIST.md`
- `.env.hetzner.example`

The production app container runs `node scripts/deployment-preflight.mjs` before migrations, seeding, and startup. Keep public-domain hardening as a separate project; this deployment path is for SSH-tunnel or VPN access.

## Verification

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `node scripts/deployment-preflight.mjs`
- `pnpm smoke:compose`

## AI Maintenance

Future AI sessions should start with `AI_CONTEXT.md`.
