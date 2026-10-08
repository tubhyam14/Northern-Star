import { useEffect, useMemo, useState } from "react";
import { api, apiError, type ChallengeResult } from "../api";
import type { RepoTarget } from "./Analyze";
import type { View } from "../App";
import { Card, EmptyState, ErrorBox, EvidenceCard, LoadingList, SectionHead, SeverityBadge, Tag, Stat } from "../components/ui";

export default function Challenges({ target, go }: { target: RepoTarget; go: (v: View) => void }) {
  const [data, setData] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selected, setSelected] = useState(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getChallenges(target.owner, target.repo);
      setData(res);
      setSelected(0);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Data fetch on mount / repo change (canonical effect use-case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.owner, target.repo]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.challenges.filter((c) => filter === "all" || (c.severity || "").toLowerCase() === filter);
  }, [data, filter]);

  const current = filtered[Math.min(selected, Math.max(0, filtered.length - 1))];
  const citeById = useMemo(() => {
    const m = new Map((data?.evidence_citations || []).map((c) => [c.id, c]));
    return m;
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
        <ErrorBox message={error} onRetry={load} />
      </div>
    );
  }

  if (!data || data.challenges.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState title="No challenges detected" sub="The red team found nothing worth challenging — or the repo isn't indexed yet." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="High severity" value={data.high_severity ?? 0} />
        <Stat label="Medium severity" value={data.medium_severity ?? 0} />
        <Stat label="Low severity" value={data.low_severity ?? 0} />
      </div>

      <div className="flex items-center gap-2">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setSelected(0);
            }}
            className={`font-mono text-xs px-4 py-1.5 rounded transition cursor-pointer border ${
              filter === f
                ? "bg-rose-950/80 text-rose-300 border-rose-800/60 font-semibold"
                : "bg-[#0b101f] text-gray-400 border-gray-800 hover:text-gray-200"
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="font-mono text-[11px] text-gray-500 ml-1">
          {filtered.length} of {data.total_challenges}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${filter}-severity challenges`} sub="Try a different severity filter." />
      ) : (
        current && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filtered.map((c, i) => (
                <button
                  key={c.id || i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                    i === Math.min(selected, filtered.length - 1)
                      ? "bg-[#090e1a] border-rose-600/70"
                      : "bg-[#070c18] border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={c.severity} />
                    <Tag>{(c.category || "general").replace(/_/g, " ")}</Tag>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">{c.challenge}</p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8">
              <Card>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <SeverityBadge severity={current.severity} />
                  <Tag>{(current.category || "general").replace(/_/g, " ")}</Tag>
                  {current.confidence && <Tag>confidence: {current.confidence}</Tag>}
                </div>
                <p className="font-mono text-[11px] uppercase text-gray-500 mb-1">Affected claim</p>
                <p className="text-sm text-gray-100 leading-relaxed border-l-2 border-gray-700 pl-3">“{current.claim}”</p>
                <p className="font-mono text-[11px] uppercase text-rose-400 mt-4 mb-1">Challenge</p>
                <p className="text-sm text-rose-100/90 leading-relaxed">{current.challenge}</p>
                {current.explanation && (
                  <>
                    <p className="font-mono text-[11px] uppercase text-gray-500 mt-4 mb-1">Why it matters</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{current.explanation}</p>
                  </>
                )}
                <button
                  onClick={() => go("improvements")}
                  className="mt-4 w-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs px-3 py-2 rounded transition cursor-pointer"
                >
                  What should the team do? → See Improvements
                </button>
              </Card>

              <Card className="mt-4">
                <SectionHead title="Challenge Evidence" right={<Tag>{current.evidence_ids?.length || 0} block(s)</Tag>} />
                <div className="space-y-2.5">
                  {(current.evidence_ids || []).map((eid) => {
                    const cite = citeById.get(eid);
                    return cite ? (
                      <EvidenceCard key={eid} cite={cite} />
                    ) : (
                      <p key={eid} className="font-mono text-[11px] text-gray-500">
                        [{eid}] (evidence block)
                      </p>
                    );
                  })}
                  {(current.evidence_ids || []).length === 0 && (
                    <p className="text-[11px] text-gray-500 italic">No evidence blocks attached.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )
      )}
    </div>
  );
}
