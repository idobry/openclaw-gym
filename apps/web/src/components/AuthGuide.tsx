import { CodeBlock } from "./CodeBlock";

export function AuthGuide() {
  const curlExample = `# 1. Sign up
curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "agent@example.com", "password": "secure-password"}'

# 2. Sign in and get token
TOKEN=$(curl -s -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "agent@example.com", "password": "secure-password"}' \\
  | jq -r '.access_token')

# 3. Call the API
curl -s https://api.openclaw.gym/program/json \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Actor: agent"`;

  const pythonExample = `import httpx

SUPABASE_URL = "https://your-project.supabase.co"
ANON_KEY = "your-anon-key"
API_URL = "https://api.openclaw.gym"

# Sign in
auth = httpx.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY},
    json={"email": "agent@example.com", "password": "secure-password"},
).json()

token = auth["access_token"]
headers = {"Authorization": f"Bearer {token}", "X-Actor": "agent"}

# Read current program
program = httpx.get(f"{API_URL}/program/json", headers=headers).json()
print(program["data"]["workouts"])

# Swap an exercise with reasoning
httpx.post(
    f"{API_URL}/templates/upper_a/exercises/3/replace",
    headers=headers,
    json={
        "newExerciseId": "incline_dumbbell_press",
        "reason": "Switching to incline press for upper chest emphasis"
    },
)`;

  const tsExample = `const SUPABASE_URL = "https://your-project.supabase.co";
const ANON_KEY = "your-anon-key";
const API_URL = "https://api.openclaw.gym";

// Sign in
const auth = await fetch(
  \`\${SUPABASE_URL}/auth/v1/token?grant_type=password\`,
  {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "agent@example.com",
      password: "secure-password",
    }),
  }
).then((r) => r.json());

const headers = {
  Authorization: \`Bearer \${auth.access_token}\`,
  "X-Actor": "agent",
  "Content-Type": "application/json",
};

// Get program
const program = await fetch(\`\${API_URL}/program/json\`, { headers })
  .then((r) => r.json());

// Import a new program
await fetch(\`\${API_URL}/program/import\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    program_name: "Push/Pull/Legs",
    reason: "Switching to PPL for more volume per muscle group",
    workouts: [
      {
        name: "Push Day",
        exercises: [
          { id: "barbell_bench_press", sets: 4, reps: "6-8", rest_seconds: 120 },
          { id: "overhead_press", sets: 3, reps: "8-10", rest_seconds: 90 },
        ],
      },
    ],
  }),
});`;

  return (
    <section id="auth" className="py-20 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Authentication <span className="text-accent">Guide</span>
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
          Agents authenticate directly with Supabase using email/password. No
          API keys to manage, no OAuth flows to implement.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-text-secondary font-mono text-sm bg-raised px-2 py-1 rounded">curl</span>
              Shell
            </h3>
            <CodeBlock code={curlExample} title="terminal" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-text-secondary font-mono text-sm bg-raised px-2 py-1 rounded">python</span>
              Python
            </h3>
            <CodeBlock code={pythonExample} title="agent.py" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-text-secondary font-mono text-sm bg-raised px-2 py-1 rounded">ts</span>
              TypeScript
            </h3>
            <CodeBlock code={tsExample} title="agent.ts" />
          </div>
        </div>
      </div>
    </section>
  );
}
