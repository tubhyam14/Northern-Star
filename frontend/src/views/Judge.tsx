import { useEffect, useState } from "react";
import { api, apiError, type JudgeResult } from "../api";
import type { RepoTarget } from "./Analyze";
import { Card, EmptyState, ErrorBox, EvidenceCard, LoadingList, SectionHead, ScoreBar, Stat, Tag } from "../components/ui";

export default function Judge({ target }: { target: RepoTarget }) {
  const [judge, setJudge] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setJudge(await api.judgeRepo(target.owner, target.repo));
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

  if (!judge) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState title="No judgment yet" sub="Judging runs automatically on this page." />
      </div>
    );
  }

  const integrity = judge.claim_integrity_summary || {};

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Card>
        <SectionHead
          title="Project Evaluation Report"
          sub={`${target.owner}/${target.repo} — every score cites repository evidence.`}
          right={<Tag>{judge.total_claims} claims checked</Tag>}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 bg-[#080d19] border border-gray-800/80 rounded-lg text-center">
            <span className="text-[10px] font-mono uppercase text-gray-400">Overall Score</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-5xl font-bold text-white tracking-tight">{judge.overall_score}</span>
              <span className="font-mono text-xs text-gray-500">/100</span>
            </div>
            <ScoreBar score={judge.overall_score} max={100} />
            <div className="mt-3 inline-flex px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
              {judge.overall_score >= 70 ? "HIGH CONFIDENCE" : judge.overall_score >= 40 ? "MODERATE INTEGRITY" : "NEEDS WORK"}
            </div>
          </div>

          <div className="lg:col-span-9 bg-[#080d19] border border-gray-800/80 rounded-lg p-4 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-medium">Five Dimensions</span>
            {judge.dimensions?.map((d) => (
              <div key={d.name} className="space-y-1.5 pb-3 border-b border-gray-800/40 last:border-0 last:pb-0">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-gray-200 capitalize font-medium">{d.name.replace(/_/g, " ")}</span>
                  <span className="text-cyan-400 font-semibold">{d.score}/10</span>
                </div>
                <ScoreBar score={d.score} />
                {d.explanation && <p className="text-[11px] text-gray-400 leading-relaxed">{d.explanation}</p>}
                {d.evidence_ids && d.evidence_ids.length > 0 && (
                  <p className="font-mono text-[10px] text-cyan-500">Evidence: {d.evidence_ids.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Stat label="Supported" value={integrity.supported ?? 0} />
          <Stat label="Partially supported" value={integrity.partially_supported ?? 0} />
          <Stat label="Unclear" value={integrity.unclear ?? 0} />
          <Stat label="Contradicted" value={integrity.contradicted ?? 0} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionHead title="Strengths" />
          <div className="space-y-2">
            {(judge.strengths || []).map((s, i) => (
              <p key={i} className="text-xs text-gray-200 leading-relaxed border-l-2 border-emerald-500 pl-3">
                {s}
              </p>
            ))}
            {(judge.strengths || []).length === 0 && <p className="text-[11px] text-gray-500 italic">None recorded.</p>}
          </div>
        </Card>
        <Card>
          <SectionHead title="Weaknesses" />
          <div className="space-y-2">
            {(judge.weaknesses || []).map((w, i) => (
              <p key={i} className="text-xs text-gray-200 leading-relaxed border-l-2 border-rose-500 pl-3">
                {w}
              </p>
            ))}
            {(judge.weaknesses || []).length === 0 && <p className="text-[11px] text-gray-500 italic">None recorded.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHead title="Recommendations" sub="From the judge — the Improvement Engine turns these into concrete steps." />
        <div className="space-y-2">
          {(judge.recommendations || []).map((r, i) => (
            <p key={i} className="text-xs text-gray-200 leading-relaxed border-l-2 border-amber-500 pl-3">
              {r}
            </p>
          ))}
          {(judge.recommendations || []).length === 0 && <p className="text-[11px] text-gray-500 italic">None recorded.</p>}
        </div>
      </Card>

      {judge.evidence_citations && judge.evidence_citations.length > 0 && (
        <Card>
          <SectionHead title="Supporting Evidence" right={<Tag>{judge.evidence_citations.length} block(s)</Tag>} />
          <div className="space-y-2.5">
            {judge.evidence_citations.map((c, i) => (
              <EvidenceCard key={i} cite={c} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
