import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TbArchive,
  TbBolt,
  TbBoxMultiple,
  TbBrain,
  TbChartHistogram,
  TbChevronRight,
  TbClipboardList,
  TbClockHour4,
  TbFiles,
  TbFlag2,
  TbFolders,
  TbInbox,
  TbLayoutSidebar,
  TbLock,
  TbMessage2,
  TbPlus,
  TbSearch,
  TbSparkles,
  TbUpload,
  TbUsers
} from "react-icons/tb";
import { COLLECTIONS, HAIR, INK, MUTED, PROJECTS, RUST, SMART_SUBS, TEAMS } from "../data";

export const BRAIN_BG = "#FAF8F5";
export const BRAIN_SURFACE = "#FFFFFF";

interface NavGroup {
  label: string;
  items: { key: string; label: string; icon: ReactNode; href: string; count?: number; active?: (p: string) => boolean }[];
}

export function BrainShell({
  rightRail,
  children,
  topBar,
  onUploadClick
}: {
  rightRail?: ReactNode;
  children: ReactNode;
  topBar?: ReactNode;
  onUploadClick?: () => void;
}) {
  const { pathname } = useLocation();
  const [railOpen, setRailOpen] = useState(true);

  const groups: NavGroup[] = [
    {
      label: "BROWSE",
      items: [
        { key: "all",      label: "All documents",     icon: <TbFiles className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents", count: 248, active: (p) => p === "/company-brain/documents" },
        { key: "smart",    label: "Smart collections", icon: <TbSparkles className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?collection=smart", count: 12 },
        { key: "projects", label: "By project",        icon: <TbFolders className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?group=project", count: 8 },
        { key: "teams",    label: "By team",           icon: <TbUsers className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?group=team", count: 6 },
        { key: "recent",   label: "Recently added",    icon: <TbClockHour4 className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?filter=recent", count: 14 },
        { key: "flagged",  label: "Flagged",           icon: <TbFlag2 className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?filter=flagged", count: 5 },
        { key: "archive",  label: "Archived",          icon: <TbArchive className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/documents?filter=archived", count: 33 }
      ]
    },
    {
      label: "MANAGE",
      items: [
        { key: "pulse",     label: "Brain Pulse",     icon: <TbChartHistogram className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain", active: (p) => p === "/company-brain" },
        { key: "search",    label: "Search",          icon: <TbSearch className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/search" },
        { key: "packs",     label: "Context packs",   icon: <TbBoxMultiple className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/packs" },
        { key: "feedback",  label: "Agent feedback",  icon: <TbInbox className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/feedback" },
        { key: "perms",     label: "Permissions",     icon: <TbLock className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/permissions" },
        { key: "audit",     label: "Audit log",       icon: <TbClipboardList className="h-4 w-4" strokeWidth={1.5} />, href: "/company-brain/audit" }
      ]
    }
  ];

  const isActive = (item: NavGroup["items"][number]) =>
    item.active ? item.active(pathname) : pathname.startsWith(item.href.split("?")[0]) && item.href !== "/company-brain";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BRAIN_BG }}>
      {/* internal sidebar */}
      <aside
        className="flex h-full w-[260px] flex-shrink-0 flex-col overflow-y-auto border-r"
        style={{ borderColor: HAIR, background: BRAIN_SURFACE }}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[6px]"
            style={{ background: `${RUST}14`, color: RUST }}
          >
            <TbBrain className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-sans text-[14px] leading-none" style={{ color: INK }}>
              Company Brain
            </p>
            <p className="mt-0.5 font-mono text-[10px]" style={{ color: MUTED }}>
              orchestra · org
            </p>
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.label} className="px-3 pb-3">
            <p
              className="px-2 pb-1.5 pt-2 font-mono text-[9px] tracking-[0.18em]"
              style={{ color: MUTED }}
            >
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it);
                return (
                  <li key={it.key}>
                    <Link
                      to={it.href}
                      className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-sans text-[13px] transition-colors hover:bg-[#FAF8F5]"
                      style={{
                        background: active ? `${RUST}10` : "transparent",
                        color: active ? RUST : INK
                      }}
                    >
                      <span style={{ color: active ? RUST : MUTED }}>{it.icon}</span>
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.count !== undefined ? (
                        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                          {it.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="px-3 pb-3">
          <p className="px-2 pb-1.5 pt-2 font-mono text-[9px] tracking-[0.18em]" style={{ color: MUTED }}>
            SMART COLLECTIONS
          </p>
          <ul className="space-y-0.5">
            {SMART_SUBS.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/company-brain/documents?smart=${s.id}`}
                  className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-sans text-[13px] hover:bg-[#FAF8F5]"
                  style={{ color: INK }}
                >
                  <TbBolt className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} style={{ color: MUTED }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {s.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-3 pb-3">
          <p className="px-2 pb-1.5 pt-2 font-mono text-[9px] tracking-[0.18em]" style={{ color: MUTED }}>
            BY PROJECT
          </p>
          <ul className="space-y-0.5">
            {PROJECTS.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/company-brain/documents?project=${p.id}`}
                  className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-sans text-[13px] hover:bg-[#FAF8F5]"
                  style={{ color: INK }}
                >
                  <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: MUTED }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {p.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-3 pb-6">
          <p className="px-2 pb-1.5 pt-2 font-mono text-[9px] tracking-[0.18em]" style={{ color: MUTED }}>
            BY TEAM
          </p>
          <ul className="space-y-0.5">
            {TEAMS.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/company-brain/documents?team=${t.id}`}
                  className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-sans text-[13px] hover:bg-[#FAF8F5]"
                  style={{ color: INK }}
                >
                  <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: MUTED }} />
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {t.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto px-3 py-3">
          <button
            type="button"
            onClick={onUploadClick}
            className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 font-sans text-[13px] text-white"
            style={{ background: RUST }}
          >
            <TbPlus className="h-4 w-4" strokeWidth={1.5} />
            New document
          </button>
        </div>
      </aside>

      {/* main column */}
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {topBar ? (
          <header
            className="flex-shrink-0 border-b"
            style={{ borderColor: HAIR, background: BRAIN_SURFACE }}
          >
            {topBar}
          </header>
        ) : null}
        <div className="flex h-full min-h-0 flex-1 overflow-hidden">
          <div className="h-full min-w-0 flex-1 overflow-y-auto">
            {children}
          </div>
          {rightRail ? (
            <motion.aside
              initial={false}
              animate={{ width: railOpen ? 340 : 36 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full flex-shrink-0 overflow-hidden border-l"
              style={{ borderColor: HAIR, background: BRAIN_SURFACE }}
            >
              <button
                type="button"
                onClick={() => setRailOpen((x) => !x)}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-[6px] hover:bg-[#FAF8F5]"
                style={{ color: MUTED }}
                aria-label={railOpen ? "collapse rail" : "expand rail"}
              >
                <TbLayoutSidebar
                  className="h-4 w-4"
                  strokeWidth={1.5}
                  style={{ transform: railOpen ? "scaleX(-1)" : "scaleX(1)" }}
                />
              </button>
              {railOpen ? (
                <div className="h-full overflow-y-auto p-4 pt-12">{rightRail}</div>
              ) : (
                <div className="flex h-full flex-col items-center justify-start pt-12">
                  <TbSparkles className="h-4 w-4" strokeWidth={1.5} style={{ color: MUTED }} />
                </div>
              )}
            </motion.aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function BrainTopBar({
  title,
  breadcrumb,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onUploadClick,
  onPasteClick,
  actions
}: {
  title?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: () => void;
  onUploadClick?: () => void;
  onPasteClick?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {breadcrumb ? (
            <nav className="flex items-center gap-1 font-mono text-[11px]" style={{ color: MUTED }}>
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {b.href ? (
                    <Link to={b.href} className="hover:text-[color:var(--text-1)]">
                      {b.label}
                    </Link>
                  ) : (
                    <span>{b.label}</span>
                  )}
                  {i < breadcrumb.length - 1 ? <TbChevronRight className="h-3 w-3" strokeWidth={1.5} /> : null}
                </span>
              ))}
            </nav>
          ) : null}
          {title ? (
            <div className="truncate font-sans text-[16px]" style={{ color: INK }}>
              {title}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onPasteClick ? (
            <button
              type="button"
              onClick={onPasteClick}
              className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 font-sans text-[12px] hover:bg-[#FAF8F5]"
              style={{ borderColor: HAIR, color: INK }}
            >
              <TbMessage2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              paste as knowledge
            </button>
          ) : null}
          {onUploadClick ? (
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-sans text-[12px] text-white"
              style={{ background: RUST }}
            >
              <TbUpload className="h-3.5 w-3.5" strokeWidth={1.5} />
              upload
            </button>
          ) : null}
        </div>
      </div>

      {onSearchChange !== undefined ? (
        <div className="relative">
          <TbSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            strokeWidth={1.5}
            style={{ color: MUTED }}
          />
          <input
            value={searchQuery ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchSubmit?.();
            }}
            placeholder="search the brain — semantic + keyword combined"
            className="w-full rounded-[8px] border bg-white py-2.5 pl-10 pr-4 font-sans text-[14px] outline-none placeholder:text-[#A09790]"
            style={{ borderColor: HAIR, color: INK }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px]"
            style={{ color: MUTED }}
          >
            ⌘ K
          </span>
        </div>
      ) : null}
    </div>
  );
}
