# OpenClaw Gym

AI-native gym programming API built for agents.

## What is this?

OpenClaw Gym is a REST API that lets AI agents manage workout programs. Agents can authenticate via Supabase, read and modify workout templates, track sessions, log sets, and analyze progress stats.

Every mutation is logged with actor type (`user` or `agent`) and an optional reasoning message, creating a full audit trail of what changed and why.

## Architecture

```
openclaw-gym/
  apps/
    api/          Express + Drizzle ORM + Supabase Auth
    web/          Next.js landing page
  exercise-catalog.json   900+ exercises
```

## Quick Start

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- PostgreSQL database (Supabase provides this)

### Setup

```bash
# Clone
git clone https://github.com/openclaw-gym/openclaw-gym.git
cd openclaw-gym

# Install dependencies
npm install

# Configure environment
cp .env.example apps/api/.env
# Edit apps/api/.env with your Supabase credentials

# Push schema to database
npm run db:push -w apps/api

# Seed exercise catalog
npm run db:seed -w apps/api

# Start development
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase Settings > API |
| `PORT` | API server port (default: 3000) |

## Agent Auth Flow

```bash
# 1. Sign up via Supabase
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "agent@example.com", "password": "secure-password"}'

# 2. Get access token
TOKEN=$(curl -s -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "agent@example.com", "password": "secure-password"}' \
  | jq -r '.access_token')

# 3. Call the API
curl -s http://localhost:3000/program/json \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Actor: agent"
```

## Agent Discovery

```
GET /.well-known/agent.json
```

Returns API metadata including auth configuration and endpoint summary, enabling agent auto-discovery.

## API Endpoints

### Program
- `GET /program/json` - Current workout program
- `GET /program/export` - Full export with history
- `POST /program/import` - Import a program
- `DELETE /program` - Delete entire program

### Templates
- `GET /templates` - List templates
- `GET /templates/:id` - Template with exercises
- `PUT /templates/:id` - Update template
- `DELETE /templates/:id` - Delete template
- `POST /templates/:id/exercises` - Add exercise
- `DELETE /templates/:tid/exercises/:eid` - Remove exercise
- `PUT /templates/:tid/exercises/:eid` - Update exercise config
- `POST /templates/:tid/exercises/:eid/replace` - Replace exercise

### Sessions
- `POST /sessions` - Start session
- `PUT /sessions/:id/complete` - Complete session
- `DELETE /sessions/:id` - Delete session
- `GET /sessions` - List sessions (date range filter)
- `GET /sessions/recent` - Recent sessions
- `GET /sessions/:id` - Full session with sets

### Sets
- `POST /sessions/:id/sets` - Log a set
- `PUT /sets/:id` - Update set
- `DELETE /sets/:id` - Delete set

### Exercises
- `GET /exercises` - Search catalog
- `GET /exercises/:id` - Exercise details

### Stats
- `GET /stats/prs` - Personal records
- `GET /stats/prs/:exerciseId` - Exercise PR
- `GET /stats/streaks` - Streak data
- `GET /stats/volume` - Volume over time
- `GET /stats/progress/:exerciseId` - Weight progression
- `GET /stats/summary` - Combined overview

### Changes
- `GET /changes` - Audit log

## Change Tracking

All mutation endpoints accept an optional `reason` field:

```json
{
  "newExerciseId": "incline_dumbbell_press",
  "reason": "Switching to incline for upper chest emphasis based on lagging progress"
}
```

Query the change log:
```bash
curl -s http://localhost:3000/changes?actor=agent \
  -H "Authorization: Bearer $TOKEN"
```

## Deployment

Both apps deploy to **Vercel**:

- **API**: Deployed as a Vercel serverless function (Express wrapped via `api/index.ts`)
- **Web**: Standard Next.js deployment

Each app is a separate Vercel project pointing to its subdirectory:

```bash
# API project: Root Directory = apps/api
# Web project: Root Directory = apps/web
```

Set the environment variables from `.env.example` in each Vercel project's settings.

## Tech Stack

- **API**: Express, Drizzle ORM, PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **Web**: Next.js, Tailwind CSS
- **Deploy**: Vercel (both API + web)
- **Build**: Turborepo, npm workspaces

## License

MIT
