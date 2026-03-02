const discoveryEndpoints = [
  {
    path: "/llms.txt",
    label: "llms.txt",
    description:
      "Concise API overview following the llmstxt.org standard. Auth, capabilities, and links in one page.",
  },
  {
    path: "/llms-full.txt",
    label: "llms-full.txt",
    description:
      "Complete API reference with every endpoint, parameter, response shape, and agent coaching guidelines.",
  },
  {
    path: "/.well-known/agent.json",
    label: "agent.json",
    description:
      "Structured discovery with capabilities, hints, and endpoint maps. The starting point for any agent.",
  },
];

const API_BASE = "https://openclaw-gym-api.vercel.app";

export function AgentDiscovery() {
  return (
    <section id="discovery" className="py-20 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Agent <span className="text-accent">Discovery</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Three standard endpoints let any AI agent find, understand, and use
            the API automatically. No docs to read, no SDK to install.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {discoveryEndpoints.map((ep) => (
            <a
              key={ep.path}
              href={`${API_BASE}${ep.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface border border-border rounded-card p-6 hover:border-accent/50 transition-colors group"
            >
              <code className="text-accent text-sm font-mono bg-accent/10 px-2 py-1 rounded mb-3 inline-block group-hover:bg-accent/20 transition-colors">
                {ep.path}
              </code>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">
                {ep.label}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {ep.description}
              </p>
            </a>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-card p-6 max-w-2xl mx-auto">
          <p className="text-text-secondary text-sm mb-3">
            How an agent starts:
          </p>
          <pre className="text-sm font-mono text-text-primary bg-bg rounded-lg p-4 overflow-x-auto">
            <code>{`curl -s ${API_BASE}/llms.txt`}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
