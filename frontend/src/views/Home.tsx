import type { View } from "../App";

const PIPELINE = ["Discover", "Understand", "Verify", "Judge", "Challenge", "Improve"];

const FEATURES: { view: View; title: string; desc: string; accent: string }[] = [
  { view: "discover", title: "Repository Discovery", desc: "Search GitHub by topic and find relevant projects to analyze.", accent: "text-cyan-400" },
  { view: "analyze", title: "Repository Intelligence", desc: "Ingest any public repo — clone, fingerprint languages, frameworks and structure.", accent: "text-cyan-400" },
  { view: "ask", title: "Evidence-Grounded Q&A", desc: "Ask anything. Every answer cites exact file:line evidence from the code.", accent: "text-emerald-400" },
  { view: "claims", title: "Claim Verification", desc: "README promises checked against implementation: supported, unclear, contradicted.", accent: "text-blue-400" },
  { view: "judge", title: "AI Project Judge", desc: "Five-dimension evaluation with a 0–100 evidence-backed score.", accent: "text-indigo-400" },
  { view: "challenges", title: "Red-Team Challenges", desc: "Adversarial review that interrogates weak claims and missing implementation.", accent: "text-rose-400" },
  { view: "improvements", title: "Improvement Engine", desc: "Concrete, prioritized next steps — problem → evidence → recommendation.", accent: "text-amber-400" },
  { view: "architecture", title: "Architecture Map", desc: "Deterministic module graph with imports, tests and Mermaid rendering.", accent: "text-violet-400" },
  { view: "trends", title: "GitHub Trends", desc: "Popular vs genuinely emerging repos, backed by stored snapshots.", accent: "text-orange-400" },
];

export default function Home({ go, analyzeDemo }: { go: (v: View) => void; analyzeDemo: () => void }) {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero */}
      <section className="text-center pt-8 pb-2">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] text-cyan-400 border border-cyan-800/60 bg-cyan-950/30 rounded-full px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          EVIDENCE-GROUNDED SOFTWARE INTELLIGENCE
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Northern Star</h1>
        <p className="mt-3 text-lg text-gray-300 font-medium">Understand. Verify. Judge. Improve.</p>
        <p className="mt-3 text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
          AI that understands, evaluates, challenges, and improves software projects —
          reasoning only over evidence retrieved from the repository's actual implementation.
          No invented files. No hallucinated citations. Every claim traces to code.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={analyzeDemo}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-mono text-sm px-6 py-2.5 rounded-lg font-medium transition cursor-pointer"
          >
            Analyze a Repository →
          </button>
          <button
            onClick={() => go("discover")}
            className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-200 font-mono text-sm px-6 py-2.5 rounded-lg transition cursor-pointer border border-gray-700/60"
          >
            Explore GitHub
          </button>
        </div>
      </section>

      {/* Pipeline */}
      <section className="bg-[#0b101f] border border-gray-800/90 rounded-xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-4 text-center">
          How Northern Star works
        </p>
        <div className="flex items-center justify-center flex-wrap gap-1">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="bg-[#080d19] border border-gray-800 rounded-lg px-4 py-2.5 text-center min-w-[110px]">
                <div className="font-mono text-[10px] text-gray-500">0{i + 1}</div>
                <div className="font-mono text-xs font-semibold text-gray-100 mt-0.5">{step}</div>
              </div>
              {i < PIPELINE.length - 1 && <span className="text-cyan-600 font-mono px-1.5">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <button
            key={f.view}
            onClick={() => go(f.view)}
            className="text-left bg-[#0b101f] border border-gray-800/90 rounded-xl p-5 hover:border-gray-600 transition cursor-pointer group"
          >
            <h3 className={`font-mono text-xs font-semibold uppercase tracking-wider ${f.accent}`}>{f.title}</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{f.desc}</p>
            <span className="inline-block mt-3 font-mono text-[11px] text-gray-500 group-hover:text-cyan-400 transition">
              Open →
            </span>
          </button>
        ))}
      </section>

      {/* Principle */}
      <section className="bg-[#080d19] border border-gray-800/80 rounded-xl p-5 text-center">
        <p className="font-mono text-xs text-gray-300 italic">
          “LLMs reason; evidence determines what can be claimed.”
        </p>
        <p className="text-[11px] text-gray-500 mt-2">
          Unauthenticated demo talks to the local backend at 127.0.0.1:8000 — start it with uvicorn before exploring.
        </p>
      </section>
    </div>
  );
}
