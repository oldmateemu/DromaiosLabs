# AI Guide

## Model Routing

- Use Ollama first for private company memory, quick capture, review summaries, and routine action drafting.
- Use cloud AI only for non-sensitive strategy, public copy, code help, or documentation review.

## Local Defaults

- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_MODEL=gemma3:1b`
- `COOKIE_SECURE=false` for local/VPN HTTP, `true` for HTTPS deployments.

## Privacy Rules

Keep patient/client-identifiable data, credentials, contracts, financial raw records, patentable ClinicBoss or medtech detail, and clinical/regulatory claims local-only by default.

## Draft Rule

AI output is a draft. It becomes company work only after the user approves it.
