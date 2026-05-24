import { useMemo } from "react";
import { DOCS, type Doc, type DomainId } from "../data/mockBrainData";

/**
 * People & projects, as visual blocks. Two stacked rows:
 *  1. PEOPLE — who owns what (avatar tile + their last 3 memories)
 *  2. ACTIVE PROJECTS — named projects with their recent doc thumbnails
 *
 * Designed to be visual, low-text. Tap any doc to open the drawer.
 */

type Props = {
  selectedDomain: DomainId | null;
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

const PEOPLE_ROLES: Record<string, string> = {
  KR: "Frontend lead",
  SC: "Design",
  AS: "Backend",
  PM: "Full-stack",
  MV: "Agent ops",
  MT: "PM",
  LF: "Sales",
  HT: "Platform",
  MC: "Customer success",
  AI: "DX",
  JP: "Design ops",
  YS: "Data infra",
  PS: "Legal",
  JW: "Compliance"
};

const ACTIVE_PROJECTS = [
  { name: "Northstar Cloud", color: "#B8543D", domains: ["northstar", "engineering"] as DomainId[] },
  { name: "Payments v2", color: "#3B82C4", domains: ["northstar", "engineering"] as DomainId[] },
  { name: "Onboarding Redesign", color: "#7A8C5F", domains: ["onboarding", "design"] as DomainId[] },
  { name: "Customer Acme", color: "#8B7FD4", domains: ["acme"] as DomainId[] }
];

export function DocumentsView({ selectedDomain, onSelectDoc }: Props) {
  // PEOPLE: aggregate docs per uploader
  const people = useMemo(() => {
    const map = new Map<
      string,
      { name: string; initials: string; color: string; docs: Doc[] }
    >();
    for (const d of DOCS) {
      if (selectedDomain && d.domain !== selectedDomain) continue;
      const key = d.uploader.initials;
      const prev = map.get(key);
      if (prev) prev.docs.push(d);
      else
        map.set(key, {
          name: d.uploader.name,
          initials: d.uploader.initials,
          color: d.uploader.color,
          docs: [d]
        });
    }
    return [...map.values()]
      .sort((a, b) => b.docs.length - a.docs.length)
      .slice(0, 8)
      .map((p) => ({
        ...p,
        recent: [...p.docs]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3),
        role: PEOPLE_ROLES[p.initials] ?? "Contributor"
      }));
  }, [selectedDomain]);

  // PROJECTS: pull recent docs per named project (filter by domain set)
  const projects = useMemo(() => {
    return ACTIVE_PROJECTS.map((p) => {
      const docs = DOCS.filter((d) => p.domains.includes(d.domain));
      const recent = [...docs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      // contributors
      const ownerSet = new Map<string, { initials: string; color: string }>();
      for (const d of docs) ownerSet.set(d.uploader.initials, { initials: d.uploader.initials, color: d.uploader.color });
      const owners = [...ownerSet.values()].slice(0, 5);
      // type counts
      const typeCounts = new Map<Doc["type"], number>();
      for (const d of docs) typeCounts.set(d.type, (typeCounts.get(d.type) ?? 0) + 1);
      return { ...p, recent, owners, total: docs.length, typeCounts };
    });
  }, []);

  return (
    <section className="py-8">
      {/* PEOPLE */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Who works on what</div>
          <h2 className="mt-2 font-serif text-[28px] leading-[1.1] tracking-[-0.012em] text-[#1A1612]">
            People · memory ownership
          </h2>
        </div>
        <div className="hidden text-right md:block">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A89C8A]">
            {people.length} of {new Set(DOCS.map((d) => d.uploader.initials)).size} contributors
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {people.map((p) => (
          <div
            key={p.initials}
            className="flex flex-col gap-2 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-3"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-mono text-[12px] text-white"
                style={{ background: p.color }}
              >
                {p.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[#1A1612]">{p.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8A7E6F]">
                  {p.role} · {p.docs.length} memories
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {p.recent.map((d) => {
                const t = TYPE_COLOR[d.type];
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDoc(d)}
                    className="flex w-full items-center gap-2 rounded-[3px] border border-transparent px-1.5 py-1 text-left transition-colors hover:border-[rgba(26,22,18,0.06)] hover:bg-[#FAF8F5]"
                  >
                    <span
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[2px] font-mono text-[8px]"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {TYPE_ICON[d.type]}
                    </span>
                    <span className="truncate text-[10.5px] text-[#1A1612]">{d.title}</span>
                    <span className="ml-auto flex-shrink-0 font-mono text-[9px] text-[#A89C8A]">{timeAgo(d.updatedAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* PROJECTS */}
      <div className="mt-12 mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Active projects</div>
          <h2 className="mt-2 font-serif text-[28px] leading-[1.1] tracking-[-0.012em] text-[#1A1612]">
            What's shipping · what's loaded
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {projects.map((proj) => (
          <div
            key={proj.name}
            className="flex flex-col gap-3 overflow-hidden rounded-[4px] border bg-white p-4"
            style={{ borderColor: "rgba(26,22,18,0.08)", borderLeftWidth: 3, borderLeftColor: proj.color }}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A7E6F]">project</div>
                <div className="font-serif text-[18px] leading-tight text-[#1A1612]">{proj.name}</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-[24px] leading-none tracking-tight text-[#1A1612]">{proj.total}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A89C8A]">memories</div>
              </div>
            </div>

            {/* Type breakdown */}
            <div className="flex flex-wrap gap-1">
              {Array.from(proj.typeCounts.entries()).map(([type, count]) => {
                const t = TYPE_COLOR[type];
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5"
                    style={{ background: t.bg, color: t.fg }}
                  >
                    <span className="font-mono text-[10px]">{TYPE_ICON[type]}</span>
                    <span className="font-mono text-[10px]">{count}</span>
                  </span>
                );
              })}
            </div>

            {/* Contributors */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {proj.owners.map((o) => (
                  <div
                    key={o.initials}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white font-mono text-[9px] text-white"
                    style={{ background: o.color }}
                  >
                    {o.initials}
                  </div>
                ))}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#8A7E6F]">
                {proj.owners.length}+ contributors
              </span>
            </div>

            {/* Recent docs */}
            <div className="space-y-1 border-t border-[rgba(26,22,18,0.04)] pt-2">
              {proj.recent.map((d) => {
                const t = TYPE_COLOR[d.type];
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDoc(d)}
                    className="flex w-full items-center gap-2 rounded-[3px] px-1 py-1 text-left transition-colors hover:bg-[#FAF8F5]"
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[2px] font-mono text-[9px]"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {TYPE_ICON[d.type]}
                    </span>
                    <span className="truncate text-[11.5px] text-[#1A1612]">{d.title}</span>
                    <span className="ml-auto flex-shrink-0 font-mono text-[9.5px] text-[#A89C8A]">
                      {timeAgo(d.updatedAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
