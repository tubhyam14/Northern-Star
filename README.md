# Northern Star

**AI that understands, evaluates, challenges, and improves software projects.**

Northern Star analyzes real GitHub repositories and reasons only over evidence
retrieved from their implementation. Core principle: **LLMs reason; evidence
determines what can be claimed** — every answer cites exact file:line
evidence, and anything unverifiable is reported as such instead of invented.

```
DISCOVER → UNDERSTAND → VERIFY → JUDGE → CHALLENGE → IMPROVE
```

## Layout

```
NorthernStar/
├── backend/     # FastAPI service (v0.8.1): ingestion → evidence index → Q&A →
│                # claims → judging → challenges → improvements → architecture →
│                # discovery → trends. 431 tests. See backend/README.md.
├── frontend/    # React + TS + Vite product UI consuming the API.
│                # See frontend/README.md.
└── storage/     # Local git-ignored working data (clones, SQLite DB).
```

## Quickstart

Prerequisites: Python 3.14, Node 18+, [Ollama](https://ollama.com) with
`qwen2.5:3b` pulled (`ollama pull qwen2.5:3b`), git.

```bash
# 1. Backend env + deps (from repo root)
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt

# 2. Backend server
cd backend
../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
# health: curl http://127.0.0.1:8000/health

# 3. Frontend (new terminal, from repo root)
cd frontend
npm install
npm run dev
```

Optional: `GITHUB_TOKEN` in the backend environment raises GitHub discovery
rate limits (sent only as an `Authorization` header — never stored/logged).

## Demo in 2 minutes

1. Open the UI → **Analyze Project** → *Load existing* (`pallets/flask` ships ingested).
2. **Architecture** → module graph; **Ask** → grounded Q&A with citations.
3. **Verify Claims** → README audit; **Judge** → 0–100 report.
4. **Challenges** → red-team findings; **Improvements** → prioritized next steps.
5. **Discover** → GitHub search with one-click Analyze; **Trends** → popular vs emerging.

The same flows exist headlessly via the backend CLI, e.g.
`python -m app.cli judge pallets/flask` (see backend/README.md).

## Docs

- `backend/README.md` — full backend reference: pipeline, endpoints, CLI, env vars, formulas, limitations.
- `frontend/README.md` — UI setup, views, build/lint.
