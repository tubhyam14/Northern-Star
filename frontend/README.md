# Northern Star — Frontend

React + TypeScript + Vite product UI for Northern Star: AI that understands,
evaluates, challenges, and improves software projects.

Dark-first developer-tool aesthetic. No router dependency (state-driven views),
no state-management framework; the Mermaid diagram bundle is lazy-loaded so
first paint stays fast.

## Views

Home (pipeline + feature cards) · Discover (GitHub search → Analyze) ·
Analyze Project (ingest with staged progress + repo dashboard) · Ask
(evidence-grounded Q&A) · Architecture (Mermaid graph + filters) · Verify
Claims · Judge (0–100 report) · Challenges (severity-filtered red team) ·
Improvements (problem → evidence → recommendation) · Trends (popular vs
emerging + per-repo history).

Every data view has loading skeletons, human-readable errors with retry, and
informative empty states. AI text and repository evidence are visually
separated everywhere; growth numbers render only where snapshots exist.

## Setup

```bash
cd frontend
npm install
```

Requires Node 18+.

## Run

The UI talks to the backend at `http://127.0.0.1:8000/api/v1` by default.
Start the backend first (see `../backend/README.md`), then:

```bash
npm run dev        # dev server with HMR
```

To point at a different backend:

```bash
VITE_API_BASE=http://host:port/api/v1 npm run dev
```

## Build & lint

```bash
npm run build      # tsc + vite build → dist/
npm run lint       # eslint
```

## Structure

```
src/
├── api.ts            # Typed client for all 15 backend endpoints + apiError()
├── App.tsx           # Shell: sidebar nav, repo context, view routing
├── components/ui.tsx # Cards, badges, skeletons, empty/error states, evidence cards
├── views/            # One file per view (Home, Discover, Analyze, Ask, …)
├── main.tsx          # Entry point
└── index.css         # Tailwind v4 + base theme
```

## Demo flow

Analyze (`pallets/flask` is pre-ingested) → Architecture → Ask → Verify →
Judge → Challenges → Improvements → Trends. Set `GITHUB_TOKEN` on the
backend for higher discovery rate limits.
