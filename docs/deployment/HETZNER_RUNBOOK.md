# Hetzner Deployment Runbook

This runbook packages the current Dromaios Cockpit stack for a real Hetzner server while preserving the project decision to stay local/VPN-first.

## Safety Target

- Caddy is the operator entrypoint and binds to `127.0.0.1` by default.
- Postgres always binds to `127.0.0.1`; do not expose it over a public or VPN interface.
- Set `COCKPIT_BIND_IP` to a Tailscale/WireGuard server IP only when VPN access is ready.
- Keep `COOKIE_SECURE=false` for local/VPN HTTP. Change it only when a separate HTTPS hardening pass is complete.
- Do not open public HTTP/HTTPS to this cockpit until OAuth, public-domain hardening, and monitoring are handled as separate work.

## 1. Provision The Server

Recommended baseline:

- Hetzner Cloud VM running Ubuntu LTS.
- Hetzner Cloud Firewall allowing SSH only from your admin IP or VPN path.
- No public inbound rule for `80`, `443`, `5432`, `3300`, or `8080`.
- Docker Engine plus the Docker Compose plugin installed from Docker's official Linux instructions:
  - Docker Engine Ubuntu install: https://docs.docker.com/engine/install/ubuntu/
  - Docker Compose plugin install: https://docs.docker.com/compose/install/linux/

After installing Docker, verify:

```bash
docker --version
docker compose version
```

## 2. Put The Repo On The Server

Use either a private git remote or rsync from the current machine.

Git path:

```bash
sudo mkdir -p /opt/dromaios-cockpit
sudo chown "$USER:$USER" /opt/dromaios-cockpit
git clone <your-private-repo-url> /opt/dromaios-cockpit
cd /opt/dromaios-cockpit
```

Rsync path from your workstation:

```bash
rsync -av --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .env \
  --exclude .env.hetzner \
  --exclude .env.production \
  ./ <server-user>@<server-ip>:/opt/dromaios-cockpit/
```

Then on the server:

```bash
cd /opt/dromaios-cockpit
```

## 3. Create The Deployment Env

```bash
cp .env.hetzner.example .env
```

Generate URL-safe secrets:

```bash
openssl rand -hex 32
openssl rand -hex 24
```

Edit `.env` and replace every placeholder. Keep `POSTGRES_PASSWORD` URL-safe because `docker-compose.yml` builds `DATABASE_URL` from it.

Access mode:

- SSH tunnel only: keep `COCKPIT_BIND_IP=127.0.0.1` and `COCKPIT_HTTP_PORT=8080`.
- VPN access: set `COCKPIT_BIND_IP` to the server's Tailscale or WireGuard IPv4 address.
- Public internet: do not use this runbook as-is.

## 4. Validate Before First Boot

Render the compose config:

```bash
docker compose --env-file .env config
```

Build the app image:

```bash
docker compose --env-file .env build app
```

Run the production preflight:

```bash
docker compose --env-file .env run --rm --no-deps app node scripts/deployment-preflight.mjs
```

Expected output:

```text
Deployment preflight passed.
```

## 5. Start The Stack

```bash
docker compose --env-file .env up -d
docker compose --env-file .env ps
```

The app container runs:

```text
node scripts/deployment-preflight.mjs && ./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx prisma/seed.ts && ./node_modules/.bin/next start
```

That means migrations and seed data are applied on startup after the production preflight passes.

## 6. Access The Cockpit

SSH tunnel path:

```bash
ssh -L 8080:127.0.0.1:8080 <server-user>@<server-ip>
```

Then open:

```text
http://127.0.0.1:8080
```

VPN path:

```text
http://<server-vpn-ip>:8080
```

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

## 7. Operations

Status and logs:

```bash
docker compose --env-file .env ps
docker compose --env-file .env logs -f app caddy
```

Restart:

```bash
docker compose --env-file .env restart app caddy
```

Update from git:

```bash
git pull --ff-only
docker compose --env-file .env up -d --build
```

Back up Postgres:

```bash
set -a
. ./.env
set +a
mkdir -p backups
docker compose --env-file .env exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backups/dromaios_cockpit_$(date +%Y-%m-%d_%H%M).sql"
```

Stop without deleting data:

```bash
docker compose --env-file .env down
```

Do not run `docker compose down -v` unless you intentionally want to delete the database volume.

## 8. Rollback

Code rollback:

```bash
git checkout <known-good-sha>
docker compose --env-file .env up -d --build
```

Database migrations are not automatically reversible. Restore from a backup if a migration must be undone.
