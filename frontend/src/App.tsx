import { Suspense, lazy, useState } from "react";
import Home from "./views/Home";
import Discover from "./views/Discover";
import Analyze, { type RepoTarget } from "./views/Analyze";
import Ask from "./views/Ask";
import Claims from "./views/Claims";
import Judge from "./views/Judge";
import Challenges from "./views/Challenges";
import Improvements from "./views/Improvements";
import Trends from "./views/Trends";

// Mermaid pulls in a large diagram bundle — lazy-load so first paint stays fast.
const Architecture = lazy(() => import("./views/Architecture"));

export type View =
  | "home"
  | "discover"
  | "analyze"
  | "ask"
  | "claims"
  | "judge"
  | "challenges"
  | "improvements"
  | "architecture"
  | "trends";

const NAV: { id: View; label: string; group: string }[] = [
  { id: "home", label: "Home", group: "" },
  { id: "discover", label: "Discover", group: "Find" },
  { id: "trends", label: "Trends", group: "Find" },
  { id: "analyze", label: "Analyze Project", group: "Evaluate" },
  { id: "ask", label: "Ask", group: "Evaluate" },
  { id: "architecture", label: "Architecture", group: "Evaluate" },
  { id: "claims", label: "Verify Claims", group: "Evaluate" },
  { id: "judge", label: "Judge", group: "Evaluate" },
  { id: "challenges", label: "Challenges", group: "Evaluate" },
  { id: "improvements", label: "Improvements", group: "Evaluate" },
];

const NEEDS_REPO: Set<View> = new Set(["ask", "architecture", "claims", "judge", "challenges", "improvements"]);

export default function App() {
  const [view, setView] = useState<View>("home");
  const [target, setTarget] = useState<RepoTarget>({ owner: "pallets", repo: "flask" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const go = (v: View) => {
    setView(v);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  const analyzeRepo = (owner: string, repo: string) => {
    setTarget({ owner: owner.toLowerCase(), repo: repo.toLowerCase() });
    go("analyze");
  };

  const analyzeDemo = () => go("analyze");

  const groups: { group: string; items: typeof NAV }[] = [];
  for (const n of NAV) {
    const last = groups[groups.length - 1];
    if (last && last.group === n.group) last.items.push(n);
    else groups.push({ group: n.group, items: [n] });
  }
  const nav = (
    <nav className="space-y-1">
      {groups.map((g) => (
        <div key={g.group || "top"}>
          {g.group && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-600 px-3 pt-4 pb-1">
              {g.group}
            </p>
          )}
          {g.items.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`w-full text-left font-mono text-xs px-3 py-2 rounded-lg transition cursor-pointer ${
                view === n.id
                  ? "bg-gray-800 text-white font-semibold border border-gray-700/60"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-900/60 border border-transparent"
              }`}
            >
              {n.label}
              {NEEDS_REPO.has(n.id) && (
                <span className="block text-[10px] font-normal text-gray-500 truncate">
                  {target.owner}/{target.repo}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-200 flex flex-col font-sans selection:bg-cyan-500/20">
      {/* Top bar */}
      <header className="border-b border-gray-800/80 bg-[#0b101e]/90 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-400 hover:text-white font-mono text-lg px-1 cursor-pointer"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <button onClick={() => go("home")} className="flex items-center gap-3 cursor-pointer">
            <span className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="absolute w-4 h-4 rounded-full bg-cyan-400/30 animate-ping" />
            </span>
            <span className="font-mono text-sm tracking-wider font-semibold text-white">
              NORTHERN STAR <span className="text-gray-500 font-normal hidden sm:inline">/ CODE INTELLIGENCE</span>
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline font-mono text-[11px] text-gray-500 border border-gray-800 rounded px-2.5 py-1">
            {target.owner}/{target.repo}
          </span>
          <button
            onClick={() => go("analyze")}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-mono text-xs px-3.5 py-1.5 rounded-md font-medium transition cursor-pointer"
          >
            Analyze
          </button>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-[1700px] mx-auto">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-gray-800/60 p-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {nav}
          <div className="mt-6 bg-[#0b101f] border border-gray-800/80 rounded-lg p-3">
            <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">Demo flow</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Analyze → Architecture → Ask → Verify → Judge → Challenges → Improvements → Trends.
            </p>
          </div>
        </aside>

        {/* Sidebar (mobile drawer) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b101e] border-r border-gray-800 p-4 overflow-y-auto">
              {nav}
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          {view === "home" && <Home go={go} analyzeDemo={analyzeDemo} />}
          {view === "discover" && <Discover onAnalyze={analyzeRepo} />}
          {view === "analyze" && <Analyze target={target} setTarget={setTarget} go={go} />}
          {view === "ask" && <Ask target={target} />}
          {view === "claims" && <Claims target={target} />}
          {view === "judge" && <Judge target={target} />}
          {view === "challenges" && <Challenges target={target} go={go} />}
          {view === "improvements" && <Improvements target={target} />}
          {view === "architecture" && (
            <Suspense
              fallback={
                <div className="space-y-3 max-w-6xl mx-auto">
                  <div className="animate-pulse bg-gray-800/60 rounded-xl h-40" />
                  <div className="animate-pulse bg-gray-800/60 rounded-xl h-64" />
                </div>
              }
            >
              <Architecture target={target} />
            </Suspense>
          )}
          {view === "trends" && <Trends onAnalyze={analyzeRepo} />}
        </main>
      </div>

      <footer className="border-t border-gray-800/60 px-6 py-3 text-center font-mono text-[10px] text-gray-600">
        Northern Star — LLMs reason; evidence determines what can be claimed.
      </footer>
    </div>
  );
}
