import { useEffect, useMemo, useRef, useState } from "react";
import { DOCS, DOMAINS, type Doc, type DocType, type DomainId } from "../data/mockBrainData";

/**
 * Memory clusters — one tile per domain. Heavy visuals, minimal text:
 *  · type-distribution donut for the cluster
 *  · 14-day area-sparkline activity pulse
 *  · animated count-up + trend chip
 *  · stacked owner avatars + recent docs
 */

type Props = {
  selectedDomain: DomainId | null;
  onSelectDomain: (id: DomainId | null) => void;
  onSelectDoc: (d: Doc) => void;
};

const TYPE_ICON: Record<DocType, string> = {
  doc: "≡",
  decision: "◆",
  comm: "❝",
  code: "</>",
  design: "◉",
  meeting: "▤",
  customer: "♚"
};

const TYPE_COLOR: Record<DocType, string> = {
  doc: "#3B82C4",
  decision: "#5A6B47",
  comm: "#7062B8",
  code: "#1A1612",
  design: "#B8543D",
  meeting: "#8C5D1E",
  customer: "#8C5D3B"
};

/* Tween a number toward target — used for the count-up effect.
 * Guarantees the final value lands even when RAF is throttled. */
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

export function MemorySection({ selectedDomain, onSelectDomain, onSelectDoc }: Props) {
  const clusters = useMemo(() => {
    return DOMAINS.map((domain) => {
      const docs = DOCS.filter((d) => d.domain === domain.id);
      const recent = [...docs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
      const ownerMap = new Map<string, { name: string; initials: string; color: string; count: number }>();
      for (const d of docs) {
        const key = d.uploader.initials;
        const prev = ownerMap.get(key);
        if (prev) prev.count++;
        else ownerMap.set(key, { name: d.uploader.name, initials: d.uploader.initials, color: d.uploader.color, count: 1 });
      }
      const owners = [...ownerMap.values()].sort((a, b) => b.count - a.count).slice(0, 4);

      // 14-day pulse
      const now = Date.now();
      const pulse: number[] = Array.from({ length: 14 }, () => 0);
      for (const d of docs) {
        const days = Math.floor((now - new Date(d.updatedAt).getTime()) / 86400000);
        if (days >= 0 && days < 14) pulse[13 - days]++;
      }

      // Type distribution
      const typeCounts: Record<DocType, number> = {
        doc: 0, decision: 0, comm: 0, code: 0, design: 0, meeting: 0, customer: 0
      };
      for (const d of docs) typeCounts[d.type] += 1;

      // Trend: last 7d vs prior 7d
      const recent7 = pulse.slice(7).reduce((a, b) => a + b, 0);
      const prior7 = pulse.slice(0, 7).reduce((a, b) => a + b, 0) || 1;
      const trendPct = Math.round(((recent7 - prior7) / prior7) * 100);

      return { domain, recent, owners, pulse, total: domain.docCount, typeCounts, trendPct };
    });
  }, []);

  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Memory · clusters</div>
          <h2 className="mt-1 font-serif text-[22px] leading-[1.15] tracking-[-0.01em] text-[#1A1612]">
            What the brain holds
          </h2>
        </div>
        <div className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A] md:block">
          {DOMAINS.length} clusters · click to filter
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {clusters.map(({ domain, recent, owners, pulse, total, typeCounts, trendPct }, idx) => (
          <ClusterCard
            key={domain.id}
            domain={domain}
            recent={recent}
            owners={owners}
            pulse={pulse}
            total={total}
            typeCounts={typeCounts}
            trendPct={trendPct}
            selected={selectedDomain === domain.id}
            dimmed={!!selectedDomain && selectedDomain !== domain.id}
            stagger={idx * 60}
            onClick={() => onSelectDomain(selectedDomain === domain.id ? null : domain.id)}
            onSelectDoc={onSelectDoc}
          />
        ))}
      </div>

      <style>{`
        @keyframes ms-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-draw {
          from { stroke-dashoffset: var(--len); }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ms-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}

type CardProps = {
  domain: typeof DOMAINS[number];
  recent: Doc[];
  owners: { name: string; initials: string; color: string; count: number }[];
  pulse: number[];
  total: number;
  typeCounts: Record<DocType, number>;
  trendPct: number;
  selected: boolean;
  dimmed: boolean;
  stagger: number;
  onClick: () => void;
  onSelectDoc: (d: Doc) => void;
};

function ClusterCard({
  domain, recent, owners, pulse, total, typeCounts, trendPct, selected, dimmed, stagger, onClick, onSelectDoc
}: CardProps) {
  const count = useCountUp(total);
  const trendUp = trendPct >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-[6px] border bg-white p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(26,22,18,0.08)]"
      style={{
        borderColor: selected ? domain.color : "rgba(26,22,18,0.08)",
        opacity: dimmed ? 0.4 : 1,
        animation: `ms-rise 0.5s ${stagger}ms ease-out both`,
        boxShadow: selected ? `0 0 0 1px ${domain.color}, 0 10px 28px ${domain.color}22` : undefined
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${domain.color}, ${domain.color}66, transparent)` }}
      />

      {/* Header: name + animated count + trend */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="min-w-0">
          <div className="truncate font-serif text-[15px] leading-tight text-[#1A1612]">{domain.name}</div>
          <div
            className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
            style={{
              background: trendUp ? "rgba(122,140,95,0.12)" : "rgba(158,59,46,0.10)",
              color: trendUp ? "#5C7A4A" : "#9E3B2E"
            }}
          >
            <span>{trendUp ? "▲" : "▼"}</span>
            <span className="tabular-nums">{Math.abs(trendPct)}%</span>
            <span className="text-[#A89C8A]">7d</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div
            className="font-serif text-[30px] leading-none tracking-tight tabular-nums"
            style={{ color: "#1A1612" }}
          >
            {count}
          </div>
          <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#A89C8A]">memories</div>
        </div>
      </div>

      {/* Visual row: donut + area sparkline */}
      <div className="flex items-center gap-3">
        <TypeDonut counts={typeCounts} color={domain.color} />
        <AreaPulse values={pulse} color={domain.color} />
      </div>

      {/* Owner stack + doc thumbnails */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {owners.map((o, i) => (
            <div
              key={o.initials}
              title={`${o.name} · ${o.count}`}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white font-mono text-[9px] text-white transition-transform group-hover:scale-105"
              style={{ background: o.color, transitionDelay: `${i * 20}ms` }}
            >
              {o.initials}
            </div>
          ))}
          {owners.length === 0 && (
            <div className="font-mono text-[9px] text-[#A89C8A]">no contributors</div>
          )}
        </div>
        <span
          className="font-mono text-[16px] leading-none transition-transform group-hover:translate-x-1"
          style={{ color: domain.color }}
        >
          ›
        </span>
      </div>

      {/* Recent doc thumbnails — minimal: just type chip + truncated title */}
      <div className="flex flex-col gap-1">
        {recent.slice(0, 3).map((d, i) => (
          <div
            key={d.id}
            onClick={(e) => { e.stopPropagation(); onSelectDoc(d); }}
            className="flex items-center gap-2 rounded-[3px] px-1.5 py-1 transition-colors hover:bg-[#FAF8F5]"
            style={{ animation: `ms-rise 0.4s ${stagger + 200 + i * 70}ms ease-out both` }}
          >
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[3px] font-mono text-[9px]"
              style={{ background: `${TYPE_COLOR[d.type]}1A`, color: TYPE_COLOR[d.type] }}
            >
              {TYPE_ICON[d.type]}
            </span>
            <span className="truncate text-[11px] text-[#1A1612]" title={d.title}>{d.title}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

/* A small SVG donut showing doc-type distribution for the cluster. */
function TypeDonut({ counts, color }: { counts: Record<DocType, number>; color: string }) {
  const entries = (Object.entries(counts) as [DocType, number][]).filter(([, n]) => n > 0);
  const total = entries.reduce((a, [, n]) => a + n, 0) || 1;
  const R = 18;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx={24} cy={24} r={R} fill="none" stroke="rgba(26,22,18,0.06)" strokeWidth={6} />
        {entries.map(([type, n], i) => {
          const frac = n / total;
          const len = frac * C;
          const dash = `${len} ${C - len}`;
          const seg = (
            <circle
              key={type}
              cx={24}
              cy={24}
              r={R}
              fill="none"
              stroke={TYPE_COLOR[type]}
              strokeWidth={6}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 24 24)"
              style={{
                ["--len" as any]: C,
                animation: `ms-draw 0.9s ${i * 80}ms ease-out both`
              }}
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <span className="absolute font-mono text-[10px] tabular-nums" style={{ color }}>{total}</span>
    </div>
  );
}

/* 14-day activity sparkline with area fill + line. Bars are placed under
 * peak points to give a hybrid look that reads more like data, less like a
 * decorative icon. */
function AreaPulse({ values, color }: { values: number[]; color: string }) {
  const W = 140;
  const H = 36;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return [x, y] as const;
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const last = values[values.length - 1];
  const lastPt = pts[pts.length - 1];
  const gradId = `mem-area-${color.replace("#", "")}`;
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [linePath]);

  return (
    <div className="relative flex-1">
      <svg width="100%" height={H + 8} viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: len || undefined,
            strokeDashoffset: len || undefined,
            animation: len ? `ms-draw 1.1s ease-out forwards` : undefined,
            ["--len" as any]: len
          }}
        />
        {last > 0 && (
          <circle cx={lastPt[0]} cy={lastPt[1]} r={2.2} fill={color} />
        )}
      </svg>
      <div className="mt-0.5 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-[#A89C8A]">
        <span>14d</span>
        <span className="tabular-nums" style={{ color }}>
          {values.reduce((a, b) => a + b, 0)} edits
        </span>
      </div>
    </div>
  );
}
