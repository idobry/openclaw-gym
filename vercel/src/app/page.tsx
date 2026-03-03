import { Hero } from "@/components/Hero";
import { AgenticApproach } from "@/components/AgenticApproach";
import { AgentDiscovery } from "@/components/AgentDiscovery";
import { HowItWorks } from "@/components/HowItWorks";
import { ApiReference } from "@/components/ApiReference";
import { AuthGuide } from "@/components/AuthGuide";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-text-primary">
              OpenClaw<span className="text-accent">.gym</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors text-sm">Features</a>
            <a href="#discovery" className="text-text-secondary hover:text-text-primary transition-colors text-sm">Discovery</a>
            <a href="#docs" className="text-text-secondary hover:text-text-primary transition-colors text-sm">Docs</a>
            <a href="#auth" className="text-text-secondary hover:text-text-primary transition-colors text-sm">Auth</a>
            <a
              href="https://github.com/openclaw-gym/openclaw-gym"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              GitHub
            </a>
            <a
              href="#docs"
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-card text-sm font-medium transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <Hero />
      <AgenticApproach />
      <AgentDiscovery />
      <HowItWorks />
      <ApiReference />
      <AuthGuide />
      <Footer />
    </main>
  );
}
