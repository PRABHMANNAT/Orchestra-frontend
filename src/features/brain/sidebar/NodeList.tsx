import { useEffect, useMemo, useRef, useState } from "react";
import { TbChevronRight } from "react-icons/tb";
import type { BrainCategory, BrainData, BrainNode } from "../brain.types";
import { useBrainStore } from "../state/brainStore";
import { brainTokens } from "../tokens";

const CATEGORIES: Array<{ id: BrainCategory; label: string }> = [
  { id: "doc", label: "Docs" },
  { id: "decision", label: "Decisions" },
  { id: "comms", label: "Comms" },
  { id: "team", label: "Team" },
  { id: "change", label: "Changes" }
];

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function NodeRow({ node }: { node: BrainNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const selectedNode = useBrainStore((state) => state.selectedNode);
  const selectNode = useBrainStore((state) => state.selectNode);
  const selected = selectedNode?.id === node.id;
  const color = brainTokens.pin[node.category];

  useEffect(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => selectNode(node)}
      className="group relative flex h-8 w-full items-center truncate px-4 pl-8 text-left font-sans text-[13px] text-[#1A1612] transition-colors hover:bg-[rgba(26,22,18,0.04)]"
      style={selected ? { background: brainTokens.categoryTint[node.category], color, borderLeft: `2px solid ${color}` } : undefined}
    >
      <span className="truncate group-hover:font-medium">{node.title}</span>
    </button>
  );
}

function CategorySection({ category, nodes, forceOpen }: { category: BrainCategory; nodes: BrainNode[]; forceOpen: boolean }) {
  const [open, setOpen] = useState(category === "doc");
  const activeFilter = useBrainStore((state) => state.activeFilter);
  const setFilter = useBrainStore((state) => state.setFilter);
  const isOpen = forceOpen || open;
  const color = brainTokens.pin[category];
  const label = CATEGORIES.find((item) => item.id === category)?.label ?? category;

  return (
    <section>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setFilter(category);
        }}
        className="flex h-9 w-full items-center px-4 text-left transition-colors hover:bg-[rgba(26,22,18,0.03)]"
      >
        <span className="mr-2 h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="min-w-0 flex-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#78716C]">{label}</span>
        <span className="mr-1 rounded-full px-1.5 py-0.5 font-mono text-[11px]" style={{ background: brainTokens.categoryTint[category], color }}>
          {nodes.length}
        </span>
        <TbChevronRight size={15} className={`text-[#78716C] transition-transform ${isOpen ? "rotate-90" : ""} ${activeFilter === category ? "text-[#1A1612]" : ""}`} />
      </button>
      {isOpen ? (
        <div>
          {nodes.map((node) => (
            <NodeRow key={node.id} node={node} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function NodeList({ data }: { data: BrainData }) {
  const selectedNode = useBrainStore((state) => state.selectedNode);
  const query = useBrainStore((state) => state.searchQuery);
  const setSearchQuery = useBrainStore((state) => state.setSearchQuery);
  const matchesSearch = useBrainStore((state) => state.matchesSearch);
  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        nodes: data.nodes.filter((node) => node.category === category.id && matchesSearch(node))
      })),
    [data.nodes, matchesSearch, query]
  );

  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col overflow-hidden border-r border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]">
      <div className="border-b border-[rgba(26,22,18,0.06)] p-4 pb-3">
        <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#78716C]">Knowledge base</div>
        <input
          value={query}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Filter nodes..."
          className="h-8 w-full rounded-lg border border-[rgba(26,22,18,0.08)] bg-white px-2.5 font-sans text-[13px] text-[#1A1612] outline-none placeholder:text-[#78716C]/60 focus:border-[rgba(184,84,61,0.4)] focus:ring-2 focus:ring-[rgba(184,84,61,0.12)]"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {grouped.map((group) => (
          <CategorySection key={group.id} category={group.id} nodes={group.nodes} forceOpen={selectedNode?.category === group.id} />
        ))}
      </div>
      <div className="border-t border-[rgba(26,22,18,0.06)] px-4 py-2.5 font-mono text-[11px] text-[#78716C]">
        {data.nodes.length} pins · synced {relativeTime(data.syncedAt)}
      </div>
    </aside>
  );
}
