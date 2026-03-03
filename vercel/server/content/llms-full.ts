export const LLMS_FULL_TXT = `# OpenClaw Gym API -- Full Reference

> Agent-native gym tracking API -- your agent IS the coach.

Base URL: \`https://openclaw-gym-api.vercel.app\`

---

## Authentication

Three auth methods, checked in order:

1. **API Key** (recommended for agents): \`X-API-Key: gym_<uuid>\`
2. **Bearer token**: \`Authorization: Bearer <jwt>\`

Set \`X-Actor: agent\` on every request so mutations are attributed correctly in the audit log.

### Register

\`\`\`
POST /auth/register
Content-Type: application/json

{ "email": "user@example.com", "password": "secret", "displayName": "Jane" }
\`\`\`

Response (201):
\`\`\`json
{ "data": { "userId": "uuid", "token": "jwt", "refreshToken": "jwt" } }
\`\`\`

### Login

\`\`\`
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "secret" }
\`\`\`

Response (200):
\`\`\`json
{ "data": { "userId": "uuid", "token": "jwt", "refreshToken": "jwt" } }
\`\`\`

### Refresh Token

\`\`\`
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "jwt" }
\`\`\`

Response (200):
\`\`\`json
{ "data": { "token": "jwt", "refreshToken": "jwt" } }
\`\`\`

Access tokens expire in 7 days. Refresh tokens expire in 30 days.

### Generate API Key

\`\`\`
POST /auth/api-key
Authorization: Bearer <token>
Content-Type: application/json

{ "label": "my-agent" }
\`\`\`

Response (201):
\`\`\`json
{ "data": { "id": "uuid", "key": "gym_abc123", "label": "my-agent" } }
\`\`\`

The raw key is shown only once. Store it securely.

### Delete API Key

\`\`\`
DELETE /auth/api-key/:id
Authorization: Bearer <token>
\`\`\`

Response (200):
\`\`\`json
{ "data": { "deleted": true } }
\`\`\`

---

## Response Format

All successful responses wrap data in:
\`\`\`json
{ "data": <payload> }
\`\`\`

Errors return:
\`\`\`json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
\`\`\`

Common error codes: \`BAD_REQUEST\` (400), \`UNAUTHORIZED\` (401), \`NOT_FOUND\` (404), \`CONFLICT\` (409), \`INTERNAL_ERROR\` (500).

---

## Mutation Reasoning

Most mutation endpoints accept an optional \`reason\` field in the request body. This is logged in the audit trail and helps the user understand why an agent made a change. Always include a reason when modifying templates or importing programs.

---

## Exercises

### Search Exercises

\`\`\`
GET /exercises?q=bench&muscle=chest&equipment=barbell&limit=50
\`\`\`

Query params:
- \`q\` (string) -- search by name (case-insensitive)
- \`muscle\` (string) -- filter by muscle group
- \`equipment\` (string) -- filter by equipment type
- \`limit\` (number, default 50, max 200)

Response (200):
\`\`\`json
{ "data": [{ "id": "uuid", "name": "Bench Press", "muscleGroup": "chest", "equipment": "barbell", "mediaSlug": "bench-press" }] }
\`\`\`

### Get Exercise

\`\`\`
GET /exercises/:id
\`\`\`

Response (200):
\`\`\`json
{ "data": { "id": "uuid", "name": "Bench Press", "muscleGroup": "chest", "equipment": "barbell", "mediaSlug": "bench-press" } }
\`\`\`

---

## Templates

### List Templates

\`\`\`
GET /templates
\`\`\`

Response (200):
\`\`\`json
{ "data": [{ "id": "uuid", "name": "Push Day", "dayLabel": "Monday", "color": "#6C5CE7", "description": "Chest, shoulders, triceps", "sortOrder": 0, "exerciseCount": 6 }] }
\`\`\`

### Get Template

\`\`\`
GET /templates/:id
\`\`\`

Response (200):
\`\`\`json
{
  "data": {
    "id": "uuid", "name": "Push Day", "dayLabel": "Monday", "color": "#6C5CE7",
    "exercises": [{
      "id": "template-exercise-uuid",
      "exerciseId": "catalog-exercise-uuid",
      "name": "Bench Press", "muscleGroup": "chest", "equipment": "barbell",
      "sets": 3, "repRangeMin": 8, "repRangeMax": 12, "restSeconds": 90,
      "sortOrder": 0, "notes": null, "mediaSlug": "bench-press"
    }]
  }
}
\`\`\`

Note: \`id\` is the template-exercise ID (used for PUT/DELETE). \`exerciseId\` is the catalog exercise ID.

### Update Template

\`\`\`
PUT /templates/:id
Content-Type: application/json

{ "name": "Push A", "color": "#FF6B6B", "reason": "Renamed for clarity" }
\`\`\`

Body fields (all optional): \`name\`, \`color\`, \`description\`, \`dayLabel\`, \`reason\`.

### Delete Template

\`\`\`
DELETE /templates/:id
Content-Type: application/json

{ "reason": "Removing unused template" }
\`\`\`

### Add Exercise to Template

\`\`\`
POST /templates/:id/exercises
Content-Type: application/json

{
  "exerciseId": "catalog-exercise-uuid",
  "sets": 3,
  "repRangeMin": 8,
  "repRangeMax": 12,
  "restSeconds": 90,
  "reason": "Adding incline press for upper chest"
}
\`\`\`

Body: \`exerciseId\` (required). Optional: \`sets\` (default 3), \`repRangeMin\` (default 8), \`repRangeMax\` (default 12), \`restSeconds\` (default 90), \`reason\`.

### Remove Exercise from Template

\`\`\`
DELETE /templates/:tid/exercises/:eid
Content-Type: application/json

{ "reason": "Replaced with dumbbell variant" }
\`\`\`

\`:eid\` is the template-exercise ID (not the catalog exercise ID).

### Update Template Exercise

\`\`\`
PUT /templates/:tid/exercises/:eid
Content-Type: application/json

{ "sets": 4, "repRangeMin": 6, "repRangeMax": 8, "reason": "Switching to strength rep range" }
\`\`\`

Body fields (all optional): \`sets\`, \`repRangeMin\`, \`repRangeMax\`, \`restSeconds\`, \`reason\`.

### Replace Exercise in Template

\`\`\`
POST /templates/:tid/exercises/:eid/replace
Content-Type: application/json

{ "newExerciseId": "catalog-exercise-uuid", "reason": "Swapping for shoulder-friendly alternative" }
\`\`\`

Keeps the same template position and settings, only swaps the exercise.

---

## Sessions

### Create Session

\`\`\`
POST /sessions
Content-Type: application/json

{ "templateId": "uuid", "date": "2025-01-15" }
\`\`\`

Response (201):
\`\`\`json
{ "data": { "id": "uuid", "templateId": "uuid", "date": "2025-01-15", "startedAt": "2025-01-15T10:30:00Z", "completedAt": null, "notes": null } }
\`\`\`

### Complete Session

\`\`\`
PUT /sessions/:id/complete
Content-Type: application/json

{ "notes": "Felt strong today, increased bench by 2.5kg" }
\`\`\`

### Delete Session

\`\`\`
DELETE /sessions/:id
\`\`\`

### List Sessions

\`\`\`
GET /sessions?from=2025-01-01&to=2025-01-31&limit=20
\`\`\`

Query params:
- \`from\` (ISO date) -- start date filter
- \`to\` (ISO date) -- end date filter
- \`limit\` (number, default 20, max 100)

Returns only completed sessions, ordered by date descending.

Response (200):
\`\`\`json
{ "data": [{ "id": "uuid", "templateId": "uuid", "templateName": "Push Day", "templateColor": "#6C5CE7", "date": "2025-01-15", "startedAt": "...", "completedAt": "...", "notes": null }] }
\`\`\`

### Get Session Dates

\`\`\`
GET /sessions/dates
\`\`\`

Response (200):
\`\`\`json
{ "data": [{ "date": "2025-01-15", "templateId": "uuid", "color": "#6C5CE7" }] }
\`\`\`

Useful for rendering calendar views.

### Get Recent Sessions

\`\`\`
GET /sessions/recent?limit=5
\`\`\`

Query params: \`limit\` (number, default 5, max 50).

### Get Session Detail

\`\`\`
GET /sessions/:id
\`\`\`

Response (200):
\`\`\`json
{
  "data": {
    "id": "uuid", "templateId": "uuid", "templateName": "Push Day",
    "date": "2025-01-15", "startedAt": "...", "completedAt": "...",
    "exercises": [{
      "exerciseId": "uuid", "exerciseName": "Bench Press",
      "muscleGroup": "chest", "equipment": "barbell",
      "sets": [{ "id": "uuid", "setNumber": 1, "weight": 80, "reps": 10, "isWarmup": false }]
    }]
  }
}
\`\`\`

---

## Sets

### Log a Set

\`\`\`
POST /sessions/:sessionId/sets
Content-Type: application/json

{ "exerciseId": "catalog-exercise-uuid", "setNumber": 1, "weight": 80, "reps": 10, "isWarmup": false }
\`\`\`

Body: \`exerciseId\` (required), \`setNumber\` (required). Optional: \`weight\`, \`reps\`, \`isWarmup\`.

### Update a Set

\`\`\`
PUT /sets/:id
Content-Type: application/json

{ "weight": 82.5, "reps": 8 }
\`\`\`

### Delete a Set

\`\`\`
DELETE /sets/:id
\`\`\`

---

## Stats

### Personal Records

\`\`\`
GET /stats/prs?limit=20
\`\`\`

Response (200):
\`\`\`json
{ "data": [{ "exercise_id": "uuid", "exercise_name": "Bench Press", "max_weight": 100, "reps_at_max": 5, "date": "2025-01-10" }] }
\`\`\`

Excludes warmup sets.

### Single Exercise PR

\`\`\`
GET /stats/prs/:exerciseId
\`\`\`

Response (200):
\`\`\`json
{ "data": { "max_weight": 100, "reps": 5 } }
\`\`\`

### Streaks

\`\`\`
GET /stats/streaks
\`\`\`

Response (200):
\`\`\`json
{ "data": { "currentStreak": 3, "longestStreak": 8, "thisWeek": 2, "totalWorkouts": 47 } }
\`\`\`

Streak = consecutive weeks with 3+ workouts.

### Volume Over Time

\`\`\`
GET /stats/volume?weeks=8
\`\`\`

Query params: \`weeks\` (number, default 8, max 52).

Response (200):
\`\`\`json
{ "data": [{ "date": "2025-01-15", "total_volume": 12500 }] }
\`\`\`

Volume = sum of (weight * reps) per session.

### Exercise Progress

\`\`\`
GET /stats/progress/:exerciseId?limit=30
\`\`\`

Query params: \`limit\` (number, default 30, max 100).

Response (200):
\`\`\`json
{ "data": [{ "date": "2025-01-15", "max_weight": 80, "best_set_reps": 10 }] }
\`\`\`

### Summary

\`\`\`
GET /stats/summary
\`\`\`

Response (200):
\`\`\`json
{
  "data": {
    "streaks": { "current": 3, "longest": 8, "thisWeek": 2, "total": 47 },
    "prs": [{ "exercise_id": "uuid", "exercise_name": "Bench Press", "max_weight": 100, "reps_at_max": 5, "date": "2025-01-10" }]
  }
}
\`\`\`

Top 5 PRs included.

---

## Program

### Import Program

\`\`\`
POST /program/import
Content-Type: application/json

{
  "program_name": "PPL Split",
  "workouts": [
    {
      "name": "Push Day",
      "color": "#6C5CE7",
      "description": "Chest, shoulders, triceps",
      "exercises": [
        { "name": "Bench Press", "muscle_group": "chest", "equipment": "barbell", "sets": 3, "rep_min": 8, "rep_max": 12, "rest_seconds": 90 }
      ]
    }
  ],
  "reason": "Setting up initial PPL program"
}
\`\`\`

Response (201):
\`\`\`json
{ "data": { "success": true, "templateCount": 3 } }
\`\`\`

**Warning: Import is destructive.** It deletes all existing templates before creating new ones. Max 7 workout days.

Exercises can reference the catalog by \`id\`, or be matched by \`name\`/\`muscle_group\`/\`equipment\`.

### Export All Data

\`\`\`
GET /program/export
\`\`\`

Response (200):
\`\`\`json
{
  "data": {
    "program_name": "PPL Split",
    "settings": { "weight_unit": "kg" },
    "exercises": [...],
    "workouts": {...},
    "history": [...],
    "exported_at": "2025-01-15T12:00:00Z"
  }
}
\`\`\`

Full backup including workout history.

### Get Program JSON

\`\`\`
GET /program/json
\`\`\`

Returns just the current program structure without history. Useful for reading the program before making modifications.

### Delete Program

\`\`\`
DELETE /program
\`\`\`

Deletes all templates for the user.

---

## Audit Log

### Get Changes

\`\`\`
GET /changes?actor=agent&limit=20
\`\`\`

Query params:
- \`actor\` (string, "user" or "agent") -- filter by who made the change
- \`limit\` (number, default 20, max 100)

Response (200):
\`\`\`json
{ "data": [{ "userId": "uuid", "actor": "agent", "action": "template.update", "entityType": "template", "entityId": "uuid", "diff": { "before": {...}, "after": {...} }, "message": "Swapped lat pulldown for pull-ups", "createdAt": "2025-01-15T12:00:00Z" }] }
\`\`\`

---

## Agent Coaching Guidelines

1. **Always read before modifying.** Fetch the current program (\`GET /program/json\`) and template details (\`GET /templates/:id\`) before making changes. Never assume the current state.

2. **Include reasons on mutations.** Every template edit, exercise swap, and program import should include a \`reason\` field explaining the coaching rationale.

3. **Use X-Actor: agent.** Set this header on every request so the audit log correctly attributes changes to the agent vs. the user.

4. **Respect progressive overload.** When suggesting weight increases, follow standard progressions: +2.5kg for isolation/dumbbell movements, +5kg for barbell compounds.

5. **Check the exercise catalog.** Before using an exercise ID, search \`GET /exercises?q=...\` to find the correct catalog ID. Do not guess IDs.

6. **Template exercise IDs vs catalog IDs.** Template endpoints use template-exercise IDs (\`/templates/:tid/exercises/:eid\`). The \`:eid\` is the template-exercise assignment ID, not the catalog exercise ID. Get these from \`GET /templates/:id\`.

7. **Import is destructive.** \`POST /program/import\` deletes all existing templates first. Always export (\`GET /program/export\`) before importing to preserve history and allow rollback.
`;
