import { useState } from "react";
import { api, apiError, type RepoManifest } from "../api";
import type { View } from "../App";
import { Card, EmptyState, ErrorBox, SectionHead, TextInput, PrimaryButton, Stat } from "../components/ui";

const STAGES = ["Connecting to repository", "Scanning files", "Building evidence index", "Ready for analysis"];

export interface RepoTarget {
  owner: string;
  repo: string;
}

export default function Analyze({
  target,
  setTarget,
  go,
}: {
  target: RepoTarget;
  setTarget: (t: RepoTarget) => void;
  go: (v: View) => void;
}) {
  const [url, setUrl] = useState(`https://github.com/${target.owner}/${target.repo}`);
  const [stage, setStage] = useState(-1);
  const [manifest, setManifest] = useState<RepoManifest | null>(null);
  const [error, setError] = useState("");

  const parseTarget = (value: string): RepoTarget | null => {
    const cleaned = value.trim().replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git\/?$/, "").replace(/\/$/, "");
    const [owner, repo] = cleaned.split("/");
    if (!owner || !repo) return null;
    return { owner: owner.toLowerCase(), repo: repo.toLowerCase() };
  };

  const run = async () => {
    const t = parseTarget(url);
    if (!t) {
      setError("Enter a valid GitHub URL like https://github.com/owner/repo.");
      return;
    }
    setError("");
    setManifest(null);
    try {
      setStage(0);
      setTarget(t);
      await api.ingestRepo(`https://github.com/${t.owner}/${t.repo}`);
      setStage(1);
      // Manifest carries the scan results.
      const m = await api.getManifest(t.owner, t.repo);
      setManifest(m);
      setStage(2);
      await api.indexRepo(t.owner, t.repo);
      setStage(3);
    } catch (err) {
      setError(apiError(err));
      setStage(-1);
    }
  };

  const loadExisting = async () => {
    const t = parseTarget(url);
    if (!t) {
      setError("Enter a valid GitHub URL first.");
      return;
    }
    setError("");
    try {
      const m = await api.getManifest(t.owner, t.repo);
      setTarget(t);
      setManifest(m);
      setStage(3);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const languages = (() => {
    const l = manifest?.languages;
    if (Array.isArray(l)) return l.map((x) => x.language);
    if (l && typeof l === "object") return Object.keys(l);
    return [];
  })();

  const quick: { view: View; label: string; desc: string }[] = [
    { view: "ask", label: "Ask", desc: "Grounded Q&A" },
    { view: "architecture", label: "Architecture", desc: "Module map" },
    { view: "claims", label: "Verify Claims", desc: "README audit" },
    { view: "judge", label: "Judge", desc: "0–100 score" },
    { view: "challenges", label: "Challenges", desc: "Red-team" },
    { view: "improvements", label: "Improvements", desc: "Next steps" },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Card>
        <SectionHead title="Analyze a Repository" sub="Clone → fingerprint → index. Stages below track real API operations." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="flex flex-wrap gap-2"
        >
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 min-w-[240px]"
          />
          <PrimaryButton type="submit" disabled={stage >= 0 && stage < 3}>
            {stage >= 0 && stage < 3 ? "Working..." : "Analyze Repository"}
          </PrimaryButton>
          <button
            type="button"
            onClick={loadExisting}
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-mono text-xs px-4 py-2 rounded transition cursor-pointer border border-gray-700/60"
          >
            Load existing
          </button>
        </form>

        {stage >= 0 && stage < 3 && (
          <div className="mt-4 space-y-2">
            {STAGES.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2 font-mono text-xs">
                <span className={i <= stage ? "text-cyan-400" : "text-gray-600"}>
                  {i < stage ? "✓" : i === stage ? "◌" : "○"}
                </span>
                <span className={i <= stage ? "text-gray-200" : "text-gray-600"}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && <ErrorBox message={error} onRetry={run} />}

      {manifest ? (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-lg font-bold text-white">
                  {manifest.owner}/{manifest.repo}
                </h3>
                {manifest.github_url && (
                  <a href={manifest.github_url} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300">
                    {manifest.github_url}
                  </a>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-mono text-[11px] text-gray-400">
                  {manifest.default_branch && <span>Branch: {manifest.default_branch}</span>}
                  {manifest.commit_hash && <span>Commit: {String(manifest.commit_hash).slice(0, 8)}</span>}
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                INDEXED ✓
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Total files" value={Number(manifest.total_files ?? 0)} />
              <Stat label="Source files" value={Number(manifest.source_files ?? 0)} />
              <Stat label="Languages" value={languages.length} sub={languages.slice(0, 3).join(", ")} />
              <Stat label="Frameworks" value={(manifest.frameworks || []).length} sub={(manifest.frameworks || []).slice(0, 2).map((f) => f.name).join(", ")} />
            </div>
          </Card>

          <Card>
            <SectionHead title="What next?" sub="Each step reasons over the indexed evidence." />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quick.map((q) => (
                <button
                  key={q.view}
                  onClick={() => go(q.view)}
                  className="bg-[#080d19] border border-gray-800 rounded-lg p-4 text-center hover:border-cyan-600/60 transition cursor-pointer"
                >
                  <div className="font-mono text-xs font-semibold text-gray-100">{q.label}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{q.desc}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        stage === -1 && (
          <EmptyState
            title="No repository analyzed yet"
            sub="Enter a public GitHub URL above, or pick Load existing for an already-ingested repo (try pallets/flask)."
          />
        )
      )}
    </div>
  );
}
