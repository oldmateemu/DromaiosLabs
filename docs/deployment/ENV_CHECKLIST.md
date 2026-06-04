# Deployment Env Checklist

Use this checklist when creating `.env` from `.env.hetzner.example` on the Hetzner server.

## Required Production Values

| Variable | Production rule |
| --- | --- |
| `DEPLOYMENT_MODE` | Must be `production` on Hetzner. Enables the deployment preflight checks. |
| `POSTGRES_USER` | Keep `dromaios` unless you are also changing the database volume intentionally. |
| `POSTGRES_PASSWORD` | Must be non-placeholder, at least 16 characters, and URL-safe: `A-Z`, `a-z`, `0-9`, `.`, `_`, `~`, `-`. |
| `POSTGRES_DB` | Keep `dromaios_cockpit` unless you are intentionally creating a new database. |
| `POSTGRES_BIND_IP` | Must stay `127.0.0.1`. Postgres is not a remote service. |
| `POSTGRES_PORT` | Default `5432`. Change only if the host port conflicts. |
| `APP_BIND_IP` | Keep `127.0.0.1`; Caddy should be the user-facing entrypoint. |
| `APP_PORT` | Default `3300`. Used for host-local debugging or SSH tunnel access to Next directly. |
| `COCKPIT_BIND_IP` | Use `127.0.0.1` for SSH-tunnel access, or the server VPN IP for Tailscale/WireGuard access. Never use `0.0.0.0` for this local/VPN-first deployment. |
| `COCKPIT_HTTP_PORT` | Default `8080`. Use `80` only on a VPN-bound interface after confirming the firewall posture. |
| `SESSION_SECRET` | Must be non-placeholder and at least 32 characters. Generate with `openssl rand -hex 32`. |
| `ADMIN_EMAIL` | Must be a real admin email, not `admin@dromaios.local`. |
| `ADMIN_PASSWORD` | Must be non-placeholder and at least 16 characters. Store it in the password manager. |
| `ADMIN_NAME` | Display name for the seeded admin user. |
| `OLLAMA_BASE_URL` | Use `http://host.docker.internal:11434` if Ollama runs on the Hetzner host, or a VPN URL if Ollama runs elsewhere. |
| `OLLAMA_MODEL` | Default `gemma3:1b` unless the host has a different local model installed. |
| `COOKIE_SECURE` | Keep `false` for local/VPN HTTP. Set `true` only behind HTTPS. |

## Preflight Coverage

`node scripts/deployment-preflight.mjs` runs inside the app container before migrations, seeding, and startup. The same check is also exposed as `pnpm deploy:preflight` for normal package-script usage.

In `DEPLOYMENT_MODE=production`, it fails when:

- `SESSION_SECRET`, `ADMIN_PASSWORD`, or `POSTGRES_PASSWORD` is missing, too short, or still a placeholder.
- `ADMIN_EMAIL` is still `admin@dromaios.local`.
- `POSTGRES_PASSWORD` contains characters that would break the composed `DATABASE_URL`.
- `COCKPIT_BIND_IP` is a broad bind such as `0.0.0.0`.
- `POSTGRES_BIND_IP` is anything other than loopback.
- `COOKIE_SECURE` is not a recognizable boolean.

## Private Files

These files must stay off git and out of Docker images:

- `.env`
- `.env.hetzner`
- `.env.production`
- `prisma/launchpad-system-metadata.local.json`

The Docker build context ignores `.env*` and `prisma/launchpad-system-metadata.local.json` so private deployment values are not baked into the app image.
