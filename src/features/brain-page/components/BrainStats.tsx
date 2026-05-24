import { useEffect, useState } from "react";
import {
  AGENT_FEED,
  CONFLICTS,
  DOCS,
  DOMAINS,
  GAPS,
  SOURCES,
  STALE,
  TOP_FETCHED
} from "../data/mockBrainData";

const TOP_CONTRIBUTORS = [
  { initials: "KR", name: "Kartikeya Rao", role: "Frontend",   edits: 84, color: "#B8543D" },
  { initials: "SC", name: "Sarah Chen",    role: "Design",     edits: 71, color: "#3B82C4" },
  { initials: "AS", name: "Adhiraj Singh", role: "Backend",    edits: 62, color: "#7A8C5F" },
  { initials: "PM", name: "Prabh Mannat",  role: "Full-stack", edits: 58, color: "#8B7FD4" },
  { initials: "HT", name: "Hiroshi Tanaka",role: "Platform",   edits: 47, color: "#2D4A3E" }
];

const ACTIVE_PROJECTS = [
  { name: "Northstar Cloud",      memories: 247, owner: "Kartikeya",  pulse: "active" as const },
  { name: "Payments v2",          memories: 184, owner: "Prabh",      pulse: "active" as const },
  { name: "Onboarding Redesign",  memories: 98,  owner: "Sarah",      pulse: "decaying" as const },
  { name: "Customer Acme",        memories: 67,  owner: "Marcus",     pulse: "active" as const }
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function BrainStats() {
  const totalDocs = DOCS.length;
  const activeSources = SOURCES.filter((s) => s.status === "synced" || s.status === "syncing").length;
  const activeMemories = DOCS.filter((d) => d.freshness === "active").length;
  const staleMemories = DOCS.filter((d) => d.freshness === "stale").length;
  const indexedItems = SOURCES.reduce((sum, s) => sum + s.itemsIndexed, 0);

  // Sparkline-ish ticker that updates each second to feel "live"
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1000), 1000);
    return () => clearInterval(id);
  }, []);

  // A subtle "live" indicator value
  const queriesToday = 1247 + (tick % 7);
  const agentsRunning = 5;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Brain Stats</span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#7A8C5F] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A8C5F]" />
          </span>
          live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white">
        {/* Hero number block — 2x2 grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-[rgba(26,22,18,0.06)] border-b border-[rgba(26,22,18,0.06)]">
          <StatCell value={totalDocs.toLocaleString()} label="Total memories" sub="across 8 domains" />
          <StatCell value="142" label="New this week" sub="↑ 23% vs last week" subTone="positive" />
          <StatCell value={activeSources.toString()} label="Sources synced" sub={`${SOURCES.length - activeSources} pending`} />
          <StatCell value={agentsRunning.toString()} label="Agents active" sub={`${queriesToday.toLocaleString()} queries today`} />
        </div>

        {/* Indexed totals strip */}
        <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(26,22,18,0.06)] px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Indexed items</div>
            <div className="font-serif text-[26px] tracking-tight text-[#1A1612]">
              {indexedItems.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Pill tone="success" label="Active" count={activeMemories} />
            <Pill tone="warning" label="Stale" count={staleMemories} />
            <Pill tone="danger" label="Conflicts" count={CONFLICTS.length} />
            <Pill tone="muted" label="Gaps" count={GAPS.length} />
          </div>
        </div>

        {/* Two-column body: top fetched + active projects */}
        <div className="grid grid-cols-2 divide-x divide-[rgba(26,22,18,0.06)]">
          <div className="px-5 py-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
              Most fetched · 7d
            </div>
            <ul className="space-y-2.5">
              {TOP_FETCHED.map((t, i) => (
                <li key={t.id} className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono text-[10px] text-[#A89C8A]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-[12.5px] text-[#1A1612]">{t.title}</span>
                  </span>
                  <span className="flex-shrink-0 font-mono text-[11px] text-[#5A5450]">{t.fetches}×</span>
                </li>
              ))}
              {STALE.slice(0, 1).map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-2 pt-1">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="font-mono text-[10px] text-[#C28840]">!!</span>
                    <span className="truncate text-[12px] text-[#8C5D1E]">{s.title}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
              Active projects
            </div>
            <ul className="space-y-2.5">
              {ACTIVE_PROJECTS.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: p.pulse === "active" ? "#7A8C5F" : "#C28840" }}
                    />
                    <span className="truncate text-[12.5px] text-[#1A1612]">{p.name}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-baseline gap-2 font-mono text-[10.5px] text-[#5A5450]">
                    <span>{p.memories}</span>
                    <span className="text-[#A89C8A]">· {p.owner}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top contributors */}
        <div className="border-t border-[rgba(26,22,18,0.06)] px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Top contributors · 30d</span>
            <span className="font-mono text-[10px] text-[#A89C8A]">edits · queries answered</span>
          </div>
          <ul className="space-y-2">
            {TOP_CONTRIBUTORS.map((c) => (
              <li key={c.initials} className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-white"
                  style={{ background: c.color }}
                >
                  {c.initials}
                </span>
                <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[13px] text-[#1A1612]">{c.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#A89C8A]">{c.role}</span>
                  </span>
                  <span className="flex-shrink-0 font-mono text-[11px] text-[#5A5450]">{c.edits}</span>
                </span>
                {/* tiny bar-free density indicator: dashes proportional to edits */}
                <span className="hidden font-mono text-[10px] tracking-[-0.05em] text-[#D6CCB8] md:inline">
                  {"·".repeat(Math.max(2, Math.floor(c.edits / 10)))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Domain volume — text-only, no bars */}
        <div className="border-t border-[rgba(26,22,18,0.06)] px-5 py-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
            Knowledge by domain
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {DOMAINS.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="truncate text-[#1A1612]">{d.name}</span>
                </span>
                <span className="flex-shrink-0 font-mono text-[10.5px] text-[#5A5450]">{d.docCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live agent feed (since we removed the agents rail, keep a slice here) */}
        <div className="border-t border-[rgba(26,22,18,0.06)] px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Agent activity</span>
            <span className="font-mono text-[10px] text-[#A89C8A]">last 24h</span>
          </div>
          <ul className="space-y-1.5">
            {AGENT_FEED.slice(0, 6).map((f) => (
              <li key={f.id} className="truncate font-mono text-[10.5px] leading-[1.55] text-[#5A5450]">
                · {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Latency footer */}
        <div className="flex items-center justify-between border-t border-[rgba(26,22,18,0.06)] bg-[#FAF8F5] px-5 py-3">
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#5A5450]">
            <span>P50 retrieval · 142ms</span>
            <span className="text-[#A89C8A]">·</span>
            <span>Answer accuracy · 94.2%</span>
          </div>
          <span className="font-mono text-[10px] text-[#A89C8A]">last sync · {timeAgo(SOURCES[0].lastSync)}</span>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  value,
  label,
  sub,
  subTone
}: {
  value: string;
  label: string;
  sub?: string;
  subTone?: "positive" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      <div className="font-serif text-[36px] leading-none tracking-[-0.02em] text-[#1A1612]">{value}</div>
      <div className="text-[12px] text-[#5A5450]">{label}</div>
      {sub ? (
        <div
          className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
            subTone === "positive" ? "text-[#5A6B47]" : "text-[#A89C8A]"
          }`}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function Pill({
  tone,
  label,
  count
}: {
  tone: "success" | "warning" | "danger" | "muted";
  label: string;
  count: number;
}) {
  const colors: Record<typeof tone, { dot: string; text: string }> = {
    success: { dot: "#7A8C5F", text: "#5A6B47" },
    warning: { dot: "#C28840", text: "#8C5D1E" },
    danger:  { dot: "#9E3B2E", text: "#9E3B2E" },
    muted:   { dot: "#A89C8A", text: "#5A5450" }
  };
  return (
    <div className="flex items-baseline gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em]">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: colors[tone].dot }} />
      <span className="text-[#1A1612]">{count}</span>
      <span style={{ color: colors[tone].text }}>{label}</span>
    </div>
  );
}
