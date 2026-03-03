import { EndpointCard } from "./EndpointCard";

const endpointGroups = [
  {
    name: "Program",
    endpoints: [
      { method: "GET" as const, path: "/program/json", description: "Get current workout program" },
      { method: "GET" as const, path: "/program/export", description: "Export full program with history" },
      { method: "POST" as const, path: "/program/import", description: "Import a workout program" },
      { method: "DELETE" as const, path: "/program", description: "Delete entire program" },
    ],
  },
  {
    name: "Templates",
    endpoints: [
      { method: "GET" as const, path: "/templates", description: "List workout templates with exercise counts" },
      { method: "GET" as const, path: "/templates/:id", description: "Get template with full exercise details" },
      { method: "PUT" as const, path: "/templates/:id", description: "Update template name, color, description" },
      { method: "DELETE" as const, path: "/templates/:id", description: "Delete a workout template" },
      { method: "POST" as const, path: "/templates/:id/exercises", description: "Add exercise to template" },
      { method: "DELETE" as const, path: "/templates/:tid/exercises/:eid", description: "Remove exercise from template" },
      { method: "PUT" as const, path: "/templates/:tid/exercises/:eid", description: "Update exercise sets, reps, rest" },
    ],
  },
  {
    name: "Sessions",
    endpoints: [
      { method: "POST" as const, path: "/sessions", description: "Start a new workout session" },
      { method: "PUT" as const, path: "/sessions/:id/complete", description: "Mark session as completed" },
      { method: "DELETE" as const, path: "/sessions/:id", description: "Delete a session" },
      { method: "GET" as const, path: "/sessions", description: "List completed sessions with date range filter" },
      { method: "GET" as const, path: "/sessions/recent", description: "Get most recent completed sessions" },
      { method: "GET" as const, path: "/sessions/:id", description: "Get session with all sets grouped by exercise" },
    ],
  },
  {
    name: "Sets",
    endpoints: [
      { method: "POST" as const, path: "/sessions/:id/sets", description: "Log a set (exercise, weight, reps)" },
      { method: "PUT" as const, path: "/sets/:id", description: "Update set weight or reps" },
      { method: "DELETE" as const, path: "/sets/:id", description: "Delete a set" },
    ],
  },
  {
    name: "Exercises",
    endpoints: [
      { method: "GET" as const, path: "/exercises", description: "Search exercise catalog by name, muscle group, equipment" },
      { method: "GET" as const, path: "/exercises/:id", description: "Get exercise details" },
    ],
  },
  {
    name: "Stats",
    endpoints: [
      { method: "GET" as const, path: "/stats/prs", description: "All personal records (max weight per exercise)" },
      { method: "GET" as const, path: "/stats/prs/:exerciseId", description: "PR for a specific exercise" },
      { method: "GET" as const, path: "/stats/streaks", description: "Current streak, longest streak, weekly count" },
      { method: "GET" as const, path: "/stats/volume", description: "Volume (weight x reps) over time" },
      { method: "GET" as const, path: "/stats/progress/:exerciseId", description: "Weight progression for an exercise" },
      { method: "GET" as const, path: "/stats/summary", description: "Combined streaks + top PRs" },
    ],
  },
  {
    name: "Changes",
    endpoints: [
      { method: "GET" as const, path: "/changes", description: "Query change log, filter by actor type" },
    ],
  },
];

export function ApiReference() {
  return (
    <section id="docs" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          API <span className="text-accent">Reference</span>
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
          All endpoints require a Bearer token from Supabase Auth. Every
          mutation accepts an optional <code className="text-accent text-sm">reason</code> field for audit logging.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {endpointGroups.map((group) => (
            <div
              key={group.name}
              className="bg-surface border border-border rounded-card p-5"
            >
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                {group.name}
                <span className="text-text-secondary text-xs font-normal">
                  ({group.endpoints.length})
                </span>
              </h3>
              <div>
                {group.endpoints.map((ep) => (
                  <EndpointCard key={`${ep.method}-${ep.path}`} {...ep} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
