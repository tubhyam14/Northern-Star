import { useEffect, useState } from "react";
import { api, apiError, type HistoryResult, type TrendResult, type TrendingResult } from "../api";
import { Card, EmptyState, ErrorBox, LoadingList, SectionHead, PrimaryButton, Tag, GhostButton } from "../components/ui";

function RankDelta({ change }: { change?: number | null }) {
  if (change === null || change === undefined)
    return <span className="font-mono text-[11px] text-gray-500">— no history</span>;
  if (change > 0) return <span className="font-mono text-[11px] text-emerald-400 font-bold">↑ +{change} up</span>;
  if (change < 0) return <span className="font-mono text-[11px] text-rose-400 font-bold">↓ {change} down</span>;
  return <span className="font-mono text-[11px] text-gray-400">— unchanged</span>;
}

export default function Trends({ onAnalyze }: { onAnalyze: (owner: string, repo: string) => void }) {
  const [tab, setTab] = useState<"popular" | "emerging">("popular");
  const [window, setWindow] = useState("7d");
  const [limit] = useState(20);
  const [popular, setPopular] = useState<TrendingResult | null>(null);
  const [emerging, setEmerging] = useState<TrendResult | null>(null);
  const [history, setHistory] = useState<HistoryResult | null>(null);
  const [historyFor, setHistoryFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapMsg, setSnapMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, e] = await Promise.all([api.trending(limit), api.trends(window, limit)]);
      setPopular(p);
      setEmerging(e);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetch on mount / window change (canonical effect use-case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const openHistory = async (fullName: string) => {
    const [owner, repo] = fullName.split("/");
    setHistoryFor(fullName);
    setHistory(null);
    try {
      setHistory(await api.repoHistory(owner, repo, "30d"));
    } catch (err) {
      setError(apiError(err));
    }
  };

  const snapshot = async () => {
    setSnapMsg("Capturing...");
    try {
      const res = await api.captureSnapshot(100);
      setSnapMsg(`Snapshot captured: ${res.new_rows} new rows at ${res.snapshot_at}. Trends improve as snapshots accumulate.`);
      load();
    } catch (err) {
      setSnapMsg(apiError(err));
    }
  };

  const analyze = (fullName: string) => {
    const [owner, repo] = fullName.split("/");
    onAnalyze(owner, repo);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Card>
        <SectionHead
          title="Trend Intelligence"
          sub="Popular ≠ Emerging. Popularity is current size; emergence is proven recent growth from stored snapshots."
          right={
            <div className="flex items-center gap-2">
              <select
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                className="bg-[#060a14] border border-gray-800 rounded px-2 py-1.5 font-mono text-[11px] text-gray-200"
              >
                {["24h", "7d", "30d"].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <GhostButton onClick={snapshot}>Capture snapshot</GhostButton>
            </div>
          }
        />
        {snapMsg && <p className="font-mono text-[11px] text-cyan-400 mb-3">{snapMsg}</p>}
        <div className="flex gap-2">
          {(["popular", "emerging"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-xs px-5 py-1.5 rounded transition cursor-pointer border ${
                tab === t
                  ? "bg-orange-950/60 text-orange-300 border-orange-800/60 font-semibold"
                  : "bg-[#080d19] text-gray-400 border-gray-800 hover:text-gray-200"
              }`}
            >
              {t === "popular" ? "★ Popular" : "▲ Emerging"}
            </button>
          ))}
        </div>
      </Card>

      {error && <ErrorBox message={error} onRetry={load} />}

      {loading ? (
        <LoadingList rows={5} />
      ) : tab === "popular" ? (
        <div className="space-y-3">
          {(popular?.repositories || []).map((r) => (
            <div key={r.full_name} className="bg-[#0b101f] border border-gray-800/90 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg font-bold text-gray-500 w-8">#{r.rank}</span>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-cyan-400">{r.full_name}</span>
                  {r.language && <Tag>{r.language}</Tag>}
                </div>
                {r.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{r.description}</p>}
              </div>
              <div className="font-mono text-[11px] text-gray-400 text-right">
                <div>⭐ {r.stars.toLocaleString()} · 🍴 {r.forks.toLocaleString()}</div>
                <div className="text-gray-500">trend score {r.trend_score}</div>
              </div>
              <PrimaryButton onClick={() => analyze(r.full_name)}>Analyze</PrimaryButton>
            </div>
          ))}
          {(popular?.repositories || []).length === 0 && (
            <EmptyState title="No trending data" sub="GitHub may be unreachable — check the backend and retry." />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {emerging && !emerging.has_history && (
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-lg p-4">
              <p className="font-mono text-[11px] text-amber-300 font-bold mb-1">Insufficient historical data</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                {emerging.history_reason || "No comparable snapshots yet."} Growth numbers below are shown only
                where history exists — nothing is fabricated. Capture snapshots regularly to unlock emergence.
              </p>
            </div>
          )}
          {(emerging?.repositories || []).map((r) => (
            <div key={r.full_name} className="bg-[#0b101f] border border-gray-800/90 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-cyan-400">{r.full_name}</span>
                    {r.history_available ? (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        emerging {r.emerging_score}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 border border-gray-700">
                        insufficient history
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 font-mono text-[11px] text-gray-400">
                    <span>⭐ {r.stars.toLocaleString()}</span>
                    {r.star_delta !== null && r.star_delta !== undefined ? (
                      <span className={r.star_delta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        Δ★ {r.star_delta >= 0 ? "+" : ""}
                        {r.star_delta.toLocaleString()}
                        {r.star_growth_percent !== null && r.star_growth_percent !== undefined
                          ? ` (${r.star_growth_percent >= 0 ? "+" : ""}${r.star_growth_percent}%)`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-gray-600">Δ★ —</span>
                    )}
                    <RankDelta change={r.rank_change} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => openHistory(r.full_name)}>History</GhostButton>
                  <PrimaryButton onClick={() => analyze(r.full_name)}>Analyze</PrimaryButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {historyFor && (
        <Card>
          <SectionHead title={`History — ${historyFor}`} right={<Tag>stored snapshots only</Tag>} />
          {!history ? (
            <LoadingList rows={2} />
          ) : history.snapshots.length <= 1 ? (
            <EmptyState
              title="History is being accumulated"
              sub={`Only ${history.snapshots.length} snapshot stored for ${historyFor}. Capture another snapshot to compare growth — no chart is rendered until real history exists.`}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-28 border-b border-gray-800 pb-1">
                {history.snapshots.map((s) => {
                  const max = Math.max(...history.snapshots.map((x) => x.stars));
                  const h = max > 0 ? Math.max(6, (s.stars / max) * 100) : 6;
                  return (
                    <div key={s.snapshot_at} className="flex-1 flex flex-col items-center gap-1" title={`${s.snapshot_at.slice(0, 10)}: ${s.stars.toLocaleString()}★`}>
                      <div className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t" style={{ height: `${h}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between font-mono text-[10px] text-gray-500">
                <span>{history.snapshots[0].snapshot_at.slice(0, 10)}</span>
                <span>{history.snapshots[history.snapshots.length - 1].snapshot_at.slice(0, 10)}</span>
              </div>
              {history.comparison && (
                <p className="font-mono text-[11px] text-gray-300">
                  Δ★ {(history.comparison.star_delta || 0) >= 0 ? "+" : ""}
                  {(history.comparison.star_delta || 0).toLocaleString()} · rank change{" "}
                  {(history.comparison.rank_change || 0) >= 0 ? "+" : ""}
                  {history.comparison.rank_change ?? "—"} · emerging {history.comparison.emerging_score ?? "—"}
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
