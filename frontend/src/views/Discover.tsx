import { useState } from "react";
import { api, apiError, type SearchResult } from "../api";
import { Card, EmptyState, ErrorBox, LoadingList, SectionHead, TextInput, PrimaryButton, Tag } from "../components/ui";

const SORTS = ["best-match", "stars", "forks", "updated"];

export default function Discover({ onAnalyze }: { onAnalyze: (owner: string, repo: string) => void }) {
  const [query, setQuery] = useState("AI coding agents");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("best-match");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (p = 1) => {
    if (!query.trim()) {
      setError("Enter a search query first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.discover(query.trim(), {
        page: p,
        per_page: 10,
        language: language.trim() || undefined,
        sort,
      });
      setResult(res);
      setPage(p);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Card>
        <SectionHead title="Discover GitHub Repositories" sub="Live GitHub search — metadata only, nothing is cloned until you analyze." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(1);
          }}
          className="flex flex-wrap gap-2"
        >
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "AI coding agents" or "local AI"...'
            className="flex-1 min-w-[220px]"
          />
          <TextInput
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language (optional)"
            className="w-40"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#060a14] border border-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-200 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </PrimaryButton>
        </form>
      </Card>

      {error && <ErrorBox message={error} onRetry={() => run(page)} />}

      {loading && !result && <LoadingList rows={4} />}

      {result && (
        <div className="space-y-4">
          <p className="font-mono text-[11px] text-gray-400">
            {result.total_count.toLocaleString()} results for “{result.query}” — page {result.page}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.repositories.map((r) => (
              <div key={r.full_name} className="bg-[#0b101f] border border-gray-800/90 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm font-semibold text-cyan-400 hover:text-cyan-300 break-all"
                  >
                    {r.full_name}
                  </a>
                  {r.language && <Tag>{r.language}</Tag>}
                </div>
                {r.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-4 font-mono text-[11px] text-gray-400">
                  <span>⭐ {r.stars.toLocaleString()}</span>
                  <span>🍴 {r.forks.toLocaleString()}</span>
                  {r.pushed_at && <span>Pushed {r.pushed_at.slice(0, 10)}</span>}
                </div>
                {r.topics && r.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.topics.slice(0, 6).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => onAnalyze(r.owner, r.name)}
                  className="mt-1 w-full bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded transition cursor-pointer"
                >
                  Analyze with Northern Star →
                </button>
              </div>
            ))}
          </div>
          {result.repositories.length === 0 && (
            <EmptyState title="No repositories found" sub="Try a different query or remove the language filter." />
          )}
          <div className="flex items-center justify-between">
            <button
              disabled={page <= 1 || loading}
              onClick={() => run(page - 1)}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 font-mono text-xs px-4 py-2 rounded transition cursor-pointer"
            >
              ← Prev
            </button>
            <span className="font-mono text-[11px] text-gray-500">Page {result.page}</span>
            <button
              disabled={!result.has_more || loading}
              onClick={() => run(page + 1)}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 font-mono text-xs px-4 py-2 rounded transition cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          title="Search GitHub without leaving Northern Star"
          sub="Results link straight into analysis. Nothing is cloned or indexed until you press Analyze."
          action={
            <button
              onClick={() => run(1)}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-400 font-mono text-xs px-4 py-2 rounded transition cursor-pointer"
            >
              Try “AI coding agents”
            </button>
          }
        />
      )}
    </div>
  );
}
