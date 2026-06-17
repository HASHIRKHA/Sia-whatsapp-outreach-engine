<div align="center">

<br />

```
 ███████╗██╗ █████╗
 ██╔════╝██║██╔══██╗
 ███████╗██║███████║
 ╚════██║██║██╔══██║
 ███████║██║██║  ██║
 ╚══════╝╚═╝╚═╝  ╚═╝
```

**Self-Hosted WhatsApp Outreach Engine**

*Bulk campaigns · AI-generated copy · 5-layer anti-ban · Real-time analytics*

<br />

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-5-ff6b35?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?style=flat-square&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

<br />

</div>

---

## What Is Sia?

**Sia** is a production-grade, self-hosted WhatsApp outreach platform. Send bulk campaigns with intelligent message variation, AI-crafted copy, and a 5-layer anti-ban system that keeps your numbers alive — all from a clean web panel running on your own server.

No per-message SaaS fees. No data leaving your infrastructure. Just raw WhatsApp throughput, done safely.

---

## Features at a Glance

| Capability | Details |
|---|---|
| **Dual connection modes** | Baileys WebSocket (any number) or Meta Cloud API (official Business API) |
| **5-layer anti-ban** | Gaussian delays · 21-day warmup · device fingerprinting · proxy rotation · spin syntax |
| **NEXUS AI Brain** | Generate campaigns, classify replies, A/B optimize — Anthropic Claude + OpenAI |
| **BullMQ queue** | Every message is queued, resumable, retried. Server restarts lose nothing. |
| **Real-time panel** | Live QR scan, campaign stats ticker, reply inbox, analytics funnel |
| **Smart Lists** | Segment contacts by tag, city, interest; launch to a list, not a raw ID array |
| **Contact import** | CSV/Excel bulk import with E.164 validation and deduplication |
| **Webhook receiver** | Meta Cloud API delivery receipts update message status in real time |
| **Full self-hosting** | Docker Compose + Nginx + Let's Encrypt — one VPS, no external dependencies |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Nginx  (SSL · HTTP/2 · Rate-limit)              │
│           /api/*  ·  /socket.io/*  ·  /* (Next.js panel)           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐        ┌──────────────────┐
              │       NestJS API        │◄──────►│  PostgreSQL 16   │
              │     (Fastify adapter)   │        │  (Supabase / VPS)│
              └────────────┬────────────┘        └──────────────────┘
                           │
              ┌────────────▼────────────┐        ┌──────────────────┐
              │       BullMQ v5         │◄──────►│    Redis 7        │
              │     Outbox Queues       │        │  (jobs · gaps)   │
              └────────────┬────────────┘        └──────────────────┘
                           │
              ┌────────────▼──────────────────────────────┐
              │                 Workers                    │
              │  BaileysWorker          CloudApiWorker     │
              │  (WebSocket/Baileys)    (Meta Graph API)   │
              └────────┬───────────────────────┬───────────┘
                       │                       │
           ┌───────────▼──────┐    ┌───────────▼──────┐
           │ @whiskeysockets/ │    │ Meta Graph API   │
           │     /baileys     │    │     v21.0        │
           └──────────────────┘    └──────────────────┘
```

### Monorepo Layout

```
sia/
├── apps/
│   ├── api/                  # NestJS 10 backend
│   │   ├── prisma/           # Schema + migrations
│   │   └── src/modules/
│   │       ├── auth/         # JWT auth + registration guard
│   │       ├── campaigns/    # Campaign lifecycle (DRAFT → RUNNING → DONE)
│   │       ├── contacts/     # Import, validate, CRUD, smart lists
│   │       ├── sessions/     # Baileys session pool + QR/pairing flow
│   │       ├── cloud-api/    # Meta Graph API client
│   │       ├── queue/        # BullMQ producers + workers
│   │       ├── antiban/      # All 5 protection layers
│   │       ├── ai/           # NEXUS AI Campaign Brain
│   │       ├── analytics/    # Funnel metrics + daily breakdown
│   │       ├── replies/      # Inbound reply classification
│   │       ├── settings/     # Runtime settings, proxy CRUD
│   │       └── webhooks/     # Meta Cloud API inbound events
│   └── web/                  # Next.js 15 panel (App Router)
│       └── src/app/
│           ├── page.tsx      # Dashboard
│           ├── sessions/     # Session grid + QR modal
│           ├── campaigns/    # Campaign wizard + live stats
│           ├── contacts/     # Table + CSV import
│           ├── templates/    # Template editor + spin preview
│           ├── replies/      # Sentiment-sorted inbox
│           ├── analytics/    # Recharts funnel + daily bar chart
│           └── settings/     # Engine · Warmup · AI · Proxies
└── packages/
    └── shared/               # Shared TypeScript types + spinText()
```

---

## Quick Start — Local Development

### Prerequisites

- Node.js 22 LTS
- Docker Desktop (Postgres + Redis)
- `npx pnpm@9` (or global pnpm)

### Steps

```bash
# 1. Clone
git clone https://github.com/HASHIRKHA/Sia-whatsapp-outreach-engine.git sia
cd sia

# 2. Configure environment
cp .env.example .env
# Fill in: SESSION_ENCRYPTION_KEY, JWT_SECRET, JWT_REFRESH_SECRET
# Set DRY_RUN=true for local dev (no real messages sent)

# 3. Start Postgres + Redis
docker compose up -d postgres redis

# 4. Install dependencies
npx pnpm@9 install

# 5. Run database migrations
npx pnpm@9 --filter @wa-engine/api run prisma:migrate

# 6. Start dev servers (api + web hot-reload)
npx pnpm@9 dev

# Panel → http://localhost:3000
# API   → http://localhost:4000

# 7. Create your admin account
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=YourPassword123 \
  npx ts-node -r tsconfig-paths/register scripts/seed-admin.ts

# 8. Log in at http://localhost:3000/login
```

---

## Production Deploy (VPS / Docker)

### Prerequisites

- Ubuntu 22.04 VPS with ports 80 + 443 open
- Domain with A record pointing at VPS IP
- Supabase project **or** local Postgres 16 (docker-compose handles it)

### 1 — Configure environment

```bash
cp .env.example .env
```

Fill in the required variables (see [Environment Variables](#environment-variables) below), then generate secrets:

```bash
openssl rand -hex 32   # → SESSION_ENCRYPTION_KEY
openssl rand -hex 16   # → REDIS_PASSWORD
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET
```

### 2 — SSL certificate

```bash
export DOMAIN=your.domain.com
export CERTBOT_EMAIL=you@example.com
bash scripts/setup-ssl.sh
```

### 3 — Launch

```bash
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

The panel is live at `https://your.domain.com`.

---

## Environment Variables

### Core (required)

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` / `development` / `test` |
| `DRY_RUN` | `true` = log only, never send. Set `false` for live sends. |
| `DOMAIN` | Your domain — used in Nginx config + CORS |
| `DATABASE_URL` | PostgreSQL connection string (pooler, port 6543 for Supabase) |
| `DIRECT_URL` | PostgreSQL direct connection for migrations (port 5432) |
| `SESSION_ENCRYPTION_KEY` | 32-byte hex key — AES-256-GCM encryption for Baileys auth state |
| `REDIS_PASSWORD` | Redis auth password (used automatically in docker-compose) |
| `JWT_SECRET` | 32+ char secret for access token signing |
| `JWT_REFRESH_SECRET` | 32+ char secret for refresh token signing |
| `REGISTRATION_SECRET` | If set, `POST /api/auth/register` requires matching `secret` in body |
| `NEXT_PUBLIC_API_URL` | API base URL as seen from the browser (for Socket.io) |

### Meta Cloud API (Mode 1 — optional)

| Variable | Description |
|---|---|
| `META_APP_SECRET` | Validates `X-Hub-Signature-256` on inbound webhooks |
| `META_VERIFY_TOKEN` | Your webhook verification token |
| `META_ACCESS_TOKEN` | Permanent system user access token |
| `META_PHONE_NUMBER_ID` | Business phone number ID from Meta |
| `META_DEFAULT_TEMPLATE_LANGUAGE` | BCP-47 code (default: `en_US`) |

### AI — NEXUS Brain (optional but recommended)

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `anthropic` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | — | Your Anthropic API key |
| `OPENAI_API_KEY` | — | OpenAI API key (fallback) |
| `AI_MODEL` | `claude-haiku-4-5-20251001` | Override the model |

### Anti-Ban Tuning (safe defaults provided)

| Variable | Default | Description |
|---|---|---|
| `DELAY_MEAN_MS` | `120000` | Gaussian mean delay between messages (2 min) |
| `DELAY_STD_DEV_MS` | `35000` | Standard deviation for timing variance |
| `DELAY_FLOOR_MS` | `60000` | Hard minimum — never faster than this |
| `DELAY_CEILING_MS` | `480000` | Hard maximum — caps Gaussian outliers |
| `TYPING_SIMULATION_MS` | `6000` | Typing indicator before each message |
| `DAILY_SEND_LIMIT` | `200` | Max messages per session per day (post-warmup) |
| `ACTIVE_HOURS_TIMEZONE` | `Asia/Dubai` | IANA timezone for active-hours gate |
| `PROXY_ROTATION_HOURS` | `48` | Hours before a proxy assignment rotates |

---

## The 5-Layer Anti-Ban System

Sia treats account safety as a first-class feature — not an afterthought.

### Layer 1 — Gaussian Delay Engine

Every inter-message gap is drawn from a normal distribution (`mean ± σ`) then clamped to `[floor, ceiling]`. The result is statistically indistinguishable from a human typing at a keyboard. A **stranger penalty** applies 2.5× the normal delay for first-time contacts and 1.8× for second-time — the exact window where WhatsApp flags mass-sending accounts.

### Layer 2 — 21-Day Warmup Schedule

New numbers start at a low cap and ramp up daily:

| Days | Daily Cap |
|---|---|
| 0–2 | 10 messages |
| 3–5 | 25 messages |
| 6–9 | 50 messages |
| 10–13 | 100 messages |
| 14–20 | 150 messages |
| 21+ | Your configured `DAILY_SEND_LIMIT` |

Caps reset atomically at midnight. The session advances its warmup day on each reset.

### Layer 3 — Device Fingerprinting

Each session is assigned one of 20 realistic device profiles (Android + iOS models with matching OS versions, build IDs, and browser strings). The profile is applied to the Baileys WebSocket handshake and persists until the session goes OFFLINE — at which point it rotates to a fresh profile on reconnect.

### Layer 4 — Proxy Rotation

Sessions are assigned proxies (SOCKS4/5 or HTTP) from a pool managed through the settings panel. The same number consistently exits from the same IP; assignments rotate every 48 hours or on ban events.

### Layer 5 — Spin Syntax

Every message is unique. The spin engine expands `{Hi|Hello|Hey} {name}` into one deterministic variant per `(template, contactId)` pair — so replays produce the same message but no two recipients receive identical text.

---

## NEXUS — AI Campaign Brain

Sia ships with a first-class AI layer that plugs directly into the campaign workflow.

### Generate campaigns

```http
POST /api/ai/generate-campaign
Content-Type: application/json

{
  "brief": "B2B SaaS — project management tool for remote teams",
  "audience": "startup founders and CTOs",
  "tone": "professional but conversational",
  "count": 5,
  "campaignId": "camp_abc123"
}
```

Returns N spin-syntax message templates, optionally auto-enqueued to the campaign.

### Analyze replies

```http
POST /api/ai/analyze-reply

{ "text": "yes I'd be interested, what are the pricing plans?", "replyId": "rpl_xyz" }
```

Returns `{ sentiment: "HOT", intent: "BUYING", confidence: 0.94, nextAction: "Send pricing deck" }`.

### Optimize variants

```http
POST /api/ai/optimize

{ "campaignId": "camp_abc123" }
```

Groups messages by rendered variant, computes reply rates via softmax weighting, returns ranked variants with recommended send weights for future batches.

---

## Spin Syntax Reference

Add natural variation to every message. The engine ensures no two contacts receive identical text:

```
{Hi|Hey|Hello} {name}!

{I came across your profile|I noticed you're active in {city}}
and wanted to reach out about {interest}.

{Would you be open to a quick chat?|Got 5 minutes this week?|Interested in learning more?}
```

**Rules:**
- Variants separated by `|` inside `{}`
- Variables: `{name}`, `{city}`, `{interest}` — populated from the contact record
- Deterministic: the same `(template, contactId)` pair always resolves to the same variant (safe to retry)

---

## Real-Time Events (Socket.io)

Connect to `wss://your.domain.com` and subscribe to:

| Event | Payload | When |
|---|---|---|
| `session:status` | `{ sessionId, status }` | ONLINE / OFFLINE / CONNECTING / BANNED |
| `session:qr` | `{ sessionId, qr }` | New QR code string (render locally — no external service) |
| `campaign:stats` | `{ campaignId, QUEUED, SENT, DELIVERED, READ, REPLIED, FAILED }` | After each message delivery event |
| `reply:new` | `{ contactId, phone, text, campaignId, sentiment }` | Inbound reply received |

---

## API Reference

All endpoints require `Authorization: Bearer <accessToken>` (when auth is enabled).  
Base URL: `https://your.domain.com/api`

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create admin account (`{ email, password, secret? }`) |
| `POST` | `/auth/login` | Login → `{ accessToken, refreshToken }` |
| `POST` | `/auth/refresh` | Rotate tokens |

### Sessions
| Method | Path | Description |
|---|---|---|
| `GET` | `/sessions` | List all sessions |
| `POST` | `/sessions` | Create session (`{ label, mode }`) |
| `POST` | `/sessions/:id/connect` | QR or pairing-code flow (`{ method, phone? }`) |
| `POST` | `/sessions/:id/disconnect` | Graceful disconnect |
| `GET` | `/sessions/:id/health` | Status + phone number |
| `DELETE` | `/sessions/:id` | Delete + logout |

### Campaigns
| Method | Path | Description |
|---|---|---|
| `POST` | `/campaigns` | Create campaign (DRAFT) |
| `GET` | `/campaigns` | List campaigns (filter by `?status=`) |
| `POST` | `/campaigns/:id/launch` | Launch → RUNNING |
| `POST` | `/campaigns/:id/pause` | Pause |
| `POST` | `/campaigns/:id/resume` | Resume from PAUSED |
| `GET` | `/campaigns/:id/stats` | Live counters |
| `GET` | `/campaigns/:id/messages` | Message log |
| `DELETE` | `/campaigns/:id` | Delete campaign |

### Contacts
| Method | Path | Description |
|---|---|---|
| `POST` | `/contacts` | Create / upsert single contact |
| `POST` | `/contacts/import` | Bulk import array |
| `GET` | `/contacts` | List with search, filter, pagination |
| `POST` | `/contacts/validate` | E.164 validate all contacts |
| `POST` | `/contacts/bulk-delete` | Delete up to 500 contacts by ID |
| `DELETE` | `/contacts/all` | Delete all contacts |
| `DELETE` | `/contacts/:id` | Delete single contact |

### Templates
| Method | Path | Description |
|---|---|---|
| `POST` | `/templates` | Create template (spin syntax supported in `body`) |
| `GET` | `/templates` | List templates |
| `PATCH` | `/templates/:id` | Update template |
| `DELETE` | `/templates/:id` | Delete template |

### Smart Lists
| Method | Path | Description |
|---|---|---|
| `GET` | `/smart-lists` | List all smart lists |
| `POST` | `/smart-lists` | Create smart list |
| `POST` | `/smart-lists/:id/contacts` | Add contacts |
| `DELETE` | `/smart-lists/:id/contacts` | Remove contacts |

### AI — NEXUS
| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/generate-campaign` | Generate spin-syntax templates from brief |
| `POST` | `/ai/generate-templates` | Generate templates (no campaign required) |
| `POST` | `/ai/analyze-reply` | Sentiment + intent classification |
| `POST` | `/ai/optimize` | A/B variant ranking by reply rate |

### Analytics
| Method | Path | Description |
|---|---|---|
| `GET` | `/analytics/overview` | Funnel metrics (sent → replied) |
| `GET` | `/analytics/daily` | Daily send volume (last 30 days) |
| `GET` | `/analytics/reply-rates` | Reply rates per campaign |

### Settings
| Method | Path | Description |
|---|---|---|
| `GET` / `PATCH` | `/settings/engine` | Send engine config (delays, active hours) |
| `GET` / `PATCH` | `/settings/ai` | AI provider config |
| `GET` | `/settings/proxies` | List proxy pool |
| `POST` | `/settings/proxies` | Add proxy |
| `DELETE` | `/settings/proxies/:id` | Remove proxy |
| `POST` | `/settings/queue/purge` | Drain all queued jobs |

### Webhooks (Meta Cloud API)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/webhooks/cloud-api` | None | Meta verification challenge |
| `POST` | `/webhooks/cloud-api` | None | Delivery receipts + inbound messages |

### Queue Inspector
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/admin/queues/` | `127.0.0.1` only | Bull Board — visual queue inspector |

Point your Meta webhook at `https://your.domain.com/api/webhooks/cloud-api`.

---

## Commands

```bash
# Install dependencies
npx pnpm@9 install

# Dev (api + web hot-reload)
npx pnpm@9 dev

# Backend only
npx pnpm@9 --filter @wa-engine/api dev

# Database migrations
npx pnpm@9 --filter @wa-engine/api run prisma:migrate

# Prisma Studio (visual DB browser)
npx pnpm@9 --filter @wa-engine/api run prisma:studio

# Quality gates
npx pnpm@9 lint
npx pnpm@9 typecheck
npx pnpm@9 test

# Production (full stack)
docker compose up -d --build

# View API logs
docker compose logs -f api

# Apply migrations in production
docker compose exec api npx prisma migrate deploy
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS + TypeScript 5 (strict mode) |
| Backend | NestJS 10 + Fastify adapter |
| Queue | BullMQ v5 + Redis 7 |
| Database | PostgreSQL 16 + Prisma ORM |
| WhatsApp Mode 1 | Meta Cloud API (Graph API v21.0) |
| WhatsApp Mode 2 | `@whiskeysockets/baileys` v7 (pure WebSocket) |
| AI | Anthropic Claude API + OpenAI (fallback) |
| Realtime | Socket.io |
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Deployment | Docker Compose + Nginx + Let's Encrypt SSL |

---

## Security

- **AES-256-GCM** encryption for all Baileys session auth state at rest
- **JWT** access (15 min) + refresh (7 day) token flow, `httpOnly` cookies
- **REGISTRATION_SECRET** locks the register endpoint against unauthorized account creation
- **Nginx rate limiting** — 60 req/min per IP; webhook endpoint exempt
- **HSTS + HTTP/2 + CSP** headers on all HTTPS responses
- **Bull Board** restricted to `127.0.0.1` — SSH-tunnel access only
- Redis password-authenticated (`requirepass`) in all docker-compose configurations

---

## License

MIT — use it, fork it, ship it. A star on the repo is appreciated.

---

<div align="center">

*Built for operators who need real throughput without SaaS lock-in.*

</div>
