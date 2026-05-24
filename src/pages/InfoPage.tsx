import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  TbArrowDown,
  TbArrowRight,
  TbArrowUp,
  TbChevronDown,
  TbChevronRight,
  TbCircleFilled,
  TbCommand,
  TbDownload,
  TbMessage2,
  TbSearch,
  TbSend,
  TbSparkles,
  TbTool,
  TbUser,
  TbX
} from "react-icons/tb";
import {
  attentionItems,
  blockers,
  findPerson,
  findProject,
  openRoles,
  orgPulse,
  orgStats,
  people,
  projects,
  shipLog,
  type AttentionItem,
  type Blocker,
  type OpenRole,
  type Person,
  type Project,
  type ShipEntry,
  type Team,
  type WorkloadLevel
} from "../features/info/data";

// ────────────────────────────────────────────────────────────────────────────
// Tokens
// ────────────────────────────────────────────────────────────────────────────

const CREAM = "#F5F1EB";
const SURFACE = "#FFFFFF";
const INK = "#1A1612";
const MUTED = "#78716C";
const MUTED_2 = "rgba(120, 113, 108, 0.6)";
const BORDER = "rgba(26, 22, 18, 0.08)";
const BORDER_HOVER = "rgba(26, 22, 18, 0.16)";
const RUST = "#B8543D";
const RUST_TINT = "rgba(184, 84, 61, 0.08)";

const HEALTH_COLORS: Record<
  "healthy" | "at-risk" | "off-track",
  { fg: string; bg: string; label: string }
> = {
  healthy: { fg: "#2D4A3E", bg: "rgba(45, 74, 62, 0.10)", label: "Healthy" },
  "at-risk": { fg: "#8C5D1E", bg: "rgba(194, 136, 64, 0.12)", label: "At risk" },
  "off-track": { fg: "#9E3B2E", bg: "rgba(158, 59, 46, 0.10)", label: "Off track" }
};

const WORKLOAD_COLORS: Record<WorkloadLevel, string> = {
  light: "#BDB7AF",
  balanced: "#2D4A3E",
  high: "#C28840",
  overloaded: "#9E3B2E"
};

// ────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children, count }: { children: React.ReactNode; count?: React.ReactNode }) {
  return (
    <p className="font-mono text-[10.5px] tracking-[0.18em] text-[#78716C]" style={{ textTransform: "uppercase" }}>
      {children}
      {count !== undefined ? <span className="ml-1.5 text-[#1A1612]">· {count}</span> : null}
    </p>
  );
}

function InitialsAvatar({
  name,
  initials,
  size = 32,
  ring
}: {
  name: string;
  initials: string;
  size?: number;
  ring?: string;
}) {
  // Deterministic warm earth tone from name
  const palette = ["#E8DCC4", "#E6CFC0", "#D9CCC0", "#D6D0C2", "#E2D2BC", "#CCC6BA", "#E0C4B2", "#CFC9BF"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = palette[h % palette.length];

  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: INK,
        fontFamily: "Geist, sans-serif",
        fontSize: Math.round(size * 0.36),
        fontWeight: 500,
        letterSpacing: "0.01em",
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
}

function Sparkline({
  data,
  width = 120,
  height = 28,
  stroke = RUST
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / span) * (height - 4) - 2}`)
    .join(" ");
  const last = data[data.length - 1];
  const lastX = (data.length - 1) * step;
  const lastY = height - ((last - min) / span) * (height - 4) - 2;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline fill="none" stroke={stroke} strokeWidth={1.25} points={points} />
      <circle cx={lastX} cy={lastY} r={1.8} fill={stroke} />
    </svg>
  );
}

function HealthPill({ health }: { health: Project["health"] }) {
  const c = HEALTH_COLORS[health];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-[2px] font-mono text-[10px] tracking-[0.06em]"
      style={{ color: c.fg, background: c.bg }}
    >
      <TbCircleFilled size={6} />
      {c.label}
    </span>
  );
}

function VelocityArrow({ velocity }: { velocity: Project["velocity"] }) {
  const map = {
    improving: { Icon: TbArrowUp, color: "#2D4A3E", label: "improving" },
    flat: { Icon: TbArrowRight, color: MUTED, label: "flat" },
    declining: { Icon: TbArrowDown, color: "#9E3B2E", label: "declining" }
  };
  const v = map[velocity];
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10.5px]" style={{ color: v.color }}>
      <v.Icon size={11} strokeWidth={2} />
      {v.label}
    </span>
  );
}

function WorkloadBar({ level, pct }: { level: WorkloadLevel; pct: number }) {
  return (
    <div className="h-[3px] w-full rounded-[2px] bg-[rgba(26,22,18,0.06)]">
      <div
        className="h-full rounded-[2px]"
        style={{
          width: `${Math.min(100, Math.max(8, pct))}%`,
          background: WORKLOAD_COLORS[level]
        }}
      />
    </div>
  );
}

function HumanAge(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

const TEAM_TABS: ("All" | Team)[] = ["All", "Engineering", "Design", "Product", "GTM", "Ops"];
type WorkloadFilter = null | "overloaded" | "available" | "on-leave" | "new";
type ProjectSort = "health" | "deadline" | "team";

// ────────────────────────────────────────────────────────────────────────────
// Dashboard-style sections (subscriptions, calendar, recent changes)
// Folded into Info page; the dedicated Dashboard route has been removed.
// ────────────────────────────────────────────────────────────────────────────

type WeekEvent = {
  day: number; // 0–4 Mon–Fri
  time: string;
  title: string;
  team: string;
  attendees: number;
  unassigned?: boolean;
};

const WEEK_EVENTS: WeekEvent[] = [
  { day: 0, time: "09:30", title: "Northstar standup", team: "Engineering", attendees: 6 },
  { day: 0, time: "14:00", title: "Aurora migration review", team: "Platform", attendees: 4 },
  { day: 0, time: "16:00", title: "1:1 · Adhiraj", team: "Engineering", attendees: 2 },
  { day: 1, time: "10:00", title: "Design review · onboarding v3", team: "Design", attendees: 5 },
  { day: 1, time: "13:00", title: "Acme QBR", team: "Customer", attendees: 4, unassigned: true },
  { day: 2, time: "09:00", title: "Standup", team: "Engineering", attendees: 6 },
  { day: 2, time: "11:00", title: "Pricing committee", team: "GTM", attendees: 7 },
  { day: 2, time: "15:00", title: "Security review", team: "Engineering", attendees: 3, unassigned: true },
  { day: 3, time: "11:00", title: "RFC walk · edge cache", team: "Engineering", attendees: 5 },
  { day: 3, time: "14:00", title: "Hiring loop debrief", team: "Ops", attendees: 4 },
  { day: 4, time: "10:00", title: "All-hands prep", team: "All", attendees: 8, unassigned: true },
  { day: 4, time: "13:00", title: "Apollo data residency", team: "Platform", attendees: 3 },
  { day: 4, time: "15:30", title: "Investor update review", team: "GTM", attendees: 4 }
];

type RecentChange = {
  kind: "ship" | "decision" | "doc" | "blocker" | "person";
  who: string;
  what: string;
  project: string;
  when: string;
};

const RECENT_CHANGES: RecentChange[] = [
  { kind: "ship", who: "Kartikeya", what: "Auth middleware refactor merged", project: "Northstar Cloud", when: "12m ago" },
  { kind: "decision", who: "Pricing committee", what: "Yearly default + monthly opt-in ratified", project: "GTM", when: "38m ago" },
  { kind: "doc", who: "Adhiraj", what: "RFC · Edge cache layer (draft)", project: "Northstar Cloud", when: "1h ago" },
  { kind: "blocker", who: "Yuki", what: "Backfill job blowing memory on prod", project: "Analytics pipeline", when: "1h ago" },
  { kind: "ship", who: "Sarah", what: "Onboarding v3 empty states shipped", project: "Onboarding Redesign", when: "2h ago" },
  { kind: "ship", who: "Prabh", what: "Billing webhook handler · idempotency fix", project: "Payments v2", when: "3h ago" },
  { kind: "person", who: "Yuki Sato", what: "joined Platform team", project: "—", when: "4h ago" },
  { kind: "decision", who: "Hiroshi", what: "Aurora geo-replication regions: us-east-1, eu-west-1", project: "Northstar Cloud", when: "6h ago" },
  { kind: "doc", who: "Mei", what: "Acme implementation notes (revised)", project: "Customer Acme", when: "8h ago" },
  { kind: "ship", who: "Marcus", what: "Quarterly investor update sent", project: "GTM", when: "1d ago" }
];

const CHANGE_KIND_META: Record<RecentChange["kind"], { label: string; fg: string; bg: string }> = {
  ship: { label: "Ship", fg: "#5A6B47", bg: "rgba(122,140,95,0.14)" },
  decision: { label: "Decision", fg: "#B8543D", bg: "rgba(184,84,61,0.10)" },
  doc: { label: "Doc", fg: "#3B82C4", bg: "rgba(59,130,196,0.10)" },
  blocker: { label: "Blocker", fg: "#9E3B2E", bg: "rgba(158,59,46,0.10)" },
  person: { label: "People", fg: "#7062B8", bg: "rgba(139,127,212,0.14)" }
};

function getMonday(d: Date): Date {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

function MySubscriptions({ onPick }: { onPick: (p: Project) => void }) {
  const subs = projects.slice(0, 6);
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={`${subs.length} watching`}>My subscriptions</SectionLabel>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">click to open</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {subs.map((p) => (
          <SubscriptionCard key={p.id} project={p} onClick={() => onPick(p)} />
        ))}
      </div>
    </section>
  );
}

function SubscriptionCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const lead = findPerson(project.teamLead);
  const health = HEALTH_COLORS[project.health];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-[4px] border bg-white px-4 py-3 text-left transition-colors hover:border-[rgba(26,22,18,0.16)]"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: MUTED_2 }}>
            {project.team}
          </div>
          <div className="mt-0.5 truncate font-serif text-[16px] leading-tight" style={{ color: INK }}>
            {project.name}
          </div>
        </div>
        <span
          className="flex-shrink-0 rounded-[3px] px-1.5 py-[2px] font-mono text-[10px] uppercase tracking-[0.06em]"
          style={{ color: health.fg, background: health.bg }}
        >
          {health.label}
        </span>
      </div>
      <div className="font-mono text-[10.5px]" style={{ color: MUTED }}>
        {project.nextMilestone} · {project.daysToDeadline}d
      </div>
      <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: BORDER }}>
        {lead ? (
          <div className="flex items-center gap-2">
            <InitialsAvatar name={lead.name} initials={lead.initials} size={22} />
            <span className="text-[11.5px]" style={{ color: INK }}>
              {lead.name}
            </span>
          </div>
        ) : (
          <span />
        )}
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          last · {project.lastShipped.when}
        </span>
      </div>
    </button>
  );
}

function WeekCalendar() {
  const monday = getMonday(new Date());
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count="this week">Calendar</SectionLabel>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">
          {WEEK_EVENTS.length} events · {WEEK_EVENTS.filter((e) => e.unassigned).length} unassigned
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {days.map((d, i) => {
          const isToday =
            d.toDateString() === new Date().toDateString();
          const dayEvents = WEEK_EVENTS.filter((e) => e.day === i);
          return (
            <div
              key={i}
              className="overflow-hidden rounded-[4px] border bg-white"
              style={{ borderColor: BORDER }}
            >
              <div
                className="flex items-baseline justify-between border-b px-3 py-2"
                style={{ borderColor: BORDER, background: isToday ? "rgba(184,84,61,0.04)" : "transparent" }}
              >
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="font-serif text-[18px] leading-tight" style={{ color: INK }}>
                    {d.getDate()}
                  </div>
                </div>
                {isToday ? (
                  <span
                    className="rounded-[3px] px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.1em]"
                    style={{ color: RUST, background: RUST_TINT }}
                  >
                    Today
                  </span>
                ) : null}
              </div>
              <div className="min-h-[120px] space-y-1.5 p-2">
                {dayEvents.length === 0 ? (
                  <div className="px-2 py-3 font-mono text-[10px]" style={{ color: MUTED_2 }}>
                    nothing scheduled
                  </div>
                ) : (
                  dayEvents.map((e, j) => (
                    <div
                      key={j}
                      className="rounded-[3px] px-2 py-1.5"
                      style={{
                        background: e.unassigned ? "rgba(194,136,64,0.10)" : "rgba(184,84,61,0.06)",
                        borderLeft: `2px solid ${e.unassigned ? "#C28840" : RUST}`
                      }}
                    >
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>
                        {e.time}
                      </div>
                      <div className="text-[11.5px] font-medium leading-tight" style={{ color: INK }}>
                        {e.title}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px]" style={{ color: MUTED }}>
                        {e.team} · {e.attendees}p
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentChanges() {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={`${RECENT_CHANGES.length} updates`}>Recent changes</SectionLabel>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">cross-team activity stream</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-[4px] border bg-white" style={{ borderColor: BORDER }}>
        {RECENT_CHANGES.map((c, i) => {
          const meta = CHANGE_KIND_META[c.kind];
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}
            >
              <span
                className="flex-shrink-0 rounded-[3px] px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.12em]"
                style={{ color: meta.fg, background: meta.bg }}
              >
                {meta.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px]" style={{ color: INK }}>
                  {c.what}
                </div>
                <div className="truncate font-mono text-[10px]" style={{ color: MUTED }}>
                  {c.who} · {c.project}
                </div>
              </div>
              <span className="flex-shrink-0 font-mono text-[10px]" style={{ color: MUTED_2 }}>
                {c.when}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function InfoPage() {
  const [askMode, setAskMode] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [teamTab, setTeamTab] = useState<(typeof TEAM_TABS)[number]>("All");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>(null);
  const [projectSort, setProjectSort] = useState<ProjectSort>("health");
  const [hiringExpanded, setHiringExpanded] = useState(false);
  const [shipFilterTeam, setShipFilterTeam] = useState<"All" | Team>("All");
  const [shipFilterType, setShipFilterType] = useState<"All" | ShipEntry["type"]>("All");
  const [dateRange, setDateRange] = useState<"Today" | "This week" | "This month">("This week");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; person: Person } | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Cmd+K → askMode, "A" → assign modal, Escape → close panels
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target && /input|textarea|select/i.test(target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAskMode((v) => !v);
      } else if (!isTyping && e.key.toLowerCase() === "a") {
        setAssignModalOpen(true);
      } else if (e.key === "Escape") {
        setSelectedPerson(null);
        setSelectedProject(null);
        setAssignModalOpen(false);
        setContextMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside ctx menu
  useEffect(() => {
    if (!contextMenu) return;
    function close() {
      setContextMenu(null);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const filteredPeople = useMemo(() => {
    let list = teamTab === "All" ? people : people.filter((p) => p.team === teamTab);
    if (workloadFilter === "overloaded") list = list.filter((p) => p.workload === "overloaded" || p.workload === "high");
    if (workloadFilter === "available") list = list.filter((p) => p.workload === "light");
    if (workloadFilter === "on-leave") list = list.filter((p) => p.status === "on-leave");
    if (workloadFilter === "new") list = list.filter((p) => p.status === "new");
    return list;
  }, [teamTab, workloadFilter]);

  const sortedProjects = useMemo(() => {
    const order = { healthy: 2, "at-risk": 1, "off-track": 0 };
    const copy = [...projects];
    if (projectSort === "health") copy.sort((a, b) => order[a.health] - order[b.health]);
    else if (projectSort === "deadline") copy.sort((a, b) => a.daysToDeadline - b.daysToDeadline);
    else copy.sort((a, b) => a.team.localeCompare(b.team));
    return copy;
  }, [projectSort]);

  const sortedBlockers = useMemo(() => [...blockers].sort((a, b) => b.ageHours - a.ageHours), []);

  const filteredShipLog = useMemo(() => {
    return shipLog.filter((s) => {
      if (shipFilterType !== "All" && s.type !== shipFilterType) return false;
      if (shipFilterTeam !== "All") {
        const p = findPerson(s.byId);
        if (!p || p.team !== shipFilterTeam) return false;
      }
      return true;
    });
  }, [shipFilterTeam, shipFilterType]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden" style={{ background: CREAM }}>
      {/* Middle column — Socrates ask mode */}
      <AnimatePresence initial={false}>
        {askMode ? (
          <motion.aside
            key="socrates"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex-shrink-0 overflow-hidden border-r"
            style={{ borderColor: BORDER, background: SURFACE }}
          >
            <SocratesAskPanel onClose={() => setAskMode(false)} />
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Right column — Info content */}
      <motion.section
        layout
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full min-w-0 flex-1 overflow-y-auto"
      >
        <TopMetaBar
          dateRange={dateRange}
          onDateRange={setDateRange}
          onAsk={() => setAskMode(true)}
        />

        <div className="mx-auto max-w-[1320px] px-10 pb-24 pt-10">
          <Hero onAsk={() => setAskMode(true)} />

          {/* Needs your attention */}
          <section className="mt-14">
            <SectionLabel>Needs you today</SectionLabel>
            <div className="mt-3 overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER, background: SURFACE }}>
              {attentionItems.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-serif text-[22px] italic text-[#1A1612]">Nothing needs you right now. Go build.</p>
                </div>
              ) : (
                attentionItems.map((item, i) => (
                  <AttentionRow key={item.id} item={item} divider={i !== 0} />
                ))
              )}
            </div>
          </section>

          {/* Key stats */}
          <section className="mt-12">
            <SectionLabel>Pulse</SectionLabel>
            <div className="mt-3 grid grid-cols-5 gap-0 overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER, background: SURFACE }}>
              <StatTile id="active" label="Active projects" value={orgStats.activeProjects.value} change={orgStats.activeProjects.change} trend={orgStats.activeProjects.trend} sparkline={orgStats.activeProjects.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} />
              <StatTile id="velocity" label="Shipping velocity" value={orgStats.shippingVelocity.value} change={orgStats.shippingVelocity.change} trend={orgStats.shippingVelocity.trend} sparkline={orgStats.shippingVelocity.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} />
              <StatTile id="cycle" label="Avg cycle time" value={orgStats.avgCycleTime.value} change={orgStats.avgCycleTime.change} trend={orgStats.avgCycleTime.trend} sparkline={orgStats.avgCycleTime.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} invertTrend />
              <StatTile id="blockers" label="Blockers open" value={orgStats.blockersOpen.value} change={orgStats.blockersOpen.change} trend={orgStats.blockersOpen.trend} sparkline={orgStats.blockersOpen.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} invertTrend />
              <StatTile id="capacity" label="Team capacity" value={orgStats.teamCapacity.value} change={orgStats.teamCapacity.change} trend={orgStats.teamCapacity.trend} sparkline={orgStats.teamCapacity.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} last />
            </div>
          </section>

          {/* My subscriptions (moved from Dashboard) */}
          <MySubscriptions onPick={(p) => setSelectedProject(p)} />

          {/* Week calendar (moved from Dashboard) */}
          <WeekCalendar />

          {/* Recent changes (moved from Dashboard, scoped wider than ship log) */}
          <RecentChanges />

          {/* People + Projects */}
          <section className="mt-12 grid gap-8" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
            {/* People column */}
            <div>
              <div className="flex items-center justify-between">
                <SectionLabel count={`${people.length} people`}>Team</SectionLabel>
                <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#78716C]">{filteredPeople.length} shown</div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-3" style={{ borderColor: BORDER }}>
                {TEAM_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTeamTab(tab)}
                    className="font-sans text-[12.5px] transition-colors"
                    style={{
                      color: teamTab === tab ? INK : MUTED,
                      borderBottom: teamTab === tab ? `1.5px solid ${RUST}` : "1.5px solid transparent",
                      paddingBottom: 4
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["overloaded", "Overloaded"],
                    ["available", "Available"],
                    ["on-leave", "On leave"],
                    ["new", "New (<30d)"]
                  ] as [WorkloadFilter, string][]
                ).map(([key, label]) => {
                  const active = workloadFilter === key;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setWorkloadFilter(active ? null : key)}
                      className="rounded-[4px] border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] transition-colors"
                      style={{
                        background: active ? RUST_TINT : "transparent",
                        color: active ? RUST : MUTED,
                        borderColor: active ? "rgba(184,84,61,0.4)" : BORDER
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {filteredPeople.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={p}
                    onClick={() => setSelectedPerson(p)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, person: p });
                    }}
                    onAsk={() => {
                      setAskMode(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Projects column */}
            <div>
              <div className="flex items-center justify-between">
                <SectionLabel count={`${projects.length} active`}>Projects</SectionLabel>
                <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">
                  Sort:
                  {(["health", "deadline", "team"] as ProjectSort[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setProjectSort(s)}
                      style={{ color: projectSort === s ? INK : MUTED }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {sortedProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                ))}
              </div>
            </div>
          </section>

          {/* Blockers stream */}
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <SectionLabel count={blockers.length}>Open blockers</SectionLabel>
              <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">oldest first</span>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
              {sortedBlockers.map((b) => (
                <BlockerCard key={b.id} blocker={b} />
              ))}
            </div>
          </section>

          {/* Shipping log */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between">
              <SectionLabel>What shipped this week</SectionLabel>
              <div className="flex items-center gap-4 font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">
                <div className="flex items-center gap-2">
                  <span>team:</span>
                  {(["All", "Engineering", "Design", "Product", "GTM", "Ops"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setShipFilterTeam(t)} style={{ color: shipFilterTeam === t ? INK : MUTED }}>
                      {t.toLowerCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span>type:</span>
                  {(["All", "feature", "fix", "refactor", "docs", "decision"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setShipFilterType(t)} style={{ color: shipFilterType === t ? INK : MUTED }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER, background: SURFACE }}>
              {filteredShipLog.map((s, i) => (
                <ShipRow key={s.id} entry={s} divider={i !== 0} />
              ))}
              {filteredShipLog.length === 0 ? (
                <div className="px-5 py-6 font-sans text-[13px] text-[#78716C]">No shipments match this filter.</div>
              ) : null}
            </div>
          </section>

          {/* Hiring & capacity (collapsed) */}
          <section className="mt-12">
            <button
              type="button"
              onClick={() => setHiringExpanded((v) => !v)}
              className="flex w-full items-center justify-between border-b py-2 text-left"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <SectionLabel count={`${openRoles.length} open roles`}>Hiring & capacity</SectionLabel>
              </div>
              <span className="flex items-center gap-1 font-mono text-[10.5px] text-[#78716C]">
                {hiringExpanded ? "collapse" : "expand"}
                {hiringExpanded ? <TbChevronDown size={13} /> : <TbChevronRight size={13} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {hiringExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)" }}>
                    <div className="overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER, background: SURFACE }}>
                      {openRoles.map((r, i) => (
                        <RoleRow key={r.id} role={r} divider={i !== 0} />
                      ))}
                    </div>
                    <div className="rounded-[4px] border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
                      <p className="font-mono text-[10px] tracking-[0.18em] text-[#78716C]">AI · CAPACITY GAPS</p>
                      <p className="mt-3 font-sans text-[13.5px] leading-[1.55] text-[#1A1612]">
                        Backend team has been at <span className="font-mono">110%</span> capacity for 3 weeks. Suggested hire:
                        <span className="font-medium"> Senior Backend Engineer</span>.
                      </p>
                      <p className="mt-3 font-sans text-[13.5px] leading-[1.55] text-[#1A1612]">
                        Design has slack: <span className="font-mono">52%</span> avg on mobile. Consider sliding{" "}
                        <span className="font-medium">Anika</span> to onboarding revamp.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          {/* Footer pulse */}
          <section className="mt-14 border-t pt-6" style={{ borderColor: BORDER }}>
            <SectionLabel>Org pulse</SectionLabel>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-10 gap-y-3 font-mono text-[12px] text-[#1A1612]">
              <span>
                <span className="text-[#78716C]">eNPS</span> <span className="ml-1">{orgPulse.enps}</span>
              </span>
              <span>
                <span className="text-[#78716C]">retention 30d</span> <span className="ml-1">{orgPulse.retention30}</span>
              </span>
              <span>
                <span className="text-[#78716C]">retention 60d</span> <span className="ml-1">{orgPulse.retention60}</span>
              </span>
              <span>
                <span className="text-[#78716C]">retention 90d</span> <span className="ml-1">{orgPulse.retention90}</span>
              </span>
              <span>
                <span className="text-[#78716C]">active projects</span> <span className="ml-1">{orgPulse.activeProjects}</span>
              </span>
              <span>
                <span className="text-[#78716C]">12w shipments</span> <span className="ml-1">{orgPulse.shipping12wk}</span>
              </span>
              <span>
                <span className="text-[#78716C]">headcount</span> <span className="ml-1">{orgPulse.headcount}</span>
              </span>
            </div>
            <p className="mt-5 font-mono text-[10px] tracking-[0.18em] text-[#78716C]">
              ↳ press <span style={{ color: INK }}>⌘K</span> to ask socrates · press <span style={{ color: INK }}>A</span> to assign · right-click any person for actions
            </p>
          </section>
        </div>
      </motion.section>

      {/* Person drawer */}
      <AnimatePresence>
        {selectedPerson ? (
          <PersonDrawer person={selectedPerson} onClose={() => setSelectedPerson(null)} />
        ) : null}
      </AnimatePresence>

      {/* Project drawer */}
      <AnimatePresence>
        {selectedProject ? (
          <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
        ) : null}
      </AnimatePresence>

      {/* Quick-assign modal */}
      <AnimatePresence>
        {assignModalOpen ? <AssignModal onClose={() => setAssignModalOpen(false)} /> : null}
      </AnimatePresence>

      {/* Context menu */}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          person={contextMenu.person}
          onAction={(a) => {
            setContextMenu(null);
            if (a === "view") setSelectedPerson(contextMenu.person);
            if (a === "ask") setAskMode(true);
            if (a === "assign") setAssignModalOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Top bar + hero
// ────────────────────────────────────────────────────────────────────────────

function TopMetaBar({
  dateRange,
  onDateRange,
  onAsk
}: {
  dateRange: "Today" | "This week" | "This month";
  onDateRange: (v: "Today" | "This week" | "This month") => void;
  onAsk: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-10" style={{ background: CREAM, borderColor: BORDER }}>
      <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-[#78716C]">
        <span>Northstar Cloud</span>
        <TbChevronRight size={11} />
        <span style={{ color: INK }}>Info</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAsk}
          className="flex items-center gap-2 rounded-[4px] border bg-white px-3 py-1.5"
          style={{ borderColor: BORDER }}
        >
          <TbSearch size={13} color={MUTED} />
          <span className="font-sans text-[12.5px] text-[#78716C]">Search the org…</span>
          <span className="ml-3 inline-flex items-center gap-0.5 rounded-[3px] border px-1.5 py-[1px] font-mono text-[9.5px] text-[#78716C]" style={{ borderColor: BORDER }}>
            <TbCommand size={9} /> K
          </span>
        </button>

        <div className="flex overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER, background: "white" }}>
          {(["Today", "This week", "This month"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDateRange(d)}
              className="px-2.5 py-1.5 font-sans text-[11.5px]"
              style={{
                background: dateRange === d ? RUST_TINT : "white",
                color: dateRange === d ? RUST : MUTED
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-[4px] border" style={{ borderColor: BORDER, background: "white" }} title="Export">
          <TbDownload size={14} color={MUTED} />
        </button>

        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#E8DCC4" }} title="Sarah Chen">
          <span className="font-sans text-[11px] text-[#1A1612]">SC</span>
        </div>
      </div>
    </div>
  );
}

function Hero({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="flex items-end justify-between gap-12">
      <div>
        <p className="font-mono text-[10.5px] tracking-[0.22em] text-[#78716C]">OPERATOR VIEW</p>
        <h1 className="mt-3 font-serif text-[52px] leading-[1.04] tracking-[-0.01em] text-[#1A1612]">
          Northstar Cloud — what's happening
        </h1>
        <p className="mt-4 max-w-[640px] font-sans text-[15.5px] leading-[1.55] text-[#5A5450]">
          Every person, every project, every blocker. Pulled live from your team's editors, agents, and brain.
        </p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-[#78716C]">
          <span className="relative inline-flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#2D4A3E" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#2D4A3E" }} />
          </span>
          streaming · synced 4s ago
        </div>
        <button
          type="button"
          onClick={onAsk}
          className="inline-flex items-center gap-2 rounded-[4px] px-3 py-2 font-sans text-[13px] text-white"
          style={{ background: RUST }}
        >
          <TbSparkles size={14} /> Ask Socrates
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sections
// ────────────────────────────────────────────────────────────────────────────

function AttentionRow({ item, divider }: { item: AttentionItem; divider: boolean }) {
  const color = item.severity === "red" ? "#9E3B2E" : "#C28840";
  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5"
      style={{ borderTop: divider ? `1px solid ${BORDER}` : "none" }}
    >
      <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
      <p className="flex-1 font-sans text-[13.5px] leading-[1.55] text-[#1A1612]">{item.message}</p>
      <button
        type="button"
        className="rounded-[4px] border px-3 py-1.5 font-sans text-[12px] transition-colors"
        style={{
          color: RUST,
          borderColor: "rgba(184,84,61,0.3)",
          background: "white"
        }}
      >
        {item.action}
      </button>
    </div>
  );
}

function StatTile({
  id,
  label,
  value,
  change,
  trend,
  sparkline,
  hoveredTile,
  onHover,
  last,
  invertTrend
}: {
  id: string;
  label: string;
  value: string | number;
  change: string;
  trend: "↑" | "↓" | "→";
  sparkline: number[];
  hoveredTile: string | null;
  onHover: (id: string | null) => void;
  last?: boolean;
  invertTrend?: boolean;
}) {
  // For invertTrend metrics (cycle, blockers), down = good
  const positive = invertTrend ? trend === "↓" : trend === "↑";
  const trendColor = trend === "→" ? MUTED : positive ? "#2D4A3E" : "#9E3B2E";
  const hovered = hoveredTile === id;
  return (
    <div
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className="relative px-5 py-5 transition-colors"
      style={{
        borderRight: last ? "none" : `1px solid ${BORDER}`,
        background: hovered ? "#FAF8F5" : SURFACE
      }}
    >
      <p className="font-mono text-[10px] tracking-[0.18em] text-[#78716C]" style={{ textTransform: "uppercase" }}>
        {label}
      </p>
      <p className="mt-2 font-serif text-[34px] leading-none text-[#1A1612]">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px]" style={{ color: trendColor }}>
        <span>{trend}</span>
        <span>{change}</span>
      </div>
      <AnimatePresence>
        {hovered ? (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.16 }}
            className="mt-3"
          >
            <Sparkline data={sparkline} stroke={trendColor} width={160} height={32} />
            <p className="mt-1 font-mono text-[9.5px] tracking-[0.12em] text-[#78716C]">last 8 weeks</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const TOOL_LABEL: Record<Person["tool"], string> = {
  vscode: "vscode",
  cursor: "cursor",
  claude: "claude",
  figma: "figma",
  notion: "notion",
  linear: "linear"
};

function PersonCard({
  person,
  onClick,
  onContextMenu,
  onAsk
}: {
  person: Person;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onAsk: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative cursor-pointer rounded-[4px] border p-3 transition-colors"
      style={{
        borderColor: hover ? BORDER_HOVER : BORDER,
        background: SURFACE
      }}
    >
      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={person.name} initials={person.initials} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[13px] font-medium text-[#1A1612]">{person.name}</p>
          <p className="truncate font-sans text-[11.5px] text-[#78716C]">{person.role}</p>
        </div>
      </div>
      <p className="mt-2.5 truncate font-mono text-[10.5px] text-[#5A5450]" title={person.currentFocus}>
        {person.currentFocus}
      </p>
      <div className="mt-2.5">
        <WorkloadBar level={person.workload} pct={person.workloadPct} />
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] tracking-[0.04em] text-[#78716C]">
          <span>{TOOL_LABEL[person.tool]}</span>
          <span>{person.lastActive}</span>
        </div>
      </div>

      <AnimatePresence>
        {hover ? (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-x-0 -bottom-[1px] flex divide-x rounded-b-[4px] border-x border-b bg-white"
            style={{ borderColor: BORDER_HOVER, ['--tw-divide-x-reverse' as any]: 0, ['--tw-divide-opacity' as any]: 1 }}
          >
            {[
              { label: "Assign", action: (e: React.MouseEvent) => { e.stopPropagation(); } },
              { label: "Message", action: (e: React.MouseEvent) => { e.stopPropagation(); } },
              { label: "Ask", action: (e: React.MouseEvent) => { e.stopPropagation(); onAsk(); } }
            ].map((q, i) => (
              <button
                key={q.label}
                type="button"
                onClick={q.action}
                className="flex-1 py-1.5 font-mono text-[10px] tracking-[0.08em] text-[#78716C] hover:text-[#B8543D]"
                style={{ borderLeft: i === 0 ? "none" : `1px solid ${BORDER}` }}
              >
                {q.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const lead = findPerson(project.teamLead);
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-[4px] border p-4 transition-colors hover:border-[rgba(26,22,18,0.16)]"
      style={{ borderColor: BORDER, background: SURFACE }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[18px] leading-[1.2] text-[#1A1612]">{project.name}</h3>
          <p className="mt-1 line-clamp-1 font-sans text-[12.5px] text-[#78716C]">{project.description}</p>
        </div>
        <HealthPill health={project.health} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-[#78716C]">
        <span>{lead?.name.split(" ")[0] ?? "—"} (lead)</span>
        <span>·</span>
        <span>{project.teamSize} ppl</span>
        <span>·</span>
        <span title={`milestone: ${project.nextMilestone}`}>{project.nextMilestone}</span>
        <span>·</span>
        <span style={{ color: project.daysToDeadline < 0 ? "#9E3B2E" : project.daysToDeadline <= 10 ? "#8C5D1E" : MUTED }}>
          {project.daysToDeadline < 0 ? `${Math.abs(project.daysToDeadline)}d overdue` : `${project.daysToDeadline}d to deadline`}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <VelocityArrow velocity={project.velocity} />
        <p className="font-mono text-[10.5px] text-[#78716C]">
          shipped <span className="text-[#1A1612]">'{project.lastShipped.what}'</span> {project.lastShipped.when}
        </p>
        {project.openBlockers > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[2px] font-mono text-[10px]" style={{ background: "rgba(158,59,46,0.10)", color: "#9E3B2E" }}>
            {project.openBlockers} blocked
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#78716C]">no blockers</span>
        )}
      </div>
    </div>
  );
}

function BlockerCard({ blocker }: { blocker: Blocker }) {
  const who = findPerson(blocker.whoId);
  const critical = blocker.ageHours >= 72;
  return (
    <div
      className="flex w-[300px] flex-shrink-0 flex-col rounded-[4px] border p-3.5"
      style={{
        borderColor: critical ? "rgba(158,59,46,0.3)" : BORDER,
        background: SURFACE,
        scrollSnapAlign: "start"
      }}
    >
      <div className="flex items-center gap-2">
        {who ? <InitialsAvatar name={who.name} initials={who.initials} size={26} /> : null}
        <div className="min-w-0">
          <p className="truncate font-sans text-[12.5px] font-medium text-[#1A1612]">{who?.name ?? "—"}</p>
          <p className="truncate font-sans text-[10.5px] text-[#78716C]">{who?.role ?? ""}</p>
        </div>
      </div>
      <p className="mt-3 font-sans text-[13px] leading-[1.5] text-[#1A1612]">{blocker.what}</p>
      <p className="mt-2 font-mono text-[10.5px] text-[#78716C]">
        waiting on <span style={{ color: INK }}>{blocker.waitingOn}</span>
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-mono text-[10.5px]" style={{ color: critical ? "#9E3B2E" : MUTED }}>
          blocked {HumanAge(blocker.ageHours)} ago
        </p>
        <div className="flex gap-1.5">
          {["Unblock", "Reassign"].map((a, i) => (
            <button
              key={a}
              type="button"
              className="rounded-[3px] border px-2 py-[3px] font-sans text-[10.5px]"
              style={{
                borderColor: i === 0 ? "rgba(184,84,61,0.3)" : BORDER,
                color: i === 0 ? RUST : MUTED,
                background: "white"
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const SHIP_TYPE_ICON: Record<ShipEntry["type"], string> = {
  feature: "✦",
  fix: "✕",
  refactor: "↻",
  docs: "¶",
  decision: "◆"
};
const SHIP_TYPE_COLOR: Record<ShipEntry["type"], string> = {
  feature: "#2D4A3E",
  fix: "#9E3B2E",
  refactor: "#8C5D1E",
  docs: "#5A5450",
  decision: "#8B7FD4"
};

function ShipRow({ entry, divider }: { entry: ShipEntry; divider: boolean }) {
  const who = findPerson(entry.byId);
  const proj = findProject(entry.projectId);
  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5"
      style={{ borderTop: divider ? `1px solid ${BORDER}` : "none" }}
    >
      {who ? <InitialsAvatar name={who.name} initials={who.initials} size={24} /> : null}
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-[3px] font-mono text-[11px]"
        style={{ background: "rgba(26,22,18,0.04)", color: SHIP_TYPE_COLOR[entry.type] }}
        title={entry.type}
      >
        {SHIP_TYPE_ICON[entry.type]}
      </span>
      <p className="flex-1 font-sans text-[13px] text-[#1A1612]">{entry.what}</p>
      <p className="font-mono text-[10.5px] text-[#78716C]">{proj?.name ?? entry.projectId}</p>
      <p className="w-[60px] text-right font-mono text-[10.5px] text-[#78716C]">{entry.when}</p>
    </div>
  );
}

function RoleRow({ role, divider }: { role: OpenRole; divider: boolean }) {
  const stageColor =
    role.stage === "offer" ? "#2D4A3E" : role.stage === "interview" ? "#8C5D1E" : "#5A5450";
  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={{ borderTop: divider ? `1px solid ${BORDER}` : "none" }}
    >
      <div className="flex-1">
        <p className="font-sans text-[13.5px] text-[#1A1612]">{role.title}</p>
        <p className="font-mono text-[10.5px] text-[#78716C]">{role.team}</p>
      </div>
      <div className="w-[140px] font-mono text-[11px]" style={{ color: stageColor }}>
        {role.stage}
      </div>
      <div className="w-[110px] font-mono text-[10.5px] text-[#78716C]">{role.candidates} candidates</div>
      <div className="w-[80px] text-right font-mono text-[10.5px] text-[#78716C]">{role.openedDays}d open</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Drawers
// ────────────────────────────────────────────────────────────────────────────

function DrawerBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-40"
      style={{ background: "rgba(26,22,18,0.18)" }}
    />
  );
}

function PersonDrawer({ person, onClose }: { person: Person; onClose: () => void }) {
  return (
    <>
      <DrawerBackdrop onClose={onClose} />
      <motion.aside
        initial={{ x: 480, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 480, opacity: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col"
        style={{ background: SURFACE, borderLeft: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#78716C]">PERSON</p>
          <button onClick={onClose} type="button" className="flex h-7 w-7 items-center justify-center rounded-[4px] hover:bg-[#FAF8F5]">
            <TbX size={14} color={MUTED} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-start gap-4">
            <InitialsAvatar name={person.name} initials={person.initials} size={56} />
            <div>
              <h2 className="font-serif text-[26px] leading-tight text-[#1A1612]">{person.name}</h2>
              <p className="mt-0.5 font-sans text-[13px] text-[#78716C]">{person.role}</p>
              <p className="mt-1 font-mono text-[10.5px] text-[#78716C]">
                {person.team} · reports to {person.manager} · joined {person.joined}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Current focus</SectionLabel>
            <p className="mt-2 font-mono text-[12px] text-[#1A1612]">{person.currentFocus}</p>
          </div>

          <div className="mt-6">
            <SectionLabel>Workload (8 wk)</SectionLabel>
            <div className="mt-2 flex items-center gap-4">
              <Sparkline data={person.workloadTrend} width={220} height={36} stroke={WORKLOAD_COLORS[person.workload]} />
              <div>
                <p className="font-mono text-[20px] text-[#1A1612]">{person.workloadPct}%</p>
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#78716C]" style={{ textTransform: "uppercase" }}>
                  {person.workload}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel count={person.activeTasks.length}>Active tasks</SectionLabel>
            <div className="mt-2 overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER }}>
              {person.activeTasks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    style={{
                      background:
                        t.status === "done" ? "rgba(45,74,62,0.10)" : t.status === "blocked" ? "rgba(158,59,46,0.10)" : t.status === "review" ? "rgba(194,136,64,0.12)" : "rgba(184,84,61,0.10)"
                    }}
                  >
                    <TbCircleFilled size={6} color={t.status === "done" ? "#2D4A3E" : t.status === "blocked" ? "#9E3B2E" : t.status === "review" ? "#C28840" : RUST} />
                  </span>
                  <p className="flex-1 font-sans text-[12.5px] text-[#1A1612]">{t.title}</p>
                  <p className="font-mono text-[10px] text-[#78716C]">{t.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Shipped — last 7 days</SectionLabel>
            <div className="mt-2 flex flex-col gap-1.5">
              {person.shippedLast7d.map((s, i) => (
                <p key={i} className="font-sans text-[12.5px] text-[#1A1612]">
                  {s.what} <span className="font-mono text-[10.5px] text-[#78716C]">· {s.project} · {s.when}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Skills & ownership</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {person.skills.concat(person.ownership).map((k, i) => (
                <span key={`${k}-${i}`} className="rounded-[3px] border px-2 py-[2px] font-mono text-[10px] text-[#5A5450]" style={{ borderColor: BORDER }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-4" style={{ borderColor: BORDER }}>
          <button type="button" className="rounded-[4px] py-2 font-sans text-[12.5px] text-white" style={{ background: RUST }}>
            Assign new task
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Send update
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Reassign work
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Schedule 1:1
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function ProjectDrawer({ project, onClose }: { project: Project; onClose: () => void }) {
  const lead = findPerson(project.teamLead);
  const projectPeople = people.filter((p) => p.projects.includes(project.id));
  return (
    <>
      <DrawerBackdrop onClose={onClose} />
      <motion.aside
        initial={{ x: -600, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -600, opacity: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-0 z-50 flex h-full w-[600px] flex-col"
        style={{ background: SURFACE, borderRight: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#78716C]">PROJECT</p>
          <button onClick={onClose} type="button" className="flex h-7 w-7 items-center justify-center rounded-[4px] hover:bg-[#FAF8F5]">
            <TbX size={14} color={MUTED} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-[32px] leading-tight text-[#1A1612]">{project.name}</h2>
              <p className="mt-1 font-sans text-[13.5px] text-[#5A5450]">{project.description}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-[#78716C]">
                <span>{project.team}</span>
                <span>·</span>
                <span>lead {lead?.name ?? "—"}</span>
                <span>·</span>
                <span>{project.teamSize} people</span>
              </div>
            </div>
            <HealthPill health={project.health} />
          </div>

          {project.activeBlockers.length > 0 ? (
            <div className="mt-5 rounded-[4px] border p-4" style={{ borderColor: "rgba(158,59,46,0.25)", background: "rgba(158,59,46,0.04)" }}>
              <SectionLabel count={project.activeBlockers.length}>Active blockers</SectionLabel>
              <div className="mt-2 flex flex-col gap-2">
                {project.activeBlockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <TbCircleFilled size={6} color="#9E3B2E" style={{ marginTop: 8 }} />
                    <div>
                      <p className="font-sans text-[12.5px] text-[#1A1612]">{b.what}</p>
                      <p className="font-mono text-[10.5px] text-[#78716C]">— {b.who}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <SectionLabel>Milestones</SectionLabel>
            <div className="mt-3 flex">
              {project.milestones.map((m, i) => (
                <div key={m.name} className="relative flex-1">
                  <div className="flex items-center">
                    <span
                      className="inline-flex h-3 w-3 items-center justify-center rounded-full"
                      style={{
                        background:
                          m.state === "done" ? "#2D4A3E" : m.state === "current" ? RUST : "rgba(26,22,18,0.12)"
                      }}
                    />
                    {i < project.milestones.length - 1 ? (
                      <div
                        className="h-[1.5px] flex-1"
                        style={{
                          background:
                            m.state === "done" ? "#2D4A3E" : project.milestones[i + 1].state === "current" ? RUST : "rgba(26,22,18,0.12)"
                        }}
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 font-sans text-[11.5px] text-[#1A1612]">{m.name}</p>
                  <p className="font-mono text-[10px] text-[#78716C]">{m.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Shipping log</SectionLabel>
            <div className="mt-2 overflow-hidden rounded-[4px] border" style={{ borderColor: BORDER }}>
              {project.shippingLog.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2" style={{ borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}>
                  <p className="flex-1 font-sans text-[12.5px] text-[#1A1612]">{s.what}</p>
                  <p className="font-mono text-[10.5px] text-[#78716C]">{s.by}</p>
                  <p className="w-[60px] text-right font-mono text-[10.5px] text-[#78716C]">{s.when}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel count={projectPeople.length}>Team on this</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projectPeople.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-[3px] border px-2 py-1" style={{ borderColor: BORDER }}>
                  <InitialsAvatar name={p.name} initials={p.initials} size={18} />
                  <span className="font-sans text-[11.5px] text-[#1A1612]">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {project.linkedDocs.length > 0 ? (
            <div className="mt-6">
              <SectionLabel>Linked docs & decisions</SectionLabel>
              <div className="mt-2 flex flex-col gap-1.5">
                {project.linkedDocs.map((d, i) => (
                  <p key={i} className="font-sans text-[12.5px] text-[#1A1612]">
                    <span className="mr-2 inline-block rounded-[3px] border px-1.5 py-[1px] font-mono text-[9.5px] uppercase text-[#78716C]" style={{ borderColor: BORDER }}>
                      {d.kind}
                    </span>
                    {d.title}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-4" style={{ borderColor: BORDER }}>
          <button type="button" className="rounded-[4px] py-2 font-sans text-[12.5px] text-white" style={{ background: RUST }}>
            Update status
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Reassign team
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Mark blocked
          </button>
          <button type="button" className="rounded-[4px] border py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Add milestone
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Socrates ask panel (local, no global context dep)
// ────────────────────────────────────────────────────────────────────────────

const SOCRATES_SUGGESTIONS = [
  "Who's overloaded?",
  "What's at risk this week?",
  "Where are the biggest blockers?",
  "Who hasn't shipped in 2 weeks?",
  "Suggest reassignments to balance load"
];

function SocratesAskPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback((value: string) => {
    const text = value.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      {
        role: "assistant",
        content: text.toLowerCase().includes("overload")
          ? "**Mannan Arora** is at 124% (auth flow), **Hiroshi Tanaka** at 95% (infra/EU), **Ishaan Verma** at 98% (search). Mannan is the only one trending up over 4 weeks — consider lifting cookie rotation off his plate."
          : text.toLowerCase().includes("risk")
          ? "Three things are at risk this week:\n- **Onboarding A/B launch** (7 days, 2 blockers)\n- **Northstar EU GA** (14 days, 3 blockers, velocity flat)\n- **Analytics pipeline** is already 3 days past its schema-registry milestone."
          : text.toLowerCase().includes("block")
          ? "Oldest blockers carry the most cost.\n- **Yuki Sato** — backfill OOM (4d), waiting on data infra.\n- **Mannan Arora** — cookie rotation security review (3d 9h).\nFour more are <72h."
          : "Pulled from your team's editors, agents, and brain. Ask anything about people, projects, or blockers."
      }
    ]);
    setInput("");
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-[#78716C]">SOCRATES</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#2D4A3E" }} />
            <p className="font-mono text-[11px] text-[#78716C]">online · Ready</p>
          </div>
        </div>
        <button onClick={onClose} type="button" className="flex h-7 w-7 items-center justify-center rounded-[4px] hover:bg-[#FAF8F5]" title="Close (Esc / ⌘K)">
          <TbX size={14} color={MUTED} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div>
            <p className="font-serif text-[20px] leading-[1.3] text-[#1A1612]">What do you want to know?</p>
            <p className="mt-2 font-sans text-[12.5px] text-[#78716C]">
              Suggested prompts — or type your own.
            </p>
            <div className="mt-4 flex flex-col gap-1.5">
              {SOCRATES_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="text-left rounded-[4px] border px-3 py-2 font-sans text-[12.5px] text-[#1A1612] hover:bg-[#FAF8F5]"
                  style={{ borderColor: BORDER }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="self-end max-w-[88%] rounded-[10px] rounded-br-[3px] border px-3 py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER, background: "white" }}>
                  {m.content}
                </div>
              ) : (
                <div key={i} className="max-w-[100%] rounded-[10px] rounded-bl-[3px] px-3 py-2 font-sans text-[12.5px] leading-[1.55] text-[#1A1612] whitespace-pre-wrap" style={{ background: "#FAF8F5", border: `1px solid ${BORDER}` }}>
                  {m.content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={j} className="font-medium">{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: BORDER }}>
        <div className="flex items-end gap-2 rounded-[6px] border px-2 py-1.5" style={{ borderColor: BORDER, background: "white" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            rows={1}
            placeholder="Ask about your org…"
            className="flex-1 resize-none bg-transparent px-1 py-1 font-sans text-[12.5px] text-[#1A1612] outline-none"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[4px]"
            style={{ background: RUST }}
          >
            <TbSend size={13} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Assign modal + context menu
// ────────────────────────────────────────────────────────────────────────────

function AssignModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(26,22,18,0.18)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="fixed left-1/2 top-[18%] z-[70] w-[520px] -translate-x-1/2 rounded-[4px] border bg-white p-5"
        style={{ borderColor: BORDER }}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#78716C]">QUICK ASSIGN</p>
          <button onClick={onClose} type="button" className="font-mono text-[10px] text-[#78716C]">esc</button>
        </div>
        <p className="mt-2 font-serif text-[20px] text-[#1A1612]">Assign a task</p>
        <div className="mt-4 flex flex-col gap-2">
          <input
            placeholder="Task title…"
            className="rounded-[4px] border px-3 py-2 font-sans text-[13px] outline-none"
            style={{ borderColor: BORDER }}
            autoFocus
          />
          <select className="rounded-[4px] border bg-white px-3 py-2 font-sans text-[13px]" style={{ borderColor: BORDER }} defaultValue="">
            <option value="" disabled>Assign to…</option>
            {people.slice(0, 12).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
            ))}
          </select>
          <select className="rounded-[4px] border bg-white px-3 py-2 font-sans text-[13px]" style={{ borderColor: BORDER }} defaultValue="">
            <option value="" disabled>Project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[4px] border px-3 py-2 font-sans text-[12.5px] text-[#1A1612]" style={{ borderColor: BORDER }}>
            Cancel
          </button>
          <button type="button" onClick={onClose} className="rounded-[4px] px-3 py-2 font-sans text-[12.5px] text-white" style={{ background: RUST }}>
            Assign
          </button>
        </div>
      </motion.div>
    </>
  );
}

function ContextMenu({
  x,
  y,
  person,
  onAction
}: {
  x: number;
  y: number;
  person: Person;
  onAction: (a: "view" | "assign" | "ask" | "message" | "escalate") => void;
}) {
  const items: { key: "view" | "assign" | "ask" | "message" | "escalate"; label: string }[] = [
    { key: "view", label: "View profile" },
    { key: "assign", label: "Assign task" },
    { key: "message", label: "Message" },
    { key: "ask", label: "Ask Socrates about them" },
    { key: "escalate", label: "Escalate" }
  ];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[80] w-[220px] rounded-[4px] border bg-white py-1 shadow-sm"
      style={{ left: x, top: y, borderColor: BORDER, boxShadow: "0 6px 20px rgba(26,22,18,0.08)" }}
    >
      <p className="px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#78716C]" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {person.name}
      </p>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onAction(it.key)}
          type="button"
          className="flex w-full items-center px-3 py-1.5 text-left font-sans text-[12.5px] text-[#1A1612] hover:bg-[#FAF8F5]"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
