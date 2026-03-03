export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Authenticate",
      description: "Sign up via Supabase Auth, get a JWT access token.",
      accent: "text-accent",
    },
    {
      num: "02",
      title: "Read Program",
      description:
        "GET /program/json to understand the current workout structure.",
      accent: "text-success",
    },
    {
      num: "03",
      title: "Analyze",
      description:
        "Review workout history, PRs, streaks, and volume trends.",
      accent: "text-accent",
    },
    {
      num: "04",
      title: "Modify",
      description:
        "Update templates, swap exercises, adjust sets and rep ranges.",
      accent: "text-success",
    },
    {
      num: "05",
      title: "Track Results",
      description:
        "Monitor sessions and adapt the program based on progress data.",
      accent: "text-accent",
    },
  ];

  return (
    <section className="py-20 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How It <span className="text-accent">Works</span>
        </h2>

        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div
                className={`text-4xl font-extrabold ${step.accent} mb-3 opacity-30`}
              >
                {step.num}
              </div>
              <h3 className="font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
