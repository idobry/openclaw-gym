export function AgenticApproach() {
  const cards = [
    {
      icon: "🔐",
      title: "Agent-Native Auth",
      description:
        "Supabase-powered authentication. Agents sign up, get a JWT, and call the API. No API key dance, no OAuth complexity.",
    },
    {
      icon: "📝",
      title: "Transparent Changes",
      description:
        "Every mutation is logged with actor type and reasoning. Know exactly what your agent changed and why.",
    },
    {
      icon: "💪",
      title: "Full Program Control",
      description:
        "Same power as the app itself. Create templates, swap exercises, adjust rep ranges, import entire programs.",
    },
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for Agents, <span className="text-accent">Not Just Humans</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Inspired by the "markdown for agents" philosophy. Every endpoint
            returns clean, structured JSON. Every mutation accepts a reason
            field for audit trails. Discovery via{" "}
            <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-sm">
              /.well-known/agent.json
            </code>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-surface border border-border rounded-card p-6 hover:border-accent/50 transition-colors"
            >
              <span className="text-3xl mb-4 block">{card.icon}</span>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">
                {card.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
