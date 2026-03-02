import { CodeBlock } from "./CodeBlock";

export function Hero() {
  const sampleCode = `# Get your current workout program
curl -s https://api.openclaw.gym/program/json \\
  -H "Authorization: Bearer \$TOKEN" | jq

{
  "data": {
    "program_name": "4-Day Upper/Lower",
    "workouts": [
      {
        "name": "Upper A",
        "exercises": [
          { "name": "Bench Press", "sets": 4, "rep_min": 6, "rep_max": 8 },
          { "name": "Barbell Row", "sets": 4, "rep_min": 6, "rep_max": 8 }
        ]
      }
    ]
  }
}`;

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Agent-Native API
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your Gym Program,{" "}
              <span className="text-accent">Powered by AI Agents</span>
            </h1>
            <p className="text-text-secondary text-lg mb-8 max-w-lg">
              The first workout programming API designed for AI agents.
              Authenticate with Supabase, read and modify programs, track
              sessions, and analyze progress -- all through a clean REST API.
            </p>
            <div className="flex gap-4">
              <a
                href="#docs"
                className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-card font-medium transition-colors"
              >
                View Docs
              </a>
              <a
                href="https://github.com/openclaw-gym/openclaw-gym"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border hover:border-text-secondary text-text-primary px-6 py-3 rounded-card font-medium transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div>
            <CodeBlock code={sampleCode} title="Terminal" />
          </div>
        </div>
      </div>
    </section>
  );
}
