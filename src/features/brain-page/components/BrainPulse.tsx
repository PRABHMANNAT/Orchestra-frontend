import { useEffect, useState } from "react";
import { CONFLICTS, GAPS, STALE, TOP_FETCHED, PENDING_REVIEW } from "../data/mockBrainData";

/**
 * Brain Pulse — at-a-glance health signals. Each card carries a custom
 * visualization instead of body text:
 *  · Conflicts  — diverging-arrows icon
 *  · Gaps       — dashed missing-tile grid
 *  · Stale      — aging bars fading to grey
 *  · Top Fetched — mini horizontal bar chart
 *  · Pending Review — stacked queue
 */

function useCountUp(target: number, durationMs = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const finalize = setTimeout(() => setVal(target), durationMs + 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(finalize);
    };
  }, [target, durationMs]);
  return val;
}

type CardProps = {
  label: string;
  value: number | string;
  accent: string;
  action: string;
  visual: React.ReactNode;
  stagger: number;
  unit?: string;
};

function PulseCard({ label, value, accent, action, visual, stagger, unit }: CardProps) {
  return (
    <div
      className="group relative flex h-[200px] flex-col justify-between overflow-hidden rounded-[6px] border border-[rgba(26,22,18,0.08)] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(26,22,18,0.08)]"
      style={{ animation: `bp-rise 0.5s ${stagger}ms ease-out both` }}
    >
      {/* Accent stripe top */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55, transparent)` }}
      />
      <div className="flex items-start justify-between gap-2 pt-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-[34px] leading-none tracking-tight tabular-nums" style={{ color: accent }}>
            {value}
          </span>
          {unit && (
            <span className="font-mono text-[11px] text-[#A89C8A]">{unit}</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-2">{visual}</div>

      <button
        className="self-start font-mono text-[10px] uppercase tracking-[0.12em] transition-transform group-hover:translate-x-1"
        style={{ color: accent }}
      >
        {action} →
      </button>

      {/* Subtle hover glow */}
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)` }}
      />
    </div>
  );
}

/* ─── Visuals ─────────────────────────────────────────────────────────── */

function ConflictVisual({ color }: { color: string }) {
  return (
    <svg width="120" height="64" viewBox="0 0 120 64">
      <defs>
        <marker id="bp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill={color} />
        </marker>
      </defs>
      {/* Source node */}
      <circle cx="60" cy="32" r="6" fill={color} opacity="0.2" />
      <circle cx="60" cy="32" r="3" fill={color} />
      {/* Diverging arrows */}
      <path d="M 60 32 Q 80 18 100 18" stroke={color} strokeWidth="1.5" fill="none" markerEnd="url(#bp-arr)"
        style={{ animation: "bp-pulse 2.4s ease-in-out infinite" }} />
      <path d="M 60 32 Q 80 46 100 46" stroke={color} strokeWidth="1.5" fill="none" markerEnd="url(#bp-arr)"
        style={{ animation: "bp-pulse 2.4s 0.4s ease-in-out infinite" }} />
      {/* Endpoint mismatches */}
      <rect x="102" y="13" width="14" height="10" rx="2" fill={color} opacity="0.18" />
      <rect x="102" y="41" width="14" height="10" rx="2" fill={color} opacity="0.18" />
      {/* "!" badge between */}
      <circle cx="60" cy="32" r="9" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4"
        style={{ animation: "bp-ring 2s ease-out infinite" }} />
    </svg>
  );
}

function GapsVisual({ color }: { color: string }) {
  /* 3×4 grid of "memories"; two slots are dashed = missing. */
  const cells: { missing: boolean }[] = [
    { missing: false }, { missing: false }, { missing: true }, { missing: false },
    { missing: false }, { missing: true }, { missing: false }, { missing: false },
    { missing: false }, { missing: false }, { missing: false }, { missing: true }
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cells.map((c, i) =>
        c.missing ? (
          <div
            key={i}
            className="h-6 w-7 rounded-[3px] border border-dashed"
            style={{
              borderColor: color,
              background: `${color}10`,
              animation: `bp-blink 1.8s ${(i % 3) * 0.2}s ease-in-out infinite`
            }}
          />
        ) : (
          <div
            key={i}
            className="h-6 w-7 rounded-[3px]"
            style={{ background: "rgba(26,22,18,0.06)" }}
          />
        )
      )}
    </div>
  );
}

function StaleVisual({ color }: { color: string }) {
  /* Aging bars: newer = full color, older = fades to grey */
  const ages = [4, 18, 32, 47, 62, 74, 89]; // days
  const maxAge = 90;
  return (
    <div className="flex items-end gap-1.5" style={{ height: 60 }}>
      {ages.map((a, i) => {
        const stale = a > 30;
        const h = 16 + (a / maxAge) * 40;
        const opacity = stale ? 0.45 + (1 - a / maxAge) * 0.4 : 1;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-3 rounded-t-[2px]"
              style={{
                height: h,
                background: stale ? "#A89C8A" : color,
                opacity,
                animation: `bp-grow 0.6s ${i * 60}ms ease-out both`,
                transformOrigin: "bottom"
              }}
            />
            <span className="font-mono text-[7px] text-[#A89C8A]">{a}d</span>
          </div>
        );
      })}
    </div>
  );
}

function TopFetchedVisual({ color }: { color: string; items: { id: string; title: string; fetches: number }[] }) {
  const items = TOP_FETCHED.slice(0, 3);
  const max = Math.max(...items.map((i) => i.fetches));
  return (
    <div className="flex w-full flex-col gap-1.5">
      {items.map((it, i) => {
        const pct = (it.fetches / max) * 100;
        return (
          <div key={it.id} className="flex items-center gap-2">
            <span className="w-3 truncate font-mono text-[9px] text-[#A89C8A] tabular-nums">{i + 1}</span>
            <div className="relative flex-1 overflow-hidden rounded-[2px] bg-[rgba(26,22,18,0.04)]" style={{ height: 14 }}>
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}99)`,
                  animation: `bp-grow-x 0.7s ${i * 110}ms ease-out both`,
                  transformOrigin: "left"
                }}
              />
              <span className="absolute inset-y-0 left-1.5 flex items-center truncate text-[9.5px] text-[#1A1612]"
                title={it.title}>
                {it.title}
              </span>
            </div>
            <span className="w-7 text-right font-mono text-[9.5px] tabular-nums" style={{ color }}>{it.fetches}×</span>
          </div>
        );
      })}
    </div>
  );
}

function PendingVisual({ color, count }: { color: string; count: number }) {
  /* Stacked queue cards giving a sense of how many are waiting. */
  const stack = Math.min(count, 5);
  return (
    <div className="relative" style={{ width: 96, height: 60 }}>
      {Array.from({ length: stack }).map((_, i) => {
        const offset = i * 5;
        return (
          <div
            key={i}
            className="absolute left-1/2 rounded-[4px] border bg-white"
            style={{
              width: 84,
              height: 36,
              top: offset,
              transform: `translateX(-50%)`,
              borderColor: i === stack - 1 ? color : "rgba(26,22,18,0.1)",
              boxShadow: i === stack - 1 ? `0 4px 12px ${color}30` : "0 1px 2px rgba(26,22,18,0.05)",
              zIndex: i,
              animation: `bp-slide-in 0.5s ${i * 80}ms ease-out both`
            }}
          >
            <div className="flex h-full items-center gap-2 px-2">
              <div className="h-2 w-2 rounded-full" style={{ background: i === stack - 1 ? color : "rgba(26,22,18,0.2)" }} />
              <div className="flex flex-col gap-0.5">
                <div className="h-1.5 w-12 rounded-full bg-[rgba(26,22,18,0.1)]" />
                <div className="h-1 w-9 rounded-full bg-[rgba(26,22,18,0.06)]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BrainPulse() {
  const conflicts = useCountUp(CONFLICTS.length);
  const gaps = useCountUp(GAPS.length);
  const stale = useCountUp(STALE.length);
  const top = useCountUp(TOP_FETCHED[0]?.fetches ?? 0);
  const pending = useCountUp(PENDING_REVIEW);

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Brain · pulse</div>
          <h2 className="mt-1 font-serif text-[22px] leading-[1.15] tracking-[-0.01em] text-[#1A1612]">
            Where the brain needs attention
          </h2>
        </div>
        <div className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A] md:block">
          5 signals · refreshed live
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <PulseCard
          label="Conflicts"
          value={conflicts}
          accent="#9E3B2E"
          action="Resolve"
          stagger={0}
          visual={<ConflictVisual color="#9E3B2E" />}
        />
        <PulseCard
          label="Gaps"
          value={gaps}
          accent="#8C5D1E"
          action="Capture"
          stagger={70}
          visual={<GapsVisual color="#8C5D1E" />}
        />
        <PulseCard
          label="Stale"
          value={stale}
          accent="#C28840"
          action="Review"
          stagger={140}
          visual={<StaleVisual color="#C28840" />}
        />
        <PulseCard
          label="Top Fetched"
          value={top}
          unit="×"
          accent="#1A1612"
          action="See all"
          stagger={210}
          visual={<TopFetchedVisual color="#5A5450" items={TOP_FETCHED} />}
        />
        <PulseCard
          label="Pending Review"
          value={pending}
          accent="#5E7A8C"
          action="Review queue"
          stagger={280}
          visual={<PendingVisual color="#5E7A8C" count={PENDING_REVIEW} />}
        />
      </div>

      <style>{`
        @keyframes bp-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes bp-ring {
          0% { r: 9; opacity: 0.5; }
          100% { r: 18; opacity: 0; }
        }
        @keyframes bp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bp-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes bp-grow-x {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes bp-slide-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
