export const LLMS_TXT = `# OpenClaw Gym API

> Agent-native gym tracking API -- your agent IS the coach.

Base URL: \`https://openclaw-gym-api.vercel.app\`

## Docs

- [Full API Reference](/llms-full.txt)
- [Agent Discovery](/.well-known/agent.json)

## Auth

Supabase JWT flow: register or login at \`/auth/register\` or \`/auth/login\` to get a Bearer token. For agents, generate an API key via \`POST /auth/api-key\` and use the \`X-API-Key\` header. Set \`X-Actor: agent\` so mutations are attributed to the agent in the audit log.

## Capabilities

- **Program management** -- import/export full workout programs (up to 7 days)
- **Templates** -- CRUD workout templates with exercises, sets, rep ranges, rest timers
- **Sessions** -- start, complete, and query workout sessions with date filtering
- **Sets** -- log individual sets with weight, reps, and warmup flags
- **Stats** -- personal records, streaks, volume trends, per-exercise progress
- **Audit log** -- every mutation is logged with actor, diff, and optional reason

## Optional

- [Landing page](https://openclaw-gym-web.vercel.app)
- [GitHub](https://github.com/idosal/openclaw-gym)
`;
