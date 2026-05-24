import { useMemo, useState } from "react";
import {
  TbCalendar,
  TbFilter,
  TbLayoutGrid,
  TbLayoutList,
  TbLock,
  TbSparkles,
  TbUser
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import {
  DocCard,
  DocMiniRef,
  DocRow,
  FilterChip,
  FreshnessDot,
  PersonDisc
} from "../features/company-brain/components/BrainBits";
import {
  AUDIT,
  CONFLICTS,
  DOCS,
  GAPS,
  HAIR,
  INK,
  MUTED,
  ORANGE,
  PEOPLE,
  PROJECTS,
  PURPLE,
  RUST,
  TEAL,
  personById
} from "../features/company-brain/data";
import type { AccessLevel, DocSource } from "../features/company-brain/types";
import { UploadModal } from "../features/company-brain/components/UploadModal";

type ViewMode = "list" | "grid";
type FilterKind = "type" | "owner" | "project" | "date" | "source" | "access";

export default function CompanyBrainDocumentsPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [openFilter, setOpenFilter] = useState<FilterKind | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newDocIds, setNewDocIds] = useState<Set<string>>(new Set());

  // active filter values
  const [fType, setFType] = useState<string[]>([]);
  const [fOwner, setFOwner] = useState<string[]>([]);
  const [fProject, setFProject] = useState<string[]>([]);
  const [fSource, setFSource] = useState<DocSource[]>([]);
  const [fAccess, setFAccess] = useState<AccessLevel[]>([]);
  const [fDate, setFDate] = useState<"any" | "today" | "week" | "month">("any");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOCS.filter((d) => {
      if (q && !(d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q)))) return false;
      if (fType.length && !fType.includes(d.type)) return false;
      if (fOwner.length && !fOwner.includes(d.uploaderId)) return false;
      if (fProject.length && (!d.projectId || !fProject.includes(d.projectId))) return false;
      if (fSource.length && !fSource.includes(d.source)) return false;
      if (fAccess.length && !fAccess.includes(d.access)) return false;
      if (fDate === "today" && !/min ago|h ago/.test(d.uploadedAt)) return false;
      if (fDate === "week" && /mo ago|w ago/.test(d.uploadedAt) && !/^[1-6]w/.test(d.uploadedAt)) return false;
      return true;
    });
  }, [query, fType, fOwner, fProject, fSource, fAccess, fDate]);

  const activeFilterCount =
    fType.length + fOwner.length + fProject.length + fSource.length + fAccess.length + (fDate !== "any" ? 1 : 0);

  const clearAll = () => {
    setFType([]);
    setFOwner([]);
    setFProject([]);
    setFSource([]);
    setFAccess([]);
    setFDate("any");
  };

  const onSaved = (id: string) => {
    setNewDocIds((s) => new Set(s).add(id));
    setTimeout(() => {
      setNewDocIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  return (
    <>
      <BrainShell
        onUploadClick={() => setUploadOpen(true)}
        topBar={
          <BrainTopBar
            breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Documents" }]}
            searchQuery={query}
            onSearchChange={setQuery}
            onUploadClick={() => setUploadOpen(true)}
            onPasteClick={() => setUploadOpen(true)}
          />
        }
        rightRail={<DocsRail />}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* filter strip */}
          <div className="flex flex-wrap items-center gap-2 px-6 py-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <FilterPopover label="type" icon={<TbFilter className="h-3 w-3" strokeWidth={1.5} />} active={fType.length > 0} open={openFilter === "type"} onToggle={() => setOpenFilter(openFilter === "type" ? null : "type")}>
              {["md", "pdf", "docx", "code", "video", "audio", "image"].map((t) => (
                <CheckRow key={t} label={t} checked={fType.includes(t)} onChange={() => setFType((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])} />
              ))}
            </FilterPopover>

            <FilterPopover label="owner" icon={<TbUser className="h-3 w-3" strokeWidth={1.5} />} active={fOwner.length > 0} open={openFilter === "owner"} onToggle={() => setOpenFilter(openFilter === "owner" ? null : "owner")}>
              {PEOPLE.map((p) => (
                <CheckRow key={p.id} label={p.name} checked={fOwner.includes(p.id)} onChange={() => setFOwner((s) => s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])} icon={<PersonDisc person={p} size={16} />} />
              ))}
            </FilterPopover>

            <FilterPopover label="project" active={fProject.length > 0} open={openFilter === "project"} onToggle={() => setOpenFilter(openFilter === "project" ? null : "project")}>
              {PROJECTS.map((p) => (
                <CheckRow key={p.id} label={p.name} checked={fProject.includes(p.id)} onChange={() => setFProject((s) => s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])} />
              ))}
            </FilterPopover>

            <FilterPopover label="date" icon={<TbCalendar className="h-3 w-3" strokeWidth={1.5} />} active={fDate !== "any"} open={openFilter === "date"} onToggle={() => setOpenFilter(openFilter === "date" ? null : "date")}>
              {(["any", "today", "week", "month"] as const).map((d) => (
                <RadioRow key={d} label={d} checked={fDate === d} onChange={() => setFDate(d)} />
              ))}
            </FilterPopover>

            <FilterPopover label="source" active={fSource.length > 0} open={openFilter === "source"} onToggle={() => setOpenFilter(openFilter === "source" ? null : "source")}>
              {(["drive", "slack", "notion", "github", "manual", "url", "loom"] as DocSource[]).map((s) => (
                <CheckRow key={s} label={s} checked={fSource.includes(s)} onChange={() => setFSource((c) => c.includes(s) ? c.filter((x) => x !== s) : [...c, s])} />
              ))}
            </FilterPopover>

            <FilterPopover label="access" icon={<TbLock className="h-3 w-3" strokeWidth={1.5} />} active={fAccess.length > 0} open={openFilter === "access"} onToggle={() => setOpenFilter(openFilter === "access" ? null : "access")}>
              {(["public-team", "project-only", "role-restricted", "private", "human-only"] as AccessLevel[]).map((a) => (
                <CheckRow key={a} label={a} checked={fAccess.includes(a)} onChange={() => setFAccess((c) => c.includes(a) ? c.filter((x) => x !== a) : [...c, a])} />
              ))}
            </FilterPopover>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full px-2 py-0.5 font-mono text-[11px]"
                style={{ color: RUST }}
              >
                clear {activeFilterCount}
              </button>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                {filtered.length} of {DOCS.length}
              </span>
              <div className="inline-flex rounded-full border bg-white p-0.5" style={{ borderColor: HAIR }}>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="rounded-full p-1"
                  style={{ background: view === "list" ? "#F1ECE4" : "transparent", color: view === "list" ? INK : MUTED }}
                  aria-label="list view"
                >
                  <TbLayoutList className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className="rounded-full p-1"
                  style={{ background: view === "grid" ? "#F1ECE4" : "transparent", color: view === "grid" ? INK : MUTED }}
                  aria-label="grid view"
                >
                  <TbLayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* docs */}
          <div className="flex-1 overflow-y-auto">
            {view === "list" ? (
              <div>
                {filtered.map((d) => (
                  <DocRow key={d.id} doc={d} isNew={newDocIds.has(d.id)} />
                ))}
                {filtered.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="font-sans text-[14px]" style={{ color: INK }}>
                      Nothing matches.
                    </p>
                    <p className="mt-1 font-mono text-[11px]" style={{ color: MUTED }}>
                      Try clearing filters or a broader search.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((d) => (
                  <DocCard key={d.id} doc={d} isNew={newDocIds.has(d.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </BrainShell>

      {uploadOpen ? <UploadModal onClose={() => setUploadOpen(false)} onSaved={onSaved} /> : null}
    </>
  );
}

// ─── Filter popover ─────────────────────────────────────────────────────────

function FilterPopover({
  label,
  icon,
  active,
  open,
  onToggle,
  children
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
        style={{
          background: active ? `${RUST}14` : "transparent",
          color: active ? RUST : MUTED,
          borderColor: active ? `${RUST}55` : HAIR
        }}
      >
        {icon}
        {label}
        <span style={{ color: MUTED }}>▾</span>
      </button>
      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-[260px] w-[200px] overflow-y-auto rounded-[8px] border bg-white p-2 shadow-[0_6px_24px_rgba(26,22,18,0.08)]"
          style={{ borderColor: HAIR }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  icon
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[#FAF8F5]">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[color:#B8543D]" />
      {icon}
      <span className="font-sans text-[12px]" style={{ color: INK }}>
        {label}
      </span>
    </label>
  );
}

function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[#FAF8F5]">
      <input type="radio" checked={checked} onChange={onChange} className="accent-[color:#B8543D]" />
      <span className="font-sans text-[12px]" style={{ color: INK }}>
        {label}
      </span>
    </label>
  );
}

// ─── Right rail (Brain Pulse summary) ──────────────────────────────────────

function DocsRail() {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          BRAIN PULSE
        </p>
        <div className="grid grid-cols-2 gap-2">
          <RailTile label="Conflicts"      value={CONFLICTS.length} accent={RUST}   icon="!" />
          <RailTile label="Gaps"           value={GAPS.length}      accent={PURPLE} icon="?" />
          <RailTile label="Stale"          value={3}                accent={ORANGE} icon="•" />
          <RailTile label="Recent uploads" value={6}                accent={TEAL}   icon="↑" />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          TOP FETCHED THIS WEEK
        </p>
        <ul className="space-y-1.5">
          {DOCS.slice()
            .sort((a, b) => (b.fetchedThisWeek?.humans ?? 0) + (b.fetchedThisWeek?.agents ?? 0) - ((a.fetchedThisWeek?.humans ?? 0) + (a.fetchedThisWeek?.agents ?? 0)))
            .slice(0, 5)
            .map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-[6px] border px-2 py-1.5" style={{ borderColor: HAIR }}>
                <DocMiniRef docId={d.id} />
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {(d.fetchedThisWeek?.humans ?? 0) + (d.fetchedThisWeek?.agents ?? 0)}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          RECENT ACTIVITY
        </p>
        <ul className="space-y-1.5">
          {AUDIT.slice(0, 4).map((a) => {
            const p = personById(a.actorId);
            return (
              <li key={a.id} className="rounded-[6px] border px-2 py-1.5" style={{ borderColor: HAIR }}>
                <p className="font-sans text-[12px]" style={{ color: INK }}>
                  <span style={{ color: MUTED }}>{p?.name}</span> {a.action.replace(/-/g, " ")}
                </p>
                <p className="truncate font-mono text-[10px]" style={{ color: MUTED }}>
                  {a.docTitle}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function RailTile({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: string }) {
  return (
    <div className="rounded-[6px] border bg-white p-2" style={{ borderColor: HAIR }}>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[9px] tracking-[0.16em]" style={{ color: MUTED }}>
          {label.toUpperCase()}
        </p>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p className="mt-1 font-sans text-[18px] leading-none" style={{ color: INK }}>
        {value}
      </p>
    </div>
  );
}
