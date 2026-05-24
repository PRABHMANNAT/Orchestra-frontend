import { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  TbArchive,
  TbBrain,
  TbCalendarEvent,
  TbCode,
  TbDotsVertical,
  TbExternalLink,
  TbFileText,
  TbFlag2,
  TbGitBranch,
  TbLock,
  TbMessage2,
  TbPalette,
  TbQuote,
  TbRobot,
  TbUsers
} from "react-icons/tb";
import { DOCS, DOMAINS, type Doc, type DocType, type DomainId } from "../data/mockBrainData";

type View = "grid" | "list" | "timeline";
type GroupBy = "project" | "person" | "type" | "source" | "recency" | "health";

const TYPE_META: Record<DocType, { label: string; bg: string; fg: string; Icon: IconType }> = {
  doc: { label: "Doc", bg: "rgba(59,130,196,0.12)", fg: "#3B82C4", Icon: TbFileText },
  decision: { label: "Decision", bg: "rgba(122,140,95,0.14)", fg: "#5A6B47", Icon: TbGitBranch },
  comm: { label: "Comm", bg: "rgba(139,127,212,0.14)", fg: "#7062B8", Icon: TbMessage2 },
  code: { label: "Code", bg: "rgba(26,22,18,0.08)", fg: "#1A1612", Icon: TbCode },
  design: { label: "Design", bg: "rgba(184,84,61,0.10)", fg: "#B8543D", Icon: TbPalette },
  meeting: { label: "Meeting", bg: "rgba(194,136,64,0.14)", fg: "#8C5D1E", Icon: TbCalendarEvent },
  customer: { label: "Customer", bg: "rgba(158,107,61,0.12)", fg: "#8C5D3B", Icon: TbUsers }
};

const FRESHNESS_BORDER: Record<Doc["freshness"], string> = {
  active: "#7A8C5F",
  stale: "#C28840",
  historical: "#A89C8A"
};

const QUICK_ACTIONS: { label: string; Icon: IconType }[] = [
  { label: "Open", Icon: TbExternalLink },
  { label: "Cite", Icon: TbQuote },
  { label: "Flag", Icon: TbFlag2 },
  { label: "Archive", Icon: TbArchive },
  { label: "Ask", Icon: TbMessage2 }
];

type Props = {
  selectedDomain: DomainId | null;
  onSelectDoc: (doc: Doc) => void;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function DocumentsView({ selectedDomain, onSelectDoc }: Props) {
  const [view, setView] = useState<View>("grid");
  const [groupBy, setGroupBy] = useState<GroupBy>("recency");
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [secondaryFilter, setSecondaryFilter] = useState<"all" | "active" | "stale" | "conflicting" | "mine" | "agent">("all");

  const filtered = useMemo(() => {
    return DOCS.filter((doc) => {
      if (selectedDomain && doc.domain !== selectedDomain) return false;
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (secondaryFilter === "active" && doc.freshness !== "active") return false;
      if (secondaryFilter === "stale" && doc.freshness !== "stale") return false;
      if (secondaryFilter === "mine" && doc.uploader.initials !== "PM") return false;
      if (secondaryFilter === "agent" && !doc.agentAccessible) return false;
      return true;
    });
  }, [selectedDomain, typeFilter, secondaryFilter]);

  return (
    <section className="pb-8">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">All Memories</div>
          <div className="mt-1 font-mono text-[12px] text-[#5A5450]">
            {filtered.length} of {DOCS.length}{" "}
            {selectedDomain ? `/ filtered to ${DOMAINS.find((domain) => domain.id === selectedDomain)?.name}` : ""}
          </div>
        </div>

        <div className="flex w-fit items-center gap-1 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-0.5">
          {(["grid", "list", "timeline"] as View[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`rounded-[3px] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                view === option ? "bg-[#1A1612] text-white" : "text-[#5A5450] hover:bg-[#FAF8F5]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">Group by</span>
        {(["project", "person", "type", "source", "recency", "health"] as GroupBy[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGroupBy(option)}
            className={`rounded-full border px-3 py-1 text-[11px] capitalize transition-colors ${
              groupBy === option
                ? "border-[#1A1612] bg-[#1A1612] text-white"
                : "border-[rgba(26,22,18,0.12)] bg-white text-[#5A5450] hover:bg-[#FAF8F5]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(["all", "doc", "decision", "comm", "code", "design", "meeting", "customer"] as ("all" | DocType)[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTypeFilter(option)}
            className={`rounded-[3px] border px-2.5 py-1 text-[11px] capitalize transition-colors ${
              typeFilter === option
                ? "border-[#B8543D] bg-[rgba(184,84,61,0.08)] text-[#B8543D]"
                : "border-[rgba(26,22,18,0.08)] bg-white text-[#5A5450] hover:bg-[#FAF8F5]"
            }`}
          >
            {option === "all" ? "All" : TYPE_META[option].label}
          </button>
        ))}

        <span className="mx-2 h-4 w-px bg-[rgba(26,22,18,0.12)]" />

        {(["all", "active", "stale", "conflicting", "mine", "agent"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSecondaryFilter(option)}
            className={`rounded-[3px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              secondaryFilter === option
                ? "border-[#1A1612] bg-[#1A1612] text-white"
                : "border-[rgba(26,22,18,0.08)] bg-white text-[#5A5450] hover:bg-[#FAF8F5]"
            }`}
          >
            {option === "all" ? "All" : option === "agent" ? "Agent-accessible" : option}
          </button>
        ))}
      </div>

      {view === "grid" ? <GridView docs={filtered.slice(0, 36)} onSelectDoc={onSelectDoc} /> : null}
      {view === "list" ? <ListView docs={filtered.slice(0, 40)} onSelectDoc={onSelectDoc} /> : null}
      {view === "timeline" ? <TimelineView docs={filtered.slice(0, 24)} onSelectDoc={onSelectDoc} /> : null}
    </section>
  );
}

function DocCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  const meta = TYPE_META[doc.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="group relative flex min-h-[184px] cursor-pointer flex-col gap-2 overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(26,22,18,0.16)] hover:shadow-[0_4px_16px_rgba(26,22,18,0.06)]"
    >
      <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: FRESHNESS_BORDER[doc.freshness] }} />

      <div className="flex items-start justify-between pl-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-[3px]" style={{ background: meta.bg, color: meta.fg }}>
          <meta.Icon size={15} strokeWidth={1.7} />
        </div>

        <div className="flex items-center gap-1">
          {doc.restricted ? (
            <TbLock size={13} strokeWidth={1.7} className="text-[#8A7E6F]" aria-label="Restricted" />
          ) : doc.agentAccessible ? (
            <TbRobot size={14} strokeWidth={1.7} className="text-[#8A7E6F]" aria-label="Agent allowed" />
          ) : null}
          <button
            type="button"
            className="text-[#A89C8A] hover:text-[#1A1612]"
            aria-label="More"
            onClick={(event) => event.stopPropagation()}
          >
            <TbDotsVertical size={14} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <div className="line-clamp-2 pl-1 text-[14px] font-semibold leading-tight text-[#1A1612]">{doc.title}</div>
      <div className="line-clamp-2 pl-1 text-[12px] leading-[1.5] text-[#78716C]">{doc.summary}</div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2 pl-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-mono text-[9px] text-white" style={{ background: doc.uploader.color }}>
            {doc.uploader.initials}
          </div>
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#8A7E6F]">{doc.source}</span>
          <span className="flex-shrink-0 font-mono text-[10px] text-[#A89C8A]">/ {timeAgo(doc.updatedAt)}</span>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1 font-mono text-[10px] text-[#A89C8A]">
          <TbBrain size={12} strokeWidth={1.7} /> used {doc.fetchCount}x
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-between gap-1 rounded-[3px] border border-[rgba(26,22,18,0.08)] bg-white px-2 py-1 opacity-0 shadow-sm transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        {QUICK_ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={(event) => event.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-[3px] text-[#5A5450] hover:bg-[#FAF8F5] hover:text-[#1A1612]"
          >
            <Icon size={15} strokeWidth={1.7} />
          </button>
        ))}
      </div>
    </div>
  );
}

function GridView({ docs, onSelectDoc }: { docs: Doc[]; onSelectDoc: (doc: Doc) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {docs.map((doc) => (
        <DocCard key={doc.id} doc={doc} onClick={() => onSelectDoc(doc)} />
      ))}
    </div>
  );
}

function ListView({ docs, onSelectDoc }: { docs: Doc[]; onSelectDoc: (doc: Doc) => void }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white">
      <div className="grid grid-cols-[2.5fr_120px_120px_100px_60px] gap-3 border-b border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">
        <div>Title</div>
        <div>Type</div>
        <div>Source</div>
        <div>Updated</div>
        <div className="text-right">Used</div>
      </div>

      {docs.map((doc) => {
        const meta = TYPE_META[doc.type];
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onSelectDoc(doc)}
            className="grid w-full grid-cols-[2.5fr_120px_120px_100px_60px] items-center gap-3 border-b border-[rgba(26,22,18,0.04)] px-4 py-2.5 text-left hover:bg-[#FAF8F5]"
            style={{ borderLeftWidth: "3px", borderLeftColor: FRESHNESS_BORDER[doc.freshness] }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[3px]" style={{ background: meta.bg, color: meta.fg }}>
                <meta.Icon size={14} strokeWidth={1.7} />
              </div>
              <span className="truncate text-[13px] text-[#1A1612]">{doc.title}</span>
            </div>
            <span className="font-mono text-[11px] capitalize text-[#5A5450]">{meta.label}</span>
            <span className="font-mono text-[11px] text-[#5A5450]">{doc.source}</span>
            <span className="font-mono text-[11px] text-[#8A7E6F]">{timeAgo(doc.updatedAt)}</span>
            <span className="text-right font-mono text-[11px] text-[#A89C8A]">{doc.fetchCount}x</span>
          </button>
        );
      })}
    </div>
  );
}

function TimelineView({ docs, onSelectDoc }: { docs: Doc[]; onSelectDoc: (doc: Doc) => void }) {
  const sorted = [...docs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 h-full w-px bg-[rgba(26,22,18,0.08)]" />
      {sorted.map((doc) => {
        const meta = TYPE_META[doc.type];
        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onSelectDoc(doc)}
            className="relative mb-3 flex w-full flex-col gap-1 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-3 text-left hover:bg-[#FAF8F5]"
          >
            <span className="absolute -left-[22px] top-4 inline-block h-2 w-2 rounded-full" style={{ background: FRESHNESS_BORDER[doc.freshness] }} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]" style={{ background: meta.bg, color: meta.fg }}>
                  {meta.label}
                </span>
                <span className="truncate text-[13px] font-medium text-[#1A1612]">{doc.title}</span>
              </div>
              <span className="flex-shrink-0 font-mono text-[10px] text-[#A89C8A]">{timeAgo(doc.updatedAt)}</span>
            </div>
            <div className="line-clamp-2 text-[12px] text-[#78716C]">{doc.summary}</div>
          </button>
        );
      })}
    </div>
  );
}
