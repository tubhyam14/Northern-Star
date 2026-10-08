import { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { api, apiError, type ArchitectureResult } from "../api";
import type { RepoTarget } from "./Analyze";
import { Card, EmptyState, ErrorBox, LoadingList, SectionHead, Stat, Tag } from "../components/ui";

mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });

type EdgeFilter = "overview" | "imports" | "tests" | "directories";

function filterMermaid(full: string, mode: EdgeFilter): string {
  if (mode === "overview") return full;
  const lines = full.split("\n");
  const keep = new Set<string>();
  const edges = lines.filter((l) => l.includes("-->"));
  const wanted = edges.filter((l) =>
    mode === "directories" ? l.includes('"contains"') : mode === "imports" ? l.includes('"imports"') : l.includes('"tests"'),
  );
  for (const e of wanted) {
    const [src, rest] = e.split("-->");
    const dst = rest.split("|").pop()!.trim();
    keep.add(src.trim());
    keep.add(dst);
  }
  // In directories mode, also keep directory nodes linked via contains.
  const nodes = lines.filter((l) => /^n\d+\[/.test(l.trim()));
  const out = [lines[0]];
  for (const n of nodes) {
    const id = n.trim().split("[", 1)[0];
    if (mode === "directories" ? /directory|project|backend|frontend|test/.test(n) || keep.has(id) : keep.has(id)) {
      out.push(n);
    }
  }
  // Re-resolve kept set for edges whose endpoints survived.
  const keptIds = new Set(out.slice(1).map((l) => l.trim().split("[", 1)[0]));
  for (const e of wanted) {
    const [src, rest] = e.split("-->");
    const dst = rest.split("|").pop()!.trim();
    if (keptIds.has(src.trim()) && keptIds.has(dst)) out.push(e);
  }
  return out.join("\n") + "\n";
}

function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Async Mermaid render with cleanup (canonical effect use-case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError("");
    mermaid
      .render(`ns-arch-${Math.abs(hash(code))}`, code)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) setError("Could not render this diagram view.");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) return <p className="text-[11px] font-mono text-amber-400">{error}</p>;
  return <div ref={ref} className="overflow-x-auto [&>svg]:max-w-none" />;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

export default function Architecture({ target }: { target: RepoTarget }) {
  const [data, setData] = useState<ArchitectureResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [maxNodes, setMaxNodes] = useState(120);
  const [mode, setMode] = useState<EdgeFilter>("overview");

  const load = async (cap: number) => {
    setLoading(true);
    setError("");
    try {
      setData(await api.getArchitecture(target.owner, target.repo, cap));
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetch on mount / repo change (canonical effect use-case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(maxNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.owner, target.repo]);

  const code = useMemo(() => (data?.mermaid ? filterMermaid(data.mermaid, mode) : ""), [data, mode]);

  const counts = useMemo(() => {
    if (!data) return { imports: 0, tests: 0, contains: 0 };
    return {
      imports: data.edges.filter((e) => e.relationship === "imports").length,
      tests: data.edges.filter((e) => e.relationship === "tests").length,
      contains: data.edges.filter((e) => e.relationship === "contains").length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <LoadingList rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorBox message={error} onRetry={() => load(maxNodes)} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState title="No architecture yet" sub="The graph builds automatically on this page." />
      </div>
    );
  }

  const modes: { id: EdgeFilter; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "imports", label: "Imports" },
    { id: "tests", label: "Tests" },
    { id: "directories", label: "Directories" },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Card>
        <SectionHead
          title="Architecture Map"
          sub={data.summary || `Deterministic module graph for ${target.owner}/${target.repo}.`}
          right={
            <div className="flex items-center gap-2">
              <select
                value={maxNodes}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxNodes(v);
                  load(v);
                }}
                className="bg-[#060a14] border border-gray-800 rounded px-2 py-1.5 font-mono text-[11px] text-gray-200"
              >
                {[60, 120, 200, 400].map((n) => (
                  <option key={n} value={n}>
                    max {n} nodes
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Nodes" value={data.total_nodes} />
          <Stat label="Edges" value={data.total_edges} />
          <Stat label="Imports" value={counts.imports} />
          <Stat label="Tests" value={counts.tests} />
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`font-mono text-xs px-4 py-1.5 rounded transition cursor-pointer border ${
                mode === m.id
                  ? "bg-violet-950/80 text-violet-300 border-violet-800/60 font-semibold"
                  : "bg-[#080d19] text-gray-400 border-gray-800 hover:text-gray-200"
              }`}
            >
              {m.label}
            </button>
          ))}
          <span className="font-mono text-[10px] text-gray-500 ml-1">
            Filtered views render subsets client-side — the JSON graph stays canonical.
          </span>
        </div>
      </Card>

      <Card>
        <SectionHead title={`Graph — ${modes.find((m) => m.id === mode)?.label}`} right={<Tag>flowchart TD</Tag>} />
        {code.trim().split("\n").length <= 1 ? (
          <EmptyState title="Nothing to show in this view" sub="This relationship type has no edges in the current graph. Try Overview." />
        ) : (
          <div className="bg-[#050811] border border-gray-800/60 rounded-lg p-4">
            <MermaidDiagram code={code} />
          </div>
        )}
      </Card>

      <Card>
        <SectionHead title="Key Modules" sub="Highest-signal file nodes in the graph." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.nodes
            .filter((n) => n.id.startsWith("file:"))
            .slice(0, 12)
            .map((n) => (
              <div key={n.id} className="flex items-center justify-between bg-[#080d19] border border-gray-800/70 rounded px-3 py-2">
                <span className="font-mono text-[11px] text-gray-200 truncate">{n.files?.[0] || n.label}</span>
                <Tag>{n.type}</Tag>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
