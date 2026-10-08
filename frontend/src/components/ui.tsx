import React from "react";
import type { Citation, Priority, Severity, Verdict } from "../api";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0b101f] border border-gray-800/90 rounded-xl p-5 shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800/70 pb-3 mb-4">
      <div>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-200">{title}</h2>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const verdictStyles: Record<string, string> = {
  supported: "bg-emerald-950/90 text-emerald-400 border-emerald-800",
  partially_supported: "bg-amber-950/90 text-amber-400 border-amber-800",
  unclear: "bg-gray-900 text-gray-400 border-gray-700",
  contradicted: "bg-rose-950/90 text-rose-400 border-rose-800",
};

export function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  const v = verdict || "unclear";
  return (
    <span
      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 border ${
        verdictStyles[v] || verdictStyles.unclear
      }`}
    >
      {v.replace(/_/g, " ")}
    </span>
  );
}

const severityStyles: Record<string, string> = {
  high: "bg-rose-950 text-rose-400 border-rose-800",
  medium: "bg-amber-950 text-amber-400 border-amber-800",
  low: "bg-gray-900 text-gray-400 border-gray-700",
};

export function SeverityBadge({ severity }: { severity?: Severity }) {
  const s = (severity || "medium").toLowerCase();
  return (
    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${severityStyles[s] || severityStyles.medium}`}>
      {s}
    </span>
  );
}

const priorityStyles: Record<string, string> = {
  critical: "bg-rose-950 text-rose-300 border-rose-700",
  high: "bg-orange-950/90 text-orange-300 border-orange-800",
  medium: "bg-amber-950/90 text-amber-300 border-amber-800",
  low: "bg-gray-900 text-gray-400 border-gray-700",
};

export function PriorityBadge({ priority }: { priority?: Priority }) {
  const p = (priority || "medium").toLowerCase();
  return (
    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${priorityStyles[p] || priorityStyles.medium}`}>
      {p}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">
      {children}
    </span>
  );
}

export function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = pct >= 70 ? "from-emerald-500 to-cyan-500" : pct >= 40 ? "from-cyan-500 to-indigo-500" : "from-rose-500 to-amber-500";
  return (
    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800/60 rounded ${className}`} />;
}

export function LoadingList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-[#070c18] border border-gray-800/80 rounded-lg p-4 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-gray-800/80 rounded-lg text-center px-6 py-12 gap-2 min-h-[220px]">
      <p className="text-xs font-mono text-gray-400 font-medium">{title}</p>
      {sub && <p className="text-[11px] text-gray-500 max-w-md leading-relaxed">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-rose-950/30 border border-rose-800/60 rounded-lg p-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-mono uppercase text-rose-400 font-bold mb-1">Something went wrong</p>
        <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-mono text-xs px-3 py-1.5 rounded transition cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      className={`bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-50 text-white font-mono text-xs px-4 py-2 rounded transition cursor-pointer font-medium ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gray-800 hover:bg-gray-700 active:scale-95 disabled:opacity-50 text-gray-200 font-mono text-xs px-3.5 py-2 rounded transition cursor-pointer border border-gray-700/60 ${className}`}
    >
      {children}
    </button>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-[#060a14] border border-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-200 focus:outline-none focus:border-cyan-500/80 transition ${props.className || ""}`}
    />
  );
}

export function EvidenceCard({ cite, defaultOpen = false }: { cite: Citation; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="bg-[#050811] border border-gray-800/90 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-[#0a0f1d] border-b border-gray-800/60 cursor-pointer hover:bg-gray-900/60 transition"
      >
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {cite.id && <span className="text-cyan-400 font-semibold">[{cite.id}]</span>}
          <span className="text-gray-300">
            {cite.file_path}:{cite.start_line}-{cite.end_line}
          </span>
        </div>
        <span className="font-mono text-[10px] text-gray-500 uppercase">{open ? "Collapse ▲" : "View Code ▼"}</span>
      </button>
      {open && cite.content && (
        <pre className="p-3 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-56 bg-[#03060d] leading-relaxed whitespace-pre-wrap">
          {cite.content}
        </pre>
      )}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-[#080d19] border border-gray-800/80 rounded-lg p-3.5 text-center">
      <div className="font-mono text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] font-mono uppercase text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
