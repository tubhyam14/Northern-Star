import axios from "axios";

export const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE || "http://127.0.0.1:8000/api/v1";

export interface Citation {
  id?: string;
  file_path: string;
  start_line: number;
  end_line: number;
  language?: string;
  content?: string;
}

export type Verdict = "supported" | "partially_supported" | "unclear" | "contradicted";

export interface Claim {
  id: string;
  text: string;
  category?: string;
  source?: string;
  kind?: string;
  verdict?: Verdict;
  verdict_explanation?: string;
  evidence_ids?: string[];
  repo_id?: string;
}

export interface AnswerResponse {
  question?: string;
  answer: string;
  confidence: string;
  confidence_source?: string;
  evidence_sufficient?: boolean;
  evidence_grounding: string;
  citations: Citation[];
}

export interface DimensionScore {
  name: string;
  score: number;
  explanation?: string;
  evidence_ids?: string[];
}

export interface JudgeResult {
  repo_id: string;
  overall_score: number;
  dimensions: DimensionScore[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  claim_integrity_summary: Record<string, number>;
  total_claims: number;
  evidence_citations?: Citation[];
}

export type Severity = "high" | "medium" | "low";

export interface Challenge {
  id: string;
  claim: string;
  challenge: string;
  category?: string;
  severity?: Severity;
  explanation?: string;
  evidence_ids?: string[];
  confidence?: "high" | "medium" | "low";
}

export interface ChallengeResult {
  repo_id: string;
  challenges: Challenge[];
  total_challenges: number;
  high_severity?: number;
  medium_severity?: number;
  low_severity?: number;
  evidence_citations?: Citation[];
}

export type Priority = "critical" | "high" | "medium" | "low";

export interface Improvement {
  id: string;
  title: string;
  problem: string;
  recommendation: string;
  priority: Priority;
  category?: string;
  rationale?: string;
  evidence_ids?: string[];
  related_challenge_ids?: string[];
  affected_files?: string[];
  confidence?: string;
}

export interface ImprovementResult {
  repo_id: string;
  improvements: Improvement[];
  total_improvements: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  evidence_citations?: Citation[];
}

export interface ArchNode {
  id: string;
  label: string;
  type: string;
  files?: string[];
  evidence_ids?: string[];
  description?: string;
}

export interface ArchEdge {
  source: string;
  target: string;
  relationship: string;
  evidence_ids?: string[];
}

export interface ArchitectureResult {
  repo_id: string;
  root: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
  total_nodes: number;
  total_edges: number;
  evidence_citations?: Citation[];
  summary?: string;
  mermaid?: string;
}

export interface RepoManifest {
  id: string;
  owner: string;
  repo: string;
  github_url?: string;
  description?: string;
  default_branch?: string;
  commit_hash?: string;
  total_files?: number;
  source_files?: number;
  languages?: { language: string; file_count: number }[] | Record<string, number>;
  frameworks?: { name: string }[];
  readme_present?: boolean;
  [key: string]: unknown;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  html_url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  open_issues?: number;
  watchers?: number;
  topics?: string[];
  default_branch?: string;
  created_at?: string;
  updated_at?: string;
  pushed_at?: string;
  license?: string;
  archived?: boolean;
  fork?: boolean;
}

export interface SearchResult {
  query: string;
  repositories: GitHubRepo[];
  total_count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface TrendingRepo extends GitHubRepo {
  rank: number;
  trend_score: number;
  rank_change?: number | null;
}

export interface TrendingResult {
  repositories: TrendingRepo[];
  total: number;
  limit: number;
  generated_at?: string;
}

export interface TrendEntry {
  full_name: string;
  html_url?: string;
  language?: string;
  stars: number;
  forks: number;
  current_rank?: number;
  previous_rank?: number;
  rank_change?: number | null;
  previous_stars?: number | null;
  star_delta?: number | null;
  star_growth_percent?: number | null;
  previous_forks?: number | null;
  fork_delta?: number | null;
  fork_growth_percent?: number | null;
  current_trend_score?: number | null;
  emerging_score?: number | null;
  history_available: boolean;
  comparison_window: string;
}

export interface TrendResult {
  window: string;
  generated_at: string;
  has_history: boolean;
  history_reason?: string;
  current_snapshot_at?: string;
  previous_snapshot_at?: string;
  repositories: TrendEntry[];
  total: number;
  limit: number;
}

export interface SnapshotPoint {
  full_name: string;
  snapshot_at: string;
  rank?: number;
  stars: number;
  forks: number;
  pushed_at?: string;
  trend_score?: number;
  language?: string;
}

export interface HistoryResult {
  full_name: string;
  window: string;
  snapshots: SnapshotPoint[];
  total_snapshots: number;
  has_history: boolean;
  comparison?: TrendEntry | null;
}

export function apiError(err: unknown): string {
  const anyErr = err as {
    response?: { data?: { detail?: unknown }; status?: number };
    message?: string;
  };
  const detail = anyErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === "string" ? d : d?.msg || JSON.stringify(d))).join("; ");
  }
  const status = anyErr?.response?.status;
  if (status === 429) return "GitHub rate limit exceeded. Set GITHUB_TOKEN on the backend or try again later.";
  if (status === 503) return "Backend service unavailable (GitHub or Ollama unreachable).";
  if (status === 504) return "Request timed out — the model or GitHub took too long.";
  if (status === 404) return "Not found — ingest and index the repository first.";
  return anyErr?.message || "Request failed.";
}

export const api = {
  async ingestRepo(url: string) {
    const res = await axios.post(`${API_BASE}/repos`, { url });
    return res.data;
  },

  async getManifest(owner: string, repo: string): Promise<RepoManifest> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}`);
    return res.data;
  },

  async indexRepo(owner: string, repo: string) {
    const res = await axios.post(`${API_BASE}/repos/${owner}/${repo}/index`);
    return res.data;
  },

  async getClaims(owner: string, repo: string): Promise<Claim[]> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/claims`);
    return Array.isArray(res.data) ? res.data : res.data.claims || [];
  },

  async verifyClaim(owner: string, repo: string, claim_text: string): Promise<Claim> {
    const res = await axios.post(`${API_BASE}/repos/${owner}/${repo}/verify`, {
      claim: claim_text,
    });
    return res.data;
  },

  async askQuestion(owner: string, repo: string, question: string): Promise<AnswerResponse> {
    const res = await axios.post(`${API_BASE}/repos/${owner}/${repo}/ask`, {
      question,
    });
    return res.data;
  },

  async judgeRepo(owner: string, repo: string): Promise<JudgeResult> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/judge`);
    return res.data;
  },

  async getChallenges(owner: string, repo: string): Promise<ChallengeResult> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/challenges`);
    return res.data;
  },

  async getImprovements(owner: string, repo: string): Promise<ImprovementResult> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/improvements`);
    return res.data;
  },

  async getArchitecture(owner: string, repo: string, maxNodes = 120): Promise<ArchitectureResult> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/architecture`, {
      params: { max_nodes: maxNodes, format: "json" },
    });
    return res.data;
  },

  async discover(
    query: string,
    opts: { page?: number; per_page?: number; language?: string; sort?: string; order?: string } = {},
  ): Promise<SearchResult> {
    const res = await axios.get(`${API_BASE}/discover/search`, {
      params: {
        q: query,
        page: opts.page ?? 1,
        per_page: opts.per_page ?? 10,
        language: opts.language || undefined,
        sort: opts.sort ?? "best-match",
        order: opts.order ?? "desc",
      },
    });
    return res.data;
  },

  async trending(limit = 20, language?: string): Promise<TrendingResult> {
    const res = await axios.get(`${API_BASE}/discover/trending`, {
      params: { limit, language: language || undefined },
    });
    return res.data;
  },

  async trends(window: string = "7d", limit = 20): Promise<TrendResult> {
    const res = await axios.get(`${API_BASE}/discover/trends`, {
      params: { window, limit },
    });
    return res.data;
  },

  async repoHistory(owner: string, repo: string, window: string = "30d"): Promise<HistoryResult> {
    const res = await axios.get(`${API_BASE}/discover/repositories/${owner}/${repo}/history`, {
      params: { window },
    });
    return res.data;
  },

  async captureSnapshot(limit = 100) {
    const res = await axios.post(`${API_BASE}/discover/snapshots`, null, {
      params: { limit },
    });
    return res.data;
  },
};
