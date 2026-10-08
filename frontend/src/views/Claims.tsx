import { useEffect, useState } from "react";
import { api, apiError, type Claim } from "../api";
import type { RepoTarget } from "./Analyze";
import { Card, EmptyState, ErrorBox, LoadingList, SectionHead, TextInput, VerdictBadge, PrimaryButton, Tag } from "../components/ui";

export default function Claims({ target }: { target: RepoTarget }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setClaims(await api.getClaims(target.owner, target.repo));
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

  const verify = async () => {
    if (!custom.trim()) return;
    setVerifying(true);
    try {
      const v = await api.verifyClaim(target.owner, target.repo, custom.trim());
      setClaims([v, ...claims]);
      setCustom("");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setVerifying(false);
    }
  };

  const counts = claims.reduce<Record<string, number>>((acc, c) => {
    acc[c.verdict || "unclear"] = (acc[c.verdict || "unclear"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <Card>
        <SectionHead
          title="Claim Verification"
          sub="README promises checked against the implementation. Nothing is invented here."
          right={
            Object.keys(counts).length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(counts).map(([k, v]) => (
                  <Tag key={k}>
                    {k.replace(/_/g, " ")}: {v}
                  </Tag>
                ))}
              </div>
            )
          }
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          className="flex gap-2"
        >
          <TextInput
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Verify a custom claim, e.g. 'Supports real-time updates'..."
            className="flex-1"
          />
          <PrimaryButton type="submit" disabled={verifying}>
            {verifying ? "Verifying..." : "Verify"}
          </PrimaryButton>
        </form>
      </Card>

      {error && <ErrorBox message={error} onRetry={load} />}

      {loading ? (
        <LoadingList rows={4} />
      ) : claims.length === 0 ? (
        <EmptyState title="No claims found" sub="This repository exposes no verifiable README claims, or it hasn't been ingested yet." />
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div
              key={c.id}
              className={`bg-[#0b101f] border rounded-xl p-4 space-y-2 ${
                c.verdict === "contradicted" ? "border-rose-700/70" : "border-gray-800/90"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs font-medium text-gray-100 leading-snug">“{c.text}”</p>
                <VerdictBadge verdict={c.verdict} />
              </div>
              {c.verdict === "contradicted" && (
                <p className="text-[11px] font-mono text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded p-2">
                  ⚠ The implementation contradicts this claim — investigate before trusting the docs.
                </p>
              )}
              {c.verdict_explanation && <p className="text-xs text-gray-400 leading-relaxed">{c.verdict_explanation}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-gray-800/40 font-mono text-[10px] text-gray-500">
                <span>Source: {c.source || "README"}</span>
                {c.category && <span>Category: {c.category}</span>}
                {c.evidence_ids && c.evidence_ids.length > 0 && <span className="text-cyan-400">Evidence: {c.evidence_ids.join(", ")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
