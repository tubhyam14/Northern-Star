import { useEffect, useState } from "react";
import { api, apiError, type ImprovementResult } from "../api";
import type { RepoTarget } from "./Analyze";
import { Card, EmptyState, ErrorBox, EvidenceCard, LoadingList, PriorityBadge, SectionHead, Stat, Tag } from "../components/ui";

export default function Improvements({ target }: { target: RepoTarget }) {
  const [data, setData] = useState<ImprovementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.getImprovements(target.owner, target.repo));
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

  if (!data || data.improvements.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState title="No improvements generated" sub="Improvements are derived from red-team challenges — generate those first, or the repo may already be in good shape." />
      </div>
    );
  }

  const citeById = new Map((data.evidence_citations || []).map((c) => [c.id, c]));
  const order = ["critical", "high", "medium", "low"];
  const sorted = [...data.improvements].sort(
    (a, b) => order.indexOf((a.priority || "medium").toLowerCase()) - order.indexOf((b.priority || "medium").toLowerCase()),
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Critical" value={data.critical_count} />
        <Stat label="High" value={data.high_count} />
        <Stat label="Medium" value={data.medium_count} />
        <Stat label="Low" value={data.low_count} />
      </div>

      <div className="space-y-4">
        {sorted.map((imp) => (
          <Card key={imp.id}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-semibold text-white">{imp.title}</h3>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={imp.priority} />
                {imp.category && <Tag>{imp.category.replace(/_/g, " ")}</Tag>}
                {imp.confidence && <Tag>confidence: {imp.confidence}</Tag>}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="border-l-2 border-rose-500 pl-3">
                <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">Problem</p>
                <p className="text-xs text-gray-200 leading-relaxed">{imp.problem}</p>
              </div>
              <div className="border-l-2 border-cyan-500 pl-3">
                <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">Evidence</p>
                <div className="space-y-2">
                  {(imp.evidence_ids || []).map((eid) => {
                    const cite = citeById.get(eid);
                    return cite ? (
                      <EvidenceCard key={eid} cite={cite} />
                    ) : (
                      <p key={eid} className="font-mono text-[11px] text-cyan-500">[{eid}]</p>
                    );
                  })}
                  {(imp.evidence_ids || []).length === 0 && (
                    <p className="text-[11px] text-gray-500 italic">No evidence blocks attached.</p>
                  )}
                </div>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="font-mono text-[10px] uppercase text-gray-500 mb-1">Recommendation</p>
                <p className="text-xs text-gray-200 leading-relaxed">{imp.recommendation}</p>
              </div>
              {imp.rationale && (
                <p className="text-[11px] text-gray-400 leading-relaxed pt-1 border-t border-gray-800/40">{imp.rationale}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] text-gray-500">
                {imp.affected_files && imp.affected_files.length > 0 && (
                  <span>Files: <span className="text-gray-300">{imp.affected_files.join(", ")}</span></span>
                )}
                {imp.related_challenge_ids && imp.related_challenge_ids.length > 0 && (
                  <span>Challenges: <span className="text-rose-300">{imp.related_challenge_ids.join(", ")}</span></span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHead title="How priorities work" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Priorities are computed deterministically from the source challenge severity — contradicted,
          high-severity findings become critical/high; the model cannot arbitrarily escalate. Every
          recommendation above traces to repository evidence, not generic advice.
        </p>
      </Card>
    </div>
  );
}
