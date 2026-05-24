import { useMemo, useState } from "react";
import { SOURCES, type Source } from "../data/mockBrainData";
import { SourceLogo } from "./SourceLogos";

/* Per-status visual treatment */
const STATUS_META: Record<
  Source["status"],
  { label: string; color: string; soft: string; ring: string }
> = {
  synced: {
    label: "synced",
    color: "#5C7A4A",
    soft: "rgba(122,140,95,0.12)",
    ring: "rgba(122,140,95,0.35)"
  },
  syncing: {
    label: "syncing",
    color: "#A86A28",
    soft: "rgba(194,136,64,0.14)",
    ring: "rgba(194,136,64,0.4)"
  },
  error: {
    label: "needs attention",
    color: "#9E3B2E",
    soft: "rgba(158,59,46,0.10)",
    ring: "rgba(158,59,46,0.35)"
  },
  not_connected: {
    label: "not connected",
    color: "#A89C8A",
    soft: "rgba(168,156,138,0.10)",
    ring: "rgba(168,156,138,0.35)"
  }
};

const FILTERS = ["all", "synced", "syncing", "error", "not_connected"] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* A deterministic 12-point sparkline per source so it doesn't jitter on
 * re-render but still feels unique per card. */
function sparkPoints(seed: string, w: number, h: number): string {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s >>> 16) / 65535;
  };
  const N = 12;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * w;
    const y = h - (0.25 + rand() * 0.7) * h;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

export function SourcesStrip() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? SOURCES
        : SOURCES.filter((s) => s.status === filter),
    [filter]
  );

  const counts = useMemo(() => {
    return SOURCES.reduce(
      (acc, s) => {
        acc.total += 1;
        if (s.status !== "not_connected") acc.connected += 1;
        if (s.status === "syncing") acc.syncing += 1;
        if (s.status === "error") acc.error += 1;
        acc.items += s.itemsIndexed;
        return acc;
      },
      { total: 0, connected: 0, syncing: 0, error: 0, items: 0 }
    );
  }, []);

  return (
    <section className="py-10">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
            Connected Sources
          </div>
          <h2 className="mt-1 font-serif text-[22px] leading-[1.15] tracking-[-0.01em] text-[#1A1612]">
            Where the brain pulls from
          </h2>
        </div>
        <div className="flex items-end gap-5">
          <Metric label="Connected" value={`${counts.connected}/${counts.total}`} />
          <div className="h-8 w-px bg-[rgba(26,22,18,0.1)]" />
          <Metric label="Syncing" value={String(counts.syncing)} accent="#A86A28" />
          <div className="h-8 w-px bg-[rgba(26,22,18,0.1)]" />
          <Metric label="Errors" value={String(counts.error)} accent={counts.error ? "#9E3B2E" : undefined} />
          <div className="h-8 w-px bg-[rgba(26,22,18,0.1)]" />
          <Metric label="Indexed" value={counts.items.toLocaleString()} />
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f;
          const n =
            f === "all"
              ? SOURCES.length
              : SOURCES.filter((s) => s.status === f).length;
          const label = f === "not_connected" ? "available" : f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-all"
              style={{
                borderColor: active ? "rgba(184,84,61,0.4)" : "rgba(26,22,18,0.1)",
                background: active ? "rgba(184,84,61,0.06)" : "white",
                color: active ? "#1A1612" : "#5A5450"
              }}
            >
              <span>{label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px]"
                style={{
                  background: active ? "rgba(184,84,61,0.12)" : "rgba(26,22,18,0.05)",
                  color: active ? "#B8543D" : "#8A7E6F"
                }}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card grid — horizontal scroll on small, wraps on large */}
      <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-3 xl:grid xl:grid-cols-4 xl:overflow-visible 2xl:grid-cols-6">
        {filtered.map((src) => (
          <SourceCard key={src.id} src={src} />
        ))}
      </div>

      <style>{`
        @keyframes ss-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes ss-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes ss-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes ss-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

function Metric({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="text-right">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">
        {label}
      </div>
      <div
        className="font-mono text-[16px] tabular-nums"
        style={{ color: accent ?? "#1A1612" }}
      >
        {value}
      </div>
    </div>
  );
}

function SourceCard({ src }: { src: Source }) {
  const meta = STATUS_META[src.status];
  const isConnected = src.status !== "not_connected";
  const isSyncing = src.status === "syncing";
  const isError = src.status === "error";

  return (
    <div
      className="group relative flex w-[230px] flex-shrink-0 flex-col overflow-hidden rounded-[6px] border bg-white transition-all duration-200 hover:-translate-y-0.5 xl:w-auto"
      style={{
        borderColor: "rgba(26,22,18,0.08)",
        boxShadow: "0 1px 2px rgba(26,22,18,0.04)",
        opacity: isConnected ? 1 : 0.85
      }}
    >
      {/* Top accent stripe — status-tinted */}
      <div
        className="relative h-[3px] w-full overflow-hidden"
        style={{ background: meta.soft }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width: "60%",
            background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
            opacity: isSyncing ? 0.9 : 0.35,
            animation: isSyncing ? "ss-shimmer 2.4s ease-in-out infinite" : "none"
          }}
        />
      </div>

      <div className="flex flex-col gap-3 p-3.5">
        {/* Header row: logo + name + status */}
        <div className="flex items-start gap-2.5">
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[5px]"
              style={{
                background: meta.soft,
                boxShadow: `inset 0 0 0 1px ${meta.ring}`
              }}
            >
              <SourceLogo id={src.id} size={26} />
            </div>
            {isSyncing && (
              <span
                className="absolute -right-0.5 -top-0.5 inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: meta.color, boxShadow: `0 0 0 2px white` }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: meta.color,
                    animation: "ss-pulse-ring 1.8s ease-out infinite"
                  }}
                />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium leading-tight text-[#1A1612]">
              {src.name}
            </div>
            <div
              className="mt-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.12em]"
              style={{ color: meta.color }}
            >
              {isSyncing && (
                <span
                  className="inline-block h-2.5 w-2.5"
                  style={{
                    border: `1.5px solid ${meta.color}`,
                    borderRightColor: "transparent",
                    borderRadius: "50%",
                    animation: "ss-spin 0.9s linear infinite"
                  }}
                />
              )}
              {!isSyncing && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: meta.color,
                    animation: isError ? "ss-breathe 1.4s ease-in-out infinite" : "none"
                  }}
                />
              )}
              {meta.label}
            </div>
          </div>
        </div>

        {/* Body: counts + sparkline OR connect button */}
        {isConnected ? (
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="font-serif text-[22px] leading-none tracking-tight text-[#1A1612] tabular-nums">
                {src.itemsIndexed.toLocaleString()}
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#A89C8A]">
                items indexed
              </div>
            </div>
            <svg width="64" height="22" viewBox="0 0 64 22" className="flex-shrink-0">
              <defs>
                <linearGradient id={`grad-${src.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={meta.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,22 ${sparkPoints(src.id, 64, 22)} 64,22`}
                fill={`url(#grad-${src.id})`}
              />
              <polyline
                points={sparkPoints(src.id, 64, 22)}
                fill="none"
                stroke={meta.color}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isError ? 0.5 : 0.95}
              />
            </svg>
          </div>
        ) : (
          <button
            type="button"
            className="rounded-[4px] border border-dashed border-[rgba(184,84,61,0.35)] bg-[rgba(184,84,61,0.04)] py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#B8543D] transition-colors hover:bg-[rgba(184,84,61,0.08)]"
          >
            + Connect source
          </button>
        )}

        {/* Footer: last sync + actions */}
        {isConnected && (
          <div className="flex items-center justify-between border-t border-[rgba(26,22,18,0.06)] pt-2.5">
            <span className="font-mono text-[10px] text-[#8A7E6F]">
              {isError ? (
                <span className="text-[#9E3B2E]">sync failed · {timeAgo(src.lastSync)}</span>
              ) : (
                <>last sync {timeAgo(src.lastSync)}</>
              )}
            </span>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isError ? (
                <button
                  type="button"
                  className="rounded-[3px] bg-[#B8543D] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white hover:bg-[#8C3E28]"
                >
                  Retry
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5450] hover:bg-[#FAF8F5]"
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5450] hover:bg-[#FAF8F5]"
                  >
                    Resync
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtle bottom-right corner glow for syncing cards */}
      {isSyncing && (
        <div
          className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full"
          style={{
            background: `radial-gradient(circle, ${meta.soft} 0%, transparent 70%)`
          }}
        />
      )}
    </div>
  );
}
