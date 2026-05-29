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

## Verification

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm smoke:compose`

## AI Maintenance

Future AI sessions should start with `AI_CONTEXT.md`.
