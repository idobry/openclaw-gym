export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-lg font-bold text-text-primary">
              OpenClaw<span className="text-accent">.gym</span>
            </span>
            <p className="text-text-secondary text-sm mt-1">
              Built with Supabase, Express, Drizzle ORM
            </p>
          </div>
          <div className="flex gap-6">
            <a
              href="https://github.com/openclaw-gym/openclaw-gym"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              GitHub
            </a>
            <a
              href="#docs"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              API Docs
            </a>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Supabase
            </a>
          </div>
        </div>
        <div className="text-center text-text-secondary text-xs mt-8">
          &copy; {new Date().getFullYear()} OpenClaw. Open source under MIT License.
        </div>
      </div>
    </footer>
  );
}
