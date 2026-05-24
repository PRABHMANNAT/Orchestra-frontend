import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  TbActivity,
  TbArrowDown,
  TbArrowRight,
  TbArrowUp,
  TbCalendarEvent,
  TbChevronDown,
  TbChevronRight,
  TbCircleFilled,
  TbCommand,
  TbDownload,
  TbMessage2,
  TbReportMoney,
  TbSearch,
  TbSend,
  TbSparkles,
  TbTimelineEvent,
  TbTool,
  TbUser,
  TbUsers,
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

type CalEvent = {
  date: string; // YYYY-MM-DD
  time: string;
  duration: string;
  title: string;
  team: string;
  attendees: string[];
  room: string;
  unassigned?: boolean;
};

function isoKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Build events anchored to this month so the calendar always feels live.
function buildMonthEvents(): CalEvent[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const dayKey = (offset: number) => isoKey(new Date(y, m, today.getDate() + offset));

  return [
    // Today
    { date: dayKey(0), time: "09:30", duration: "30m", title: "Northstar standup", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka", "Aanya Iyer"], room: "Atrium" },
    { date: dayKey(0), time: "11:00", duration: "60m", title: "1:1 · Adhiraj", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh"], room: "huddle 3" },
    { date: dayKey(0), time: "14:00", duration: "90m", title: "Aurora migration review", team: "Platform", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka", "Mei Chen"], room: "Cedar" },
    { date: dayKey(0), time: "16:30", duration: "30m", title: "Customer call · Apollo", team: "GTM", attendees: ["Marcus Thompson", "Lisa Foster"], room: "huddle 1", unassigned: true },

    // +1d
    { date: dayKey(1), time: "10:00", duration: "60m", title: "Design review · onboarding v3", team: "Design", attendees: ["Sarah Chen", "Aanya Iyer", "Marcus Thompson", "Mannan Verma"], room: "Pine" },
    { date: dayKey(1), time: "13:00", duration: "120m", title: "Acme QBR", team: "Customer", attendees: ["Marcus Thompson", "Mei Chen", "Lisa Foster"], room: "Cedar", unassigned: true },
    { date: dayKey(1), time: "16:00", duration: "45m", title: "Sprint planning", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka", "Aanya Iyer", "Prabh Mannat"], room: "Atrium" },

    // +2d
    { date: dayKey(2), time: "09:00", duration: "30m", title: "Standup", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka", "Aanya Iyer"], room: "Atrium" },
    { date: dayKey(2), time: "11:00", duration: "90m", title: "Pricing committee", team: "GTM", attendees: ["Marcus Thompson", "Lisa Foster", "Hiroshi Tanaka", "Priya Sharma"], room: "Boardroom" },
    { date: dayKey(2), time: "15:00", duration: "60m", title: "Security review", team: "Engineering", attendees: ["Hiroshi Tanaka", "Priya Sharma", "Adhiraj Singh"], room: "Pine", unassigned: true },

    // +3d
    { date: dayKey(3), time: "09:30", duration: "30m", title: "Stand-up", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka"], room: "Atrium" },
    { date: dayKey(3), time: "11:00", duration: "60m", title: "RFC walk · edge cache", team: "Engineering", attendees: ["Adhiraj Singh", "Hiroshi Tanaka", "Kartikeya Rao", "Aanya Iyer", "Prabh Mannat"], room: "Cedar" },
    { date: dayKey(3), time: "14:00", duration: "60m", title: "Hiring loop debrief", team: "Ops", attendees: ["Prabh Mannat", "Marcus Thompson", "Kartikeya Rao", "Sarah Chen"], room: "Pine" },

    // +4d
    { date: dayKey(4), time: "10:00", duration: "60m", title: "All-hands prep", team: "All", attendees: ["Marcus Thompson", "Sarah Chen", "Kartikeya Rao", "Lisa Foster", "Priya Sharma", "Hiroshi Tanaka", "Mannan Verma", "Adhiraj Singh"], room: "Atrium", unassigned: true },
    { date: dayKey(4), time: "13:00", duration: "60m", title: "Apollo data residency", team: "Platform", attendees: ["Hiroshi Tanaka", "Mei Chen", "Adhiraj Singh"], room: "huddle 3" },
    { date: dayKey(4), time: "15:30", duration: "60m", title: "Investor update review", team: "GTM", attendees: ["Marcus Thompson", "Lisa Foster", "Kartikeya Rao", "Hiroshi Tanaka"], room: "Boardroom" },

    // Past + future filler so the month feels populated
    { date: dayKey(-1), time: "09:30", duration: "30m", title: "Standup", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh"], room: "Atrium" },
    { date: dayKey(-1), time: "14:00", duration: "60m", title: "Customer feedback synthesis", team: "Product", attendees: ["Marcus Thompson", "Mei Chen"], room: "huddle 3" },
    { date: dayKey(-2), time: "11:00", duration: "60m", title: "Brain retro", team: "Engineering", attendees: ["Kartikeya Rao", "Adhiraj Singh", "Aanya Iyer"], room: "Cedar" },
    { date: dayKey(-3), time: "13:00", duration: "120m", title: "Q2 planning", team: "All", attendees: ["Marcus Thompson", "Kartikeya Rao", "Sarah Chen", "Lisa Foster", "Priya Sharma"], room: "Boardroom" },
    { date: dayKey(-5), time: "10:00", duration: "60m", title: "Onboarding shadow · Yuki", team: "Ops", attendees: ["Mannan Verma", "Yuki Sato"], room: "huddle 1" },

    { date: dayKey(7), time: "10:00", duration: "60m", title: "Northstar architecture review", team: "Engineering", attendees: ["Kartikeya Rao", "Hiroshi Tanaka", "Adhiraj Singh"], room: "Cedar" },
    { date: dayKey(7), time: "14:00", duration: "90m", title: "Pricing rollout sync", team: "GTM", attendees: ["Marcus Thompson", "Lisa Foster"], room: "Boardroom" },
    { date: dayKey(9), time: "11:00", duration: "60m", title: "Design system audit", team: "Design", attendees: ["Sarah Chen", "Aanya Iyer", "Ji-woo Park"], room: "Pine" },
    { date: dayKey(10), time: "13:00", duration: "120m", title: "Apollo expansion kickoff", team: "Product", attendees: ["Marcus Thompson", "Sarah Chen", "Hiroshi Tanaka"], room: "Cedar", unassigned: true },
    { date: dayKey(12), time: "11:00", duration: "30m", title: "1:1 · Sarah", team: "Design", attendees: ["Kartikeya Rao", "Sarah Chen"], room: "huddle 3" },
    { date: dayKey(14), time: "10:00", duration: "60m", title: "All-hands · monthly", team: "All", attendees: ["Marcus Thompson", "Kartikeya Rao", "Sarah Chen", "Lisa Foster", "Priya Sharma", "Hiroshi Tanaka", "Mannan Verma", "Adhiraj Singh"], room: "Atrium" }
  ];
}

const MONTH_EVENTS: CalEvent[] = buildMonthEvents();

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

type CalCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
};

function buildCalendarCells(year: number, month: number): CalCell[] {
  const cells: CalCell[] = [];
  const first = new Date(year, month, 1);
  // Monday-first weekday offset (Mon = 0 … Sun = 6)
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayKey = isoKey(new Date());
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === month,
      isToday: isoKey(d) === todayKey
    });
  }
  return cells;
}

function WeekCalendar() {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<Date>(today);

  const cells = useMemo(() => buildCalendarCells(cursor.y, cursor.m), [cursor]);

  // Count events per date for the calendar dots
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of MONTH_EVENTS) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, []);

  const selectedKey = isoKey(selected);
  const selectedEvents = (eventsByDate.get(selectedKey) ?? []).sort((a, b) => a.time.localeCompare(b.time));

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const goPrev = () => {
    const d = new Date(cursor.y, cursor.m - 1, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const goNext = () => {
    const d = new Date(cursor.y, cursor.m + 1, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const goToday = () => {
    const now = new Date();
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    setSelected(now);
  };

  const totalThisMonth = MONTH_EVENTS.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === cursor.y && d.getMonth() === cursor.m;
  }).length;

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={`${totalThisMonth} this month`}>Calendar</SectionLabel>
        <button
          type="button"
          onClick={goToday}
          className="font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:text-[#1A1612]"
          style={{ color: MUTED }}
        >
          Today
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* LEFT — month grid */}
        <div className="overflow-hidden rounded-[4px] border bg-white" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: BORDER }}>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                month
              </div>
              <div className="font-serif text-[18px] leading-tight" style={{ color: INK }}>
                {monthLabel}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-[3px] border hover:bg-[#FAF8F5]"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                <TbChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-[3px] border hover:bg-[#FAF8F5]"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                <TbChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: BORDER }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center font-mono text-[9px] uppercase tracking-[0.14em]"
                style={{ color: MUTED }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const key = isoKey(cell.date);
              const evs = eventsByDate.get(key) ?? [];
              const isSelected = key === selectedKey;
              const hasUnassigned = evs.some((e) => e.unassigned);
              const dotCount = Math.min(4, evs.length);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(cell.date)}
                  className="relative flex flex-col items-start justify-between border-r border-b px-2 py-2 text-left transition-colors hover:bg-[#FAF8F5]"
                  style={{
                    borderColor: BORDER,
                    height: 64,
                    background: isSelected
                      ? "rgba(184,84,61,0.06)"
                      : cell.isToday
                        ? "rgba(184,84,61,0.03)"
                        : "transparent",
                    opacity: cell.inMonth ? 1 : 0.35
                  }}
                >
                  {isSelected ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 2px ${RUST}` }}
                    />
                  ) : null}
                  <div className="flex w-full items-baseline justify-between">
                    <span
                      className="font-mono text-[12px]"
                      style={{
                        color: cell.isToday ? RUST : INK,
                        fontWeight: cell.isToday ? 600 : 400
                      }}
                    >
                      {cell.date.getDate()}
                    </span>
                    {cell.isToday ? (
                      <span
                        className="rounded-[2px] px-1 font-mono text-[8px] uppercase tracking-[0.12em]"
                        style={{ color: RUST, background: RUST_TINT }}
                      >
                        Now
                      </span>
                    ) : null}
                  </div>
                  {dotCount > 0 ? (
                    <div className="flex items-center gap-[3px]">
                      {Array.from({ length: dotCount }).map((_, j) => (
                        <span
                          key={j}
                          className="inline-block h-[5px] w-[5px] rounded-full"
                          style={{ background: hasUnassigned && j === 0 ? "#C28840" : RUST }}
                        />
                      ))}
                      {evs.length > 4 ? (
                        <span className="font-mono text-[8px]" style={{ color: MUTED }}>
                          +{evs.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — events for selected date */}
        <div className="flex flex-col overflow-hidden rounded-[4px] border bg-white" style={{ borderColor: BORDER }}>
          <div className="border-b px-4 py-3" style={{ borderColor: BORDER }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              {selected.toDateString() === new Date().toDateString() ? "Today" : "Selected"}
            </div>
            <div className="mt-0.5 font-serif text-[20px] leading-tight" style={{ color: INK }}>
              {selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
              {selectedEvents.length === 0
                ? "nothing scheduled"
                : `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"} · ${selectedEvents.filter((e) => e.unassigned).length} unassigned`}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 380 }}>
            {selectedEvents.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 py-10 text-center">
                <div>
                  <div className="font-serif text-[18px] italic" style={{ color: INK }}>
                    Clear day.
                  </div>
                  <div className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
                    no meetings scheduled
                  </div>
                </div>
              </div>
            ) : (
              selectedEvents.map((e, i) => (
                <div
                  key={i}
                  className="grid items-start gap-3 px-4 py-3"
                  style={{
                    gridTemplateColumns: "70px 1fr",
                    borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                    borderLeft: `3px solid ${e.unassigned ? "#C28840" : RUST}`
                  }}
                >
                  <div>
                    <div className="font-mono text-[12px]" style={{ color: INK }}>
                      {e.time}
                    </div>
                    <div className="font-mono text-[9.5px]" style={{ color: MUTED }}>
                      {e.duration}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: INK }}>
                        {e.title}
                      </span>
                      {e.unassigned ? (
                        <span
                          className="rounded-[2px] px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.1em]"
                          style={{ background: "rgba(194,136,64,0.16)", color: "#8C5D1E" }}
                        >
                          unassigned
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
                      {e.team} · {e.room} · {e.attendees.length}p
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {e.attendees.slice(0, 5).map((a) => {
                          const initials = a
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2);
                          return (
                            <InitialsAvatar key={a} name={a} initials={initials} size={20} ring="#FFFFFF" />
                          );
                        })}
                      </div>
                      {e.attendees.length > 5 ? (
                        <span className="font-mono text-[9.5px]" style={{ color: MUTED }}>
                          +{e.attendees.length - 5}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Upcoming meetings ============ */

type UpcomingMeeting = {
  when: string;
  title: string;
  room: string;
  duration: string;
  attendees: string[];
};

const UPCOMING_MEETINGS: UpcomingMeeting[] = [
  {
    when: "Today · 14:00",
    title: "Aurora migration review",
    room: "Cedar",
    duration: "90m",
    attendees: ["Kartikeya Rao", "Adhiraj Singh", "Hiroshi Tanaka", "Mei Chen"]
  },
  {
    when: "Today · 16:00",
    title: "1:1 · Adhiraj",
    room: "huddle 3",
    duration: "30m",
    attendees: ["Kartikeya Rao", "Adhiraj Singh"]
  },
  {
    when: "Tue · 10:00",
    title: "Design review · onboarding v3",
    room: "Pine",
    duration: "60m",
    attendees: ["Sarah Chen", "Aanya Iyer", "Marcus Thompson", "Mannan Verma"]
  },
  {
    when: "Tue · 13:00",
    title: "Acme QBR",
    room: "Cedar",
    duration: "120m",
    attendees: ["Marcus Thompson", "Mei Chen", "Lisa Foster"]
  },
  {
    when: "Wed · 11:00",
    title: "Pricing committee",
    room: "Boardroom",
    duration: "90m",
    attendees: ["Marcus Thompson", "Lisa Foster", "Hiroshi Tanaka", "Priya Sharma"]
  }
];

function UpcomingMeetings() {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={`${UPCOMING_MEETINGS.length} next`}>Upcoming meetings</SectionLabel>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">starts of slots only</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-[4px] border bg-white" style={{ borderColor: BORDER }}>
        {UPCOMING_MEETINGS.map((m, i) => (
          <div
            key={i}
            className="grid items-center gap-4 px-4 py-3"
            style={{
              gridTemplateColumns: "120px 1fr auto",
              borderTop: i === 0 ? "none" : `1px solid ${BORDER}`
            }}
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                {m.when}
              </div>
              <div className="mt-0.5 font-mono text-[10px]" style={{ color: MUTED_2 }}>
                {m.duration} · {m.room}
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium" style={{ color: INK }}>
                {m.title}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {m.attendees.slice(0, 4).map((a) => {
                    const initials = a
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2);
                    return (
                      <InitialsAvatar
                        key={a}
                        name={a}
                        initials={initials}
                        size={20}
                        ring="#FFFFFF"
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {m.attendees.length} attendees
                </span>
              </div>
            </div>
            <button
              type="button"
              className="rounded-[3px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors hover:bg-[#FAF8F5]"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ Alerts ============ */

type AlertSev = "critical" | "warning" | "info";

type SystemAlert = {
  id: string;
  severity: AlertSev;
  title: string;
  detail: string;
  source: string;
  when: string;
};

const SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: "al1",
    severity: "critical",
    title: "AWS bill projected to exceed budget",
    detail: "Current burn $4,200/mo against $3,500 cap. Pivoting to reserved instances would save ~$540.",
    source: "AWS · cost explorer",
    when: "8m ago"
  },
  {
    id: "al2",
    severity: "warning",
    title: "Cursor connector erroring out",
    detail: "Last sync failed 12 hours ago. 34 items not indexed into the brain.",
    source: "Brain · ingestion",
    when: "12h ago"
  },
  {
    id: "al3",
    severity: "warning",
    title: "SOC2 audit window opens Friday",
    detail: "Acme requires the letter by May 30. Owner is Priya — surface in Friday's standup.",
    source: "Compliance",
    when: "2d ago"
  },
  {
    id: "al4",
    severity: "info",
    title: "Two new hires onboarded this week",
    detail: "Yuki Sato (Platform) and Ji-woo Park (Design ops). Welcome packs sent by Onboarder agent.",
    source: "People · HR",
    when: "3d ago"
  }
];

const ALERT_TONES: Record<AlertSev, { fg: string; bg: string; label: string; symbol: string }> = {
  critical: { fg: "#9E3B2E", bg: "rgba(158,59,46,0.12)", label: "Critical", symbol: "!" },
  warning: { fg: "#8C5D1E", bg: "rgba(194,136,64,0.16)", label: "Warning", symbol: "!" },
  info: { fg: "#5A6B47", bg: "rgba(122,140,95,0.14)", label: "Info", symbol: "i" }
};

function AlertsWidget() {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={SYSTEM_ALERTS.length}>Alerts</SectionLabel>
        <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">system + agent</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {SYSTEM_ALERTS.map((a) => {
          const tone = ALERT_TONES[a.severity];
          return (
            <div
              key={a.id}
              className="overflow-hidden rounded-[4px] border bg-white"
              style={{
                borderColor: BORDER,
                borderLeftWidth: 3,
                borderLeftColor: tone.fg
              }}
            >
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {tone.symbol}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: INK }}>
                      {a.title}
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.55]" style={{ color: MUTED }}>
                      {a.detail}
                    </p>
                  </div>
                </div>
                <span
                  className="flex-shrink-0 rounded-[3px] px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.12em]"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  {tone.label}
                </span>
              </div>
              <div
                className="flex items-center justify-between border-t px-4 py-2 font-mono text-[10px]"
                style={{ borderColor: BORDER, color: MUTED_2 }}
              >
                <span>{a.source}</span>
                <span>{a.when}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ Active subscriptions + add + calculate ============ */

type Subscription = {
  id: string;
  name: string;
  vendor: string;
  monthlyPerSeat: number; // USD per seat per month
  seats: number;
  cycle: "monthly" | "yearly";
  renewal: string;
  owner: string;
  category: "dev" | "design" | "comms" | "data" | "ops" | "ai";
};

const INITIAL_SUBS: Subscription[] = [
  { id: "s1", name: "GitHub Enterprise", vendor: "GitHub", monthlyPerSeat: 21, seats: 47, cycle: "yearly", renewal: "2026-09-12", owner: "Kartikeya", category: "dev" },
  { id: "s2", name: "Slack Business+", vendor: "Slack", monthlyPerSeat: 12.5, seats: 52, cycle: "monthly", renewal: "2026-06-01", owner: "Marcus", category: "comms" },
  { id: "s3", name: "Notion Plus", vendor: "Notion", monthlyPerSeat: 10, seats: 47, cycle: "yearly", renewal: "2026-08-14", owner: "Marcus", category: "ops" },
  { id: "s4", name: "Figma Organization", vendor: "Figma", monthlyPerSeat: 45, seats: 8, cycle: "yearly", renewal: "2026-11-03", owner: "Sarah", category: "design" },
  { id: "s5", name: "Linear", vendor: "Linear", monthlyPerSeat: 14, seats: 24, cycle: "monthly", renewal: "2026-06-15", owner: "Adhiraj", category: "ops" },
  { id: "s6", name: "Vercel Pro", vendor: "Vercel", monthlyPerSeat: 20, seats: 6, cycle: "monthly", renewal: "2026-06-22", owner: "Hiroshi", category: "dev" },
  { id: "s7", name: "Sentry Team", vendor: "Sentry", monthlyPerSeat: 26, seats: 10, cycle: "yearly", renewal: "2026-10-04", owner: "Adhiraj", category: "dev" },
  { id: "s8", name: "AWS · production", vendor: "AWS", monthlyPerSeat: 4200, seats: 1, cycle: "monthly", renewal: "rolling", owner: "Hiroshi", category: "data" },
  { id: "s9", name: "OpenAI API", vendor: "OpenAI", monthlyPerSeat: 880, seats: 1, cycle: "monthly", renewal: "rolling", owner: "Mannan", category: "ai" }
];

const CATEGORY_TONES: Record<Subscription["category"], { fg: string; bg: string }> = {
  dev:    { fg: "#3B82C4", bg: "rgba(59,130,196,0.12)" },
  design: { fg: "#B8543D", bg: "rgba(184,84,61,0.10)" },
  comms:  { fg: "#7062B8", bg: "rgba(139,127,212,0.14)" },
  data:   { fg: "#5A6B47", bg: "rgba(122,140,95,0.14)" },
  ops:    { fg: "#5A5450", bg: "rgba(120,113,108,0.10)" },
  ai:     { fg: "#8C5D1E", bg: "rgba(194,136,64,0.14)" }
};

function fmtUSD(n: number): string {
  if (n >= 100000) return "$" + Math.round(n / 1000) + "k";
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

function fmtUSDPrecise(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function ActiveSubscriptions({
  subs,
  setSubs
}: {
  subs: Subscription[];
  setSubs: React.Dispatch<React.SetStateAction<Subscription[]>>;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    vendor: "",
    cost: "",
    seats: "",
    cycle: "monthly" as Subscription["cycle"],
    owner: "",
    category: "dev" as Subscription["category"]
  });

  const totalMonthly = useMemo(() => subs.reduce((sum, s) => sum + s.monthlyPerSeat * s.seats, 0), [subs]);
  const totalYearly = totalMonthly * 12;
  const headcount = 47;
  const perHead = totalMonthly / headcount;

  const byCategory = useMemo(() => {
    const map = new Map<Subscription["category"], number>();
    for (const s of subs) {
      const v = s.monthlyPerSeat * s.seats;
      map.set(s.category, (map.get(s.category) ?? 0) + v);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [subs]);

  // Live calculation while typing
  const previewCost = parseFloat(form.cost || "0") || 0;
  const previewSeats = parseInt(form.seats || "0", 10) || 0;
  const previewMonthly = form.cycle === "monthly" ? previewCost * previewSeats : (previewCost * previewSeats) / 12;
  const previewYearly = previewMonthly * 12;
  const previewPerHead = headcount > 0 ? previewMonthly / headcount : 0;

  function add() {
    if (!form.name || previewCost <= 0 || previewSeats <= 0) return;
    const next: Subscription = {
      id: `s-${Date.now()}`,
      name: form.name,
      vendor: form.vendor || form.name,
      monthlyPerSeat: form.cycle === "monthly" ? previewCost : previewCost / 12,
      seats: previewSeats,
      cycle: form.cycle,
      renewal: form.cycle === "yearly" ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) : "rolling",
      owner: form.owner || "—",
      category: form.category
    };
    setSubs((s) => [...s, next]);
    setForm({ name: "", vendor: "", cost: "", seats: "", cycle: "monthly", owner: "", category: "dev" });
    setAdding(false);
  }

  function remove(id: string) {
    setSubs((s) => s.filter((x) => x.id !== id));
  }

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <SectionLabel count={`${subs.length} active`}>Active subscriptions</SectionLabel>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-[3px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
          style={{
            background: adding ? "transparent" : RUST,
            color: adding ? MUTED : "#FAF8F5",
            border: adding ? `1px solid ${BORDER}` : "1px solid transparent"
          }}
        >
          {adding ? "Cancel" : "+ Add subscription"}
        </button>
      </div>

      {/* Summary band */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile label="Monthly burn" value={fmtUSDPrecise(totalMonthly)} sub={`${subs.length} services`} />
        <SummaryTile label="Yearly projection" value={fmtUSDPrecise(totalYearly)} sub="if held constant" />
        <SummaryTile label="Per headcount" value={fmtUSDPrecise(Math.round(perHead))} sub={`across ${headcount} people · /mo`} />
        <SummaryTile label="Largest category" value={byCategory[0] ? byCategory[0][0] : "—"} sub={byCategory[0] ? fmtUSDPrecise(byCategory[0][1]) + "/mo" : ""} />
      </div>

      {/* Add form (collapsible) */}
      <AnimatePresence initial={false}>
        {adding ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 rounded-[4px] border bg-white p-4"
              style={{ borderColor: BORDER }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Field label="Service">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Datadog"
                    className="w-full bg-transparent text-[13px] focus:outline-none"
                    style={{ color: INK }}
                  />
                </Field>
                <Field label="Cost ($)">
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="per seat"
                    className="w-full bg-transparent text-[13px] focus:outline-none"
                    style={{ color: INK }}
                  />
                </Field>
                <Field label="Seats">
                  <input
                    type="number"
                    value={form.seats}
                    onChange={(e) => setForm({ ...form, seats: e.target.value })}
                    placeholder="0"
                    className="w-full bg-transparent text-[13px] focus:outline-none"
                    style={{ color: INK }}
                  />
                </Field>
                <Field label="Cycle">
                  <div className="flex gap-1">
                    {(["monthly", "yearly"] as Subscription["cycle"][]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, cycle: c })}
                        className="rounded-[3px] border px-2 py-0.5 text-[11px] capitalize transition-colors"
                        style={{
                          background: form.cycle === c ? RUST_TINT : "transparent",
                          color: form.cycle === c ? RUST : MUTED,
                          borderColor: form.cycle === c ? "rgba(184,84,61,0.4)" : BORDER
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Owner">
                  <input
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                    placeholder="—"
                    className="w-full bg-transparent text-[13px] focus:outline-none"
                    style={{ color: INK }}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Subscription["category"] })}
                    className="w-full bg-transparent text-[13px] focus:outline-none"
                    style={{ color: INK }}
                  >
                    {(["dev", "design", "comms", "data", "ops", "ai"] as Subscription["category"][]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Live calculation */}
              <div
                className="mt-4 grid grid-cols-1 gap-3 rounded-[3px] p-3 md:grid-cols-4"
                style={{ background: "#FAF8F5", border: `1px solid ${BORDER}` }}
              >
                <CalcCell label="Monthly impact" value={previewMonthly > 0 ? fmtUSDPrecise(Math.round(previewMonthly)) : "—"} />
                <CalcCell label="Yearly impact" value={previewYearly > 0 ? fmtUSDPrecise(Math.round(previewYearly)) : "—"} />
                <CalcCell label="Per headcount" value={previewPerHead > 0 ? fmtUSDPrecise(Math.round(previewPerHead)) + "/mo" : "—"} />
                <CalcCell
                  label="New monthly burn"
                  value={previewMonthly > 0 ? fmtUSDPrecise(Math.round(totalMonthly + previewMonthly)) : fmtUSDPrecise(totalMonthly)}
                  highlight
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ name: "", vendor: "", cost: "", seats: "", cycle: "monthly", owner: "", category: "dev" })}
                  className="rounded-[3px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-[#FAF8F5]"
                  style={{ borderColor: BORDER, color: MUTED }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={add}
                  disabled={!form.name || previewCost <= 0 || previewSeats <= 0}
                  className="rounded-[3px] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                  style={{
                    background: !form.name || previewCost <= 0 || previewSeats <= 0 ? "rgba(26,22,18,0.18)" : RUST,
                    color: "#FAF8F5",
                    cursor: !form.name || previewCost <= 0 || previewSeats <= 0 ? "not-allowed" : "pointer"
                  }}
                >
                  Add to burn
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Subscriptions table */}
      <div className="mt-3 overflow-hidden rounded-[4px] border bg-white" style={{ borderColor: BORDER }}>
        <div
          className="grid items-center gap-3 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{
            background: "#FAF8F5",
            color: MUTED,
            gridTemplateColumns: "1.6fr 0.7fr 0.6fr 0.7fr 0.9fr 0.9fr 32px"
          }}
        >
          <div>Service</div>
          <div>Category</div>
          <div className="text-right">Seats</div>
          <div className="text-right">$/seat</div>
          <div className="text-right">Monthly</div>
          <div>Owner · renewal</div>
          <div />
        </div>
        {subs.map((s, i) => {
          const tone = CATEGORY_TONES[s.category];
          const monthly = s.monthlyPerSeat * s.seats;
          return (
            <div
              key={s.id}
              className="grid items-center gap-3 px-4 py-2.5"
              style={{
                gridTemplateColumns: "1.6fr 0.7fr 0.6fr 0.7fr 0.9fr 0.9fr 32px",
                borderTop: i === 0 ? "none" : `1px solid ${BORDER}`
              }}
            >
              <div>
                <div className="text-[12.5px]" style={{ color: INK }}>
                  {s.name}
                </div>
                <div className="font-mono text-[10px]" style={{ color: MUTED_2 }}>
                  {s.vendor}
                </div>
              </div>
              <span
                className="inline-flex items-center justify-center rounded-[3px] px-1.5 py-[2px] font-mono text-[9.5px] uppercase tracking-[0.12em]"
                style={{ background: tone.bg, color: tone.fg, width: "fit-content" }}
              >
                {s.category}
              </span>
              <div className="text-right font-mono text-[12px]" style={{ color: INK }}>
                {s.seats}
              </div>
              <div className="text-right font-mono text-[12px]" style={{ color: MUTED }}>
                {fmtUSDPrecise(Math.round(s.monthlyPerSeat))}
              </div>
              <div className="text-right font-mono text-[12.5px]" style={{ color: INK }}>
                {fmtUSDPrecise(Math.round(monthly))}
              </div>
              <div className="font-mono text-[10.5px]" style={{ color: MUTED }}>
                {s.owner} · {s.renewal}
              </div>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label="Remove"
                className="flex h-6 w-6 items-center justify-center rounded-[3px] text-[#8A7E6F] hover:bg-[#FAF8F5] hover:text-[#9E3B2E]"
              >
                <TbX size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[4px] border bg-white px-4 py-3" style={{ borderColor: BORDER }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {label}
      </div>
      <div className="mt-1 font-serif text-[24px] leading-none tracking-tight" style={{ color: INK }}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px]" style={{ color: MUTED_2 }}>
        {sub}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border px-2.5 py-1.5" style={{ borderColor: BORDER, background: "#FAF8F5" }}>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function CalcCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {label}
      </div>
      <div
        className="mt-0.5 font-serif text-[18px] leading-tight tracking-tight"
        style={{ color: highlight ? RUST : INK }}
      >
        {value}
      </div>
    </div>
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

// ────────────────────────────────────────────────────────────────────────────
// Team composition — visual band above the people grid
// ────────────────────────────────────────────────────────────────────────────

const TEAM_TONE: Record<Team, string> = {
  Engineering: "#3B82C4",
  Design: "#B8543D",
  Product: "#7A8C5F",
  GTM: "#C28840",
  Ops: "#8B7FD4"
};

function TeamComposition() {
  // Roll up people by team
  const byTeam = useMemo(() => {
    const map = new Map<Team, Person[]>();
    for (const p of people) {
      const list = map.get(p.team) ?? [];
      list.push(p);
      map.set(p.team, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, []);

  // Roll up tool usage
  const byTool = useMemo(() => {
    const map = new Map<Person["tool"], number>();
    for (const p of people) map.set(p.tool, (map.get(p.tool) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  // Workload distribution
  const workload = useMemo(() => {
    const map: Record<WorkloadLevel, number> = { light: 0, balanced: 0, high: 0, overloaded: 0 };
    for (const p of people) map[p.workload]++;
    return map;
  }, []);

  const total = people.length;
  const overloadedCount = workload.overloaded + workload.high;
  const avgWorkloadPct = Math.round(people.reduce((s, p) => s + p.workloadPct, 0) / total);

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
        {/* Headcount + team stacked bar */}
        <div className="rounded-[4px] border bg-white p-4" style={{ borderColor: BORDER }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Headcount · by team
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-serif text-[32px] leading-none tracking-tight" style={{ color: INK }}>
                  {total}
                </span>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>active</span>
              </div>
            </div>
            <div className="flex -space-x-1.5">
              {people.slice(0, 6).map((p) => (
                <TeamAvatar key={p.id} name={p.name} initials={p.initials} size={26} ring="#FFFFFF" />
              ))}
              {people.length > 6 ? (
                <div
                  className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-mono text-[9px]"
                  style={{ background: "rgba(26,22,18,0.08)", color: MUTED }}
                >
                  +{people.length - 6}
                </div>
              ) : null}
            </div>
          </div>

          {/* Stacked bar */}
          <div className="mt-4 flex h-2 overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
            {byTeam.map(([team, list]) => (
              <motion.span
                key={team}
                initial={{ width: 0 }}
                animate={{ width: `${(list.length / total) * 100}%` }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: TEAM_TONE[team], display: "block", height: "100%" }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {byTeam.map(([team, list]) => (
              <div key={team} className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: TEAM_TONE[team] }}
                />
                <span style={{ color: INK }}>{team}</span>
                <span>· {list.length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tool spread */}
        <div className="rounded-[4px] border bg-white p-4" style={{ borderColor: BORDER }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Tools · by adoption
          </div>
          <div className="mt-3 space-y-2">
            {byTool.map(([tool, n]) => {
              const tone = TOOL_TONE[tool];
              const pct = (n / total) * 100;
              return (
                <div key={tool} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-12 flex-shrink-0 items-center justify-center rounded-[3px] font-mono text-[9px] uppercase tracking-[0.08em]"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    {tone.mark} {tool}
                  </span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: "100%", background: tone.fg, opacity: 0.7 }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-[10.5px]" style={{ color: INK }}>
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workload distribution */}
        <div className="rounded-[4px] border bg-white p-4" style={{ borderColor: BORDER }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Avg load
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className="font-serif text-[32px] leading-none tracking-tight"
                  style={{ color: avgWorkloadPct >= 95 ? "#9E3B2E" : avgWorkloadPct >= 80 ? "#C28840" : INK }}
                >
                  {avgWorkloadPct}%
                </span>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {overloadedCount > 0 ? `${overloadedCount} hot` : "balanced"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {(["overloaded", "high", "balanced", "light"] as WorkloadLevel[]).map((lvl) => {
              const n = workload[lvl];
              const pct = total > 0 ? (n / total) * 100 : 0;
              return (
                <div key={lvl} className="flex items-center gap-2">
                  <span className="w-20 font-mono text-[9.5px] uppercase tracking-[0.08em]" style={{ color: MUTED }}>
                    {lvl}
                  </span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: "100%", background: WORKLOAD_COLORS[lvl] }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-[10.5px]" style={{ color: INK }}>
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Money pane — owns the subscription state shared by analytics + table
// ────────────────────────────────────────────────────────────────────────────

function MoneyPane() {
  const [subs, setSubs] = useState<Subscription[]>(INITIAL_SUBS);
  return (
    <>
      <MoneyAnalytics subs={subs} />
      <ActiveSubscriptions subs={subs} setSubs={setSubs} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Money analytics — burn line, category bar, top vendors, renewals
// ────────────────────────────────────────────────────────────────────────────

function MoneyAnalytics({ subs }: { subs: Subscription[] }) {
  // Synthesize a 12-month burn line ending at current monthly total
  const monthlyTotal = subs.reduce((s, x) => s + x.monthlyPerSeat * x.seats, 0);
  const burnLine = useMemo(() => {
    const months = 12;
    const arr: number[] = [];
    let val = monthlyTotal * 0.55;
    for (let i = 0; i < months; i++) {
      const growth = 1 + 0.045 + Math.sin(i * 0.7) * 0.02;
      val = val * growth;
      arr.push(Math.round(val));
    }
    arr[arr.length - 1] = Math.round(monthlyTotal);
    return arr;
  }, [monthlyTotal]);

  // Category breakdown
  const byCat = useMemo(() => {
    const map = new Map<Subscription["category"], number>();
    for (const s of subs) map.set(s.category, (map.get(s.category) ?? 0) + s.monthlyPerSeat * s.seats);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  // Top 5 vendors by monthly spend
  const topVendors = useMemo(() => {
    return [...subs].sort((a, b) => (b.monthlyPerSeat * b.seats) - (a.monthlyPerSeat * a.seats)).slice(0, 5);
  }, [subs]);

  // Renewals in the next 60 days
  const renewals = useMemo(() => {
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 60);
    return subs
      .filter((s) => s.renewal !== "rolling")
      .map((s) => ({ sub: s, days: Math.ceil((new Date(s.renewal).getTime() - now.getTime()) / 86400000) }))
      .filter((r) => r.days >= -7 && r.days <= 60)
      .sort((a, b) => a.days - b.days);
  }, [subs]);

  const maxBurn = Math.max(...burnLine);
  const minBurn = Math.min(...burnLine);
  const W = 100;
  const H = 50;
  const burnPoints = burnLine
    .map((v, i) => `${(i / (burnLine.length - 1)) * W},${H - ((v - minBurn) / (maxBurn - minBurn || 1)) * (H - 4) - 2}`)
    .join(" ");
  const areaPoints = `${burnPoints} ${W},${H} 0,${H}`;

  return (
    <section className="mt-6">
      <SectionLabel>Spend analytics</SectionLabel>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* Burn trend */}
        <div className="rounded-[4px] border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                Monthly burn · last 12 months
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-serif text-[28px] leading-none tracking-tight" style={{ color: INK }}>
                  {fmtUSDPrecise(burnLine[burnLine.length - 1])}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "#5A6B47" }}>
                  ↑ {Math.round(((burnLine[burnLine.length - 1] - burnLine[0]) / burnLine[0]) * 100)}% YoY
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end font-mono text-[10px]" style={{ color: MUTED }}>
              <span>peak · {fmtUSDPrecise(maxBurn)}</span>
              <span>low · {fmtUSDPrecise(minBurn)}</span>
            </div>
          </div>

          <div className="mt-4 relative" style={{ height: 130 }}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%">
              <defs>
                <linearGradient id="burnArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RUST} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={RUST} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#burnArea)" />
              <polyline
                points={burnPoints}
                fill="none"
                stroke={RUST}
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {burnLine.map((v, i) => {
                const x = (i / (burnLine.length - 1)) * W;
                const y = H - ((v - minBurn) / (maxBurn - minBurn || 1)) * (H - 4) - 2;
                return <circle key={i} cx={x} cy={y} r="0.5" fill={RUST} />;
              })}
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9px]" style={{ color: MUTED }}>
              {(() => {
                const labels: string[] = [];
                for (let i = 11; i >= 0; i--) {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  labels.push(d.toLocaleDateString("en-US", { month: "short" }));
                }
                return [labels[0], labels[5], labels[11]].map((m, i) => <span key={i}>{m}</span>);
              })()}
            </div>
          </div>
        </div>

        {/* Category share */}
        <div className="rounded-[4px] border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Spend · by category
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
            {byCat.map(([cat, amt]) => {
              const tone = CATEGORY_TONES[cat];
              const pct = (amt / monthlyTotal) * 100;
              return (
                <motion.span
                  key={cat}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: tone.fg, display: "block", height: "100%" }}
                />
              );
            })}
          </div>
          <div className="mt-3 space-y-1.5">
            {byCat.map(([cat, amt]) => {
              const tone = CATEGORY_TONES[cat];
              const pct = ((amt / monthlyTotal) * 100).toFixed(0);
              return (
                <div key={cat} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: tone.fg }}
                    />
                    <span className="font-mono text-[10.5px] capitalize" style={{ color: INK }}>{cat}</span>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono text-[10.5px]">
                    <span style={{ color: MUTED }}>{pct}%</span>
                    <span style={{ color: INK }}>{fmtUSDPrecise(Math.round(amt))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top vendors + renewals */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[4px] border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Top vendors · by monthly spend
          </div>
          <div className="mt-3 space-y-2.5">
            {(() => {
              const max = Math.max(...topVendors.map((v) => v.monthlyPerSeat * v.seats));
              return topVendors.map((v, i) => {
                const amt = v.monthlyPerSeat * v.seats;
                const pct = (amt / max) * 100;
                const tone = CATEGORY_TONES[v.category];
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="w-5 font-mono text-[10px]" style={{ color: MUTED }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px]" style={{ color: INK }}>{v.name}</span>
                        <span className="flex-shrink-0 font-mono text-[11px]" style={{ color: INK }}>
                          {fmtUSDPrecise(Math.round(amt))}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                          style={{ height: "100%", background: tone.fg, opacity: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Renewals timeline (next 60 days) */}
        <div className="rounded-[4px] border bg-white p-5" style={{ borderColor: BORDER }}>
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              Renewals · next 60d
            </div>
            <span className="font-mono text-[10px]" style={{ color: MUTED_2 }}>
              {renewals.length} upcoming
            </span>
          </div>
          {renewals.length === 0 ? (
            <div className="mt-6 text-center font-serif text-[16px] italic" style={{ color: MUTED }}>
              No renewals on the radar.
            </div>
          ) : (
            <>
              <div className="relative mt-5 h-10">
                <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: BORDER }} />
                {[0, 15, 30, 45, 60].map((d) => {
                  const left = (d / 60) * 100;
                  return (
                    <div
                      key={d}
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${left}%` }}
                    >
                      <span className="block h-2 w-px" style={{ background: BORDER }} />
                      <span className="mt-1 block font-mono text-[8.5px] uppercase tracking-[0.1em]" style={{ color: MUTED_2 }}>
                        {d === 0 ? "today" : `+${d}d`}
                      </span>
                    </div>
                  );
                })}
                {renewals.slice(0, 8).map((r) => {
                  const left = Math.max(0, Math.min(100, (r.days / 60) * 100));
                  const urgent = r.days <= 14;
                  const past = r.days < 0;
                  return (
                    <div
                      key={r.sub.id}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${left}%`, top: -2 }}
                      title={`${r.sub.name} · ${r.sub.renewal}`}
                    >
                      <span
                        className="block h-3 w-3 rounded-full border-2 border-white"
                        style={{ background: past ? "#9E3B2E" : urgent ? "#C28840" : RUST }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                {renewals.slice(0, 5).map((r) => {
                  const urgent = r.days <= 14;
                  return (
                    <div key={r.sub.id} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ background: urgent ? "#C28840" : RUST }}
                        />
                        <span className="truncate text-[12px]" style={{ color: INK }}>{r.sub.name}</span>
                      </div>
                      <span className="flex-shrink-0 font-mono text-[10.5px]" style={{ color: urgent ? "#8C5D1E" : MUTED }}>
                        {r.days < 0 ? `${Math.abs(r.days)}d overdue` : r.days === 0 ? "today" : `in ${r.days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tabbed dashboard nav — slides a rust underline between tabs
// ────────────────────────────────────────────────────────────────────────────

const INFO_TABS = [
  { id: "today", label: "Today", icon: TbCalendarEvent },
  { id: "pulse", label: "Pulse", icon: TbActivity },
  { id: "team", label: "Team", icon: TbUsers },
  { id: "activity", label: "Activity", icon: TbTimelineEvent },
  { id: "money", label: "Money", icon: TbReportMoney }
] as const;

type InfoTab = (typeof INFO_TABS)[number]["id"];

function TabNav({ active, onSelect }: { active: InfoTab; onSelect: (t: InfoTab) => void }) {
  return (
    <div
      className="mt-10 flex items-end gap-1 border-b"
      style={{ borderColor: BORDER }}
    >
      {INFO_TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="relative flex items-center gap-2 px-4 py-3 transition-colors"
            style={{ color: isActive ? INK : MUTED }}
          >
            <Icon size={15} />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{tab.label}</span>
            {isActive ? (
              <motion.span
                layoutId="info-tab-underline"
                className="absolute -bottom-px left-0 right-0 h-[2px]"
                style={{ background: RUST }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            ) : null}
          </button>
        );
      })}
      <span className="ml-auto px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: MUTED_2 }}>
        operator view
      </span>
    </div>
  );
}

const PANE_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const, staggerChildren: 0.07 }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } }
};

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } }
};

export default function InfoPage() {
  const [askMode, setAskMode] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("today");
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

          <TabNav active={activeTab} onSelect={setActiveTab} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={PANE_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-6"
            >
              {activeTab === "today" ? (
                <>
                  {/* Attention items as a slim banner at top of Today */}
                  <motion.section variants={SECTION_VARIANTS}>
                    <SectionLabel count={attentionItems.length}>Needs you today</SectionLabel>
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
                  </motion.section>

                  {/* Calendar as the big visual centerpiece */}
                  <motion.div variants={SECTION_VARIANTS}>
                    <WeekCalendar />
                  </motion.div>

                  {/* Two-column: meetings | alerts */}
                  <motion.div
                    variants={SECTION_VARIANTS}
                    className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2"
                  >
                    <div className="-mt-12">
                      <UpcomingMeetings />
                    </div>
                    <div className="-mt-12">
                      <AlertsWidget />
                    </div>
                  </motion.div>
                </>
              ) : null}

              {activeTab === "pulse" ? (
                <>
                  <motion.section variants={SECTION_VARIANTS}>
                    <SectionLabel>Org pulse</SectionLabel>
                    <div className="mt-3 grid grid-cols-2 gap-0 overflow-hidden rounded-[4px] border md:grid-cols-5" style={{ borderColor: BORDER, background: SURFACE }}>
                      <StatTile id="active" label="Active projects" value={orgStats.activeProjects.value} change={orgStats.activeProjects.change} trend={orgStats.activeProjects.trend} sparkline={orgStats.activeProjects.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} />
                      <StatTile id="velocity" label="Shipping velocity" value={orgStats.shippingVelocity.value} change={orgStats.shippingVelocity.change} trend={orgStats.shippingVelocity.trend} sparkline={orgStats.shippingVelocity.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} />
                      <StatTile id="cycle" label="Avg cycle time" value={orgStats.avgCycleTime.value} change={orgStats.avgCycleTime.change} trend={orgStats.avgCycleTime.trend} sparkline={orgStats.avgCycleTime.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} invertTrend />
                      <StatTile id="blockers" label="Blockers open" value={orgStats.blockersOpen.value} change={orgStats.blockersOpen.change} trend={orgStats.blockersOpen.trend} sparkline={orgStats.blockersOpen.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} invertTrend />
                      <StatTile id="capacity" label="Team capacity" value={orgStats.teamCapacity.value} change={orgStats.teamCapacity.change} trend={orgStats.teamCapacity.trend} sparkline={orgStats.teamCapacity.sparkline} hoveredTile={hoveredTile} onHover={setHoveredTile} last />
                    </div>
                  </motion.section>

                  <motion.div variants={SECTION_VARIANTS}>
                    <MySubscriptions onPick={(p) => setSelectedProject(p)} />
                  </motion.div>

                  {/* Footer pulse band */}
                  <motion.section variants={SECTION_VARIANTS} className="mt-12 border-t pt-6" style={{ borderColor: BORDER }}>
                    <SectionLabel>Org vitals · rolling</SectionLabel>
                    <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-7">
                      {[
                        { k: "eNPS", v: orgPulse.enps },
                        { k: "Ret · 30d", v: orgPulse.retention30 },
                        { k: "Ret · 60d", v: orgPulse.retention60 },
                        { k: "Ret · 90d", v: orgPulse.retention90 },
                        { k: "Active", v: orgPulse.activeProjects },
                        { k: "12w ships", v: orgPulse.shipping12wk },
                        { k: "Headcount", v: orgPulse.headcount }
                      ].map((m) => (
                        <div key={m.k} className="rounded-[4px] border bg-white px-3 py-3" style={{ borderColor: BORDER }}>
                          <div className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>{m.k}</div>
                          <div className="mt-1 font-serif text-[22px] leading-none tracking-tight" style={{ color: INK }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                </>
              ) : null}

              {activeTab === "team" ? (
                <>
                  <motion.div variants={SECTION_VARIANTS}>
                    <TeamComposition />
                  </motion.div>

                  <motion.section variants={SECTION_VARIANTS} className="grid gap-8" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
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
                            onAsk={() => setAskMode(true)}
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
                  </motion.section>

                  <motion.section variants={SECTION_VARIANTS} className="mt-12">
                    <button
                      type="button"
                      onClick={() => setHiringExpanded((v) => !v)}
                      className="flex w-full items-center justify-between border-b py-2 text-left"
                      style={{ borderColor: BORDER }}
                    >
                      <SectionLabel count={`${openRoles.length} open roles`}>Hiring & capacity</SectionLabel>
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
                                Backend at <span className="font-mono">110%</span> capacity for 3 weeks. Suggested hire:{" "}
                                <span className="font-medium">Senior Backend Engineer</span>.
                              </p>
                              <p className="mt-3 font-sans text-[13.5px] leading-[1.55] text-[#1A1612]">
                                Design has slack at <span className="font-mono">52%</span> on mobile — slide{" "}
                                <span className="font-medium">Anika</span> to the onboarding revamp.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.section>
                </>
              ) : null}

              {activeTab === "activity" ? (
                <>
                  <motion.div variants={SECTION_VARIANTS}>
                    <RecentChanges />
                  </motion.div>

                  <motion.section variants={SECTION_VARIANTS} className="mt-12">
                    <div className="flex items-baseline justify-between">
                      <SectionLabel count={blockers.length}>Open blockers</SectionLabel>
                      <span className="font-mono text-[10.5px] tracking-[0.06em] text-[#78716C]">oldest first</span>
                    </div>
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
                      {sortedBlockers.map((b) => (
                        <BlockerCard key={b.id} blocker={b} />
                      ))}
                    </div>
                  </motion.section>

                  <motion.section variants={SECTION_VARIANTS} className="mt-12">
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
                  </motion.section>
                </>
              ) : null}

              {activeTab === "money" ? (
                <motion.div variants={SECTION_VARIANTS}>
                  <MoneyPane />
                </motion.div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* Persistent footer hint */}
          <p className="mt-16 border-t pt-4 font-mono text-[10px] tracking-[0.18em] text-[#78716C]" style={{ borderColor: BORDER }}>
            ↳ press <span style={{ color: INK }}>⌘K</span> to ask socrates · press <span style={{ color: INK }}>A</span> to assign · right-click any person for actions
          </p>
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

const TOOL_TONE: Record<Person["tool"], { bg: string; fg: string; mark: string }> = {
  vscode: { bg: "rgba(59,130,196,0.14)", fg: "#3B82C4", mark: "VS" },
  cursor: { bg: "rgba(26,22,18,0.10)", fg: "#1A1612", mark: "C" },
  claude: { bg: "rgba(184,84,61,0.12)", fg: "#B8543D", mark: "Σ" },
  figma:  { bg: "rgba(184,84,61,0.10)", fg: "#B8543D", mark: "F" },
  notion: { bg: "rgba(26,22,18,0.08)", fg: "#1A1612", mark: "N" },
  linear: { bg: "rgba(94,106,210,0.14)", fg: "#5E6AD2", mark: "L" }
};

const STATUS_DOT: Record<Person["status"], { color: string; label: string }> = {
  active:    { color: "#7A8C5F", label: "Active" },
  "on-leave": { color: "#C28840", label: "On leave" },
  new:       { color: "#5E7A8C", label: "New" }
};

function TeamAvatar({ name, initials, size = 40, status, ring }: { name: string; initials: string; size?: number; status?: Person["status"]; ring?: string }) {
  // Deterministic warm gradient pair from name
  const palette: [string, string][] = [
    ["#E8DCC4", "#D6C3A4"],
    ["#E6CFC0", "#D8B9A4"],
    ["#D9CCC0", "#BFAEA0"],
    ["#D6D0C2", "#B8B0A0"],
    ["#E2D2BC", "#C9B69A"],
    ["#CCC6BA", "#A8A19A"],
    ["#E0C4B2", "#B8967E"],
    ["#CFC9BF", "#A6A0A0"]
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [c1, c2] = palette[h % palette.length];
  const statusInfo = status ? STATUS_DOT[status] : null;
  return (
    <div
      title={name}
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 30% 30%, ${c1}, ${c2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: INK,
          fontFamily: "Geist, sans-serif",
          fontSize: Math.round(size * 0.36),
          fontWeight: 500,
          letterSpacing: "0.01em",
          boxShadow: ring ? `0 0 0 2px ${ring}` : "inset 0 1px 0 rgba(255,255,255,0.4)"
        }}
      >
        {initials}
      </div>
      {statusInfo ? (
        <span
          aria-hidden
          title={statusInfo.label}
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: Math.max(8, size * 0.22),
            height: Math.max(8, size * 0.22),
            borderRadius: "50%",
            background: statusInfo.color,
            border: "2px solid #FFFFFF"
          }}
        />
      ) : null}
    </div>
  );
}

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
  const tool = TOOL_TONE[person.tool];
  const wlColor = WORKLOAD_COLORS[person.workload];
  return (
    <motion.div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group relative cursor-pointer overflow-hidden rounded-[4px] border transition-colors"
      style={{
        borderColor: hover ? BORDER_HOVER : BORDER,
        background: SURFACE,
        boxShadow: hover ? "0 6px 18px rgba(26,22,18,0.06)" : "none"
      }}
    >
      {/* Top: avatar + identity + tool badge */}
      <div className="flex items-start gap-3 p-3">
        <TeamAvatar
          name={person.name}
          initials={person.initials}
          size={42}
          status={person.status}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-medium text-[#1A1612]">{person.name}</p>
              <p className="truncate font-sans text-[11px] text-[#78716C]">{person.role}</p>
            </div>
            <span
              className="flex h-5 flex-shrink-0 items-center gap-1 rounded-[3px] px-1.5 font-mono text-[9px] uppercase tracking-[0.1em]"
              style={{ background: tool.bg, color: tool.fg }}
              title={`tool: ${TOOL_LABEL[person.tool]}`}
            >
              <span className="font-bold">{tool.mark}</span>
              <span>{TOOL_LABEL[person.tool]}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Current focus */}
      <p className="-mt-1 truncate px-3 font-mono text-[10.5px] text-[#5A5450]" title={person.currentFocus}>
        ↳ {person.currentFocus}
      </p>

      {/* Workload bar with percentage badge */}
      <div className="mt-2.5 px-3">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em]">
          <span style={{ color: MUTED }}>workload</span>
          <span style={{ color: wlColor }}>
            {person.workloadPct}% · {person.workload}
          </span>
        </div>
        <div className="mt-1 h-[5px] overflow-hidden rounded-full" style={{ background: "rgba(26,22,18,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(130, person.workloadPct)}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: "100%", background: wlColor }}
          />
        </div>
      </div>

      {/* 8-week sparkline */}
      <div className="mt-2 px-3 pb-3">
        <Sparkline data={person.workloadTrend} width={260} height={28} stroke={wlColor} />
        <div className="mt-1 flex items-center justify-between font-mono text-[9.5px] tracking-[0.04em] text-[#78716C]">
          <span>last 8w</span>
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
            className="absolute inset-x-0 -bottom-[1px] flex rounded-b-[4px] border-x border-b bg-white"
            style={{ borderColor: BORDER_HOVER }}
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
                className="flex-1 py-1.5 font-mono text-[10px] tracking-[0.08em] text-[#78716C] transition-colors hover:text-[#B8543D]"
                style={{ borderLeft: i === 0 ? "none" : `1px solid ${BORDER}` }}
              >
                {q.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
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
