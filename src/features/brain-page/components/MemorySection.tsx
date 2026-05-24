import { useMemo } from "react";
import { DOCS, DOMAINS, type Doc, type DomainId } from "../data/mockBrainData";
import { SourceLogo } from "./SourceLogos";

/**
 * Memory context, as visual cluster blocks. One tile per project / domain
 * cluster. Each tile shows: domain accent, owner avatar stack, four recent
 * docs as type-icon thumbnails, a recency pulse, and a memory count.
 *
 * Intentionally low-text. Designed to communicate "this is what we know
 * about X" at a glance.
 */

type Props = {
  selectedDomain: DomainId | null;
  onSelectDomain: (id: DomainId | null) => void;
  onSelectDoc: (d: Doc) => void;
};

const TYPE_ICON: Record<Doc["type"], string> = {
  doc: "≡",
  decision: "◆",
  comm: "❝",
  code: "</>",
  design: "◉",
  meeting: "▤",
  customer: "♚"
};

const TYPE_COLOR: Record<Doc["type"], { bg: string; fg: string }> = {
  doc: { bg: "rgba(59,130,196,0.10)", fg: "#3B82C4" },
  decision: { bg: "rgba(122,140,95,0.14)", fg: "#5A6B47" },
  comm: { bg: "rgba(139,127,212,0.14)", fg: "#7062B8" },
  code: { bg: "rgba(26,22,18,0.08)", fg: "#1A1612" },
  design: { bg: "rgba(184,84,61,0.10)", fg: "#B8543D" },
  meeting: { bg: "rgba(194,136,64,0.14)", fg: "#8C5D1E" },
  customer: { bg: "rgba(158,107,61,0.12)", fg: "#8C5D3B" }
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

export function MemorySection({ selectedDomain, onSelectDomain, onSelectDoc }: Props) {
  const clusters = useMemo(() => {
    return DOMAINS.map((domain) => {
      const docs = DOCS.filter((d) => d.domain === domain.id);
      const recent = [...docs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
      // owners by frequency
      const ownerMap = new Map<string, { name: string; initials: string; color: string; count: number }>();
      for (const d of docs) {
        const key = d.uploader.initials;
        const prev = ownerMap.get(key);
        if (prev) prev.count++;
        else
          ownerMap.set(key, {
            name: d.uploader.name,
            initials: d.uploader.initials,
            color: d.uploader.color,
            count: 1
          });
      }
      const owners = [...ownerMap.values()].sort((a, b) => b.count - a.count).slice(0, 4);
      // 14-day "pulse" — count per day for the last 14 days
      const now = Date.now();
      const pulse: number[] = Array.from({ length: 14 }, () => 0);
      for (const d of docs) {
        const days = Math.floor((now - new Date(d.updatedAt).getTime()) / 86400000);
        if (days >= 0 && days < 14) pulse[13 - days]++;
      }
      return { domain, recent, owners, pulse, total: docs.length };
    });
  }, []);

  return (
    <section className="py-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Memory · context</div>
          <h2 className="mt-2 font-serif text-[28px] leading-[1.1] tracking-[-0.012em] text-[#1A1612]">
            What the brain holds, by cluster
          </h2>
        </div>
        <div className="hidden text-right md:block">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A89C8A]">
            8 clusters · click to filter
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {clusters.map(({ domain, recent, owners, pulse, total }) => {
          const isSelected = selectedDomain === domain.id;
          const isDimmed = selectedDomain && !isSelected;
          return (
            <button
              key={domain.id}
              type="button"
              onClick={() => onSelectDomain(isSelected ? null : domain.id)}
              className={`group relative flex flex-col gap-3 overflow-hidden rounded-[4px] border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,22,18,0.08)] ${
                isDimmed ? "opacity-45" : ""
              }`}
              style={{
                borderColor: isSelected ? domain.color : "rgba(26,22,18,0.08)",
                borderLeftWidth: 3,
                borderLeftColor: domain.color
              }}
            >
              {/* Header: domain name + total */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A7E6F]">cluster</div>
                  <div className="font-serif text-[16px] leading-tight text-[#1A1612]">{domain.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-[26px] leading-none tracking-tight text-[#1A1612]">{domain.docCount}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A89C8A]">memories</div>
                </div>
              </div>

              {/* Owner avatar stack */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {owners.map((o) => (
                    <div
                      key={o.initials}
                      title={o.name}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white font-mono text-[9px] text-white"
                      style={{ background: o.color }}
                    >
                      {o.initials}
                    </div>
                  ))}
                </div>
                <PulseBar values={pulse} color={domain.color} />
              </div>

              {/* Recent doc thumbnails */}
              <div className="grid grid-cols-2 gap-1.5">
                {recent.map((d) => {
                  const t = TYPE_COLOR[d.type];
                  return (
                    <div
                      key={d.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDoc(d);
                      }}
                      className="flex items-center gap-1.5 rounded-[3px] border border-[rgba(26,22,18,0.04)] bg-[#FAF8F5] px-1.5 py-1 transition-colors hover:border-[rgba(26,22,18,0.12)] hover:bg-white"
                    >
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[2px] font-mono text-[8px]"
                        style={{ background: t.bg, color: t.fg }}
                      >
                        {TYPE_ICON[d.type]}
                      </span>
                      <span className="truncate text-[10.5px] text-[#1A1612]" title={d.title}>
                        {d.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer: last updated */}
              <div className="flex items-center justify-between border-t border-[rgba(26,22,18,0.04)] pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#A89C8A]">
                <span>updated · {timeAgo(domain.lastUpdated)} ago</span>
                <span style={{ color: domain.color }}>›</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PulseBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 20 }}>
      {values.map((v, i) => {
        const h = (v / max) * 18 + 2;
        return (
          <span
            key={i}
            className="inline-block w-[3px] rounded-[1px]"
            style={{
              height: h,
              background: v === 0 ? "rgba(26,22,18,0.08)" : color,
              opacity: v === 0 ? 1 : 0.4 + (v / max) * 0.6
            }}
          />
        );
      })}
    </div>
  );
}
