import { useState } from "react";
import { api, apiError, type AnswerResponse } from "../api";
import type { RepoTarget } from "./Analyze";
import { Card, EmptyState, ErrorBox, EvidenceCard, LoadingList, SectionHead, TextInput, PrimaryButton, Tag } from "../components/ui";

export default function Ask({ target }: { target: RepoTarget }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setError("");
    try {
      const res = await api.askQuestion(target.owner, target.repo, question.trim());
      setAnswer(res);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <Card>
        <SectionHead
          title="Evidence-Grounded Q&A"
          sub={`Asking ${target.owner}/${target.repo} — answers cite exact file:line evidence.`}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="flex gap-2"
        >
          <TextInput
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How does routing work in this project?"
            className="flex-1"
          />
          <PrimaryButton type="submit" disabled={asking}>
            {asking ? "Asking..." : "Ask"}
          </PrimaryButton>
        </form>
      </Card>

      {error && <ErrorBox message={error} onRetry={run} />}

      {asking && <LoadingList rows={2} />}

      {answer && !asking && (
        <div className="space-y-4">
          <Card>
            <SectionHead
              title="AI Explanation"
              right={
                <div className="flex items-center gap-2">
                  <Tag>confidence: {answer.confidence} ({answer.confidence_source === "model" ? "model-reported" : "deterministic"})</Tag>
                  <Tag>grounding: {answer.evidence_grounding}</Tag>
                </div>
              }
            />
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
            {answer.evidence_sufficient === false && (
              <p className="mt-3 text-[11px] font-mono text-amber-400 border border-amber-800/60 bg-amber-950/30 rounded p-2">
                Evidence insufficient — the model says the retrieved chunks could not fully answer this.
              </p>
            )}
          </Card>

          <Card>
            <SectionHead
              title="Repository Evidence"
              sub="What the answer is actually anchored in — this is the differentiator."
              right={<Tag>{answer.citations.length} block(s)</Tag>}
            />
            {answer.citations.length === 0 ? (
              <EmptyState title="No evidence cited" sub="The answer is not anchored in retrieved code. Treat it skeptically." />
            ) : (
              <div className="space-y-2.5">
                {answer.citations.map((c, i) => (
                  <EvidenceCard key={i} cite={c} defaultOpen={i === 0} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {!answer && !asking && !error && (
        <EmptyState
          title="Ask anything about the implementation"
          sub="Try: how routing works, where authentication happens, or what the entry point is."
        />
      )}
    </div>
  );
}
