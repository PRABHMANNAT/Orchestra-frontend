/*
 * Orchestra · Code page — the human surface of a live, shared project brain
 * scoped to code. Two questions, answered fast: what's real right now, and how
 * does my work collide with everyone else's. Stacked zoom levels: live presence
 * + collision radar (hero, rotating contribution globe), a health strip, the
 * mock-vs-real registry and conflict radar (the wedge), then integration seams,
 * decisions, and an agent-context preview. Pure presentational React, mock
 * fixtures, Warm Editorial palette only — no UI library beyond Framer Motion,
 * Tailwind, and Tabler icons.
 *
 * Assumptions: a developer's "activity" = (active file, branch, tool, minutes
 * since last context push); a "collision" = either two devs editing the same
 * file in unmerged branches OR a frontend caller whose contract diverges from
 * the backend it depends on; staleness in minutes from a fixed "now"; registry
 * filter defaults to "all" so a viewer sees scope first, status second.
 *
 * Reframe: a team might prefer a plain git dashboard because it's already in
 * GitHub — they trust commits more than inferred state. Defeating choice: the
 * Mock vs Real registry surfaces an axis (real / mocked / partial / assumed)
 * that git structurally cannot show, and it sits as the largest panel after
 * the hero so the wedge is the first thing the eye lands on.
 */

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  TbActivity,
  TbAlertTriangle,
  TbArrowsRightLeft,
  TbBolt,
  TbBrandVscode,
  TbCheck,
  TbChevronDown,
  TbCircleFilled,
  TbClock,
  TbCode,
  TbCopy,
  TbDownload,
  TbGitBranch,
  TbGitFork,
  TbHelpCircle,
  TbMessage2,
  TbRefresh,
  TbSearch,
  TbSend,
  TbSparkles,
  TbTerminal2,
  TbWaveSine
} from "react-icons/tb";

// ───────────────────────────────────────────────────────────────────────────
// Types (exported)
// ───────────────────────────────────────────────────────────────────────────

export type DevRole = "frontend" | "backend" | "agent";
export type Tool = "vscode" | "claude" | "cursor";

export interface Dev {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: DevRole;
  tool: Tool;
  staleMin: number;
  branch: string;
  activeFile: string;
  inFlightFiles: number;
  status: "live" | "idle";
  lon: number;
  lat: number;
}

export type AlertSeverity = "blocking" | "watch";

export interface CollisionAlert {
  id: string;
  kind: "contract-mismatch" | "overlap-edit" | "duplicate-util";
  severity: AlertSeverity;
  message: string;
  mono: string;
  parties: [string, string];
  askPrompt: string;
}

export type EntityType = "endpoint" | "model" | "component";
export type RegistryStatus = "real" | "mocked" | "partial" | "assumed";

export interface RegistryEntry {
  id: string;
  name: string;
  type: EntityType;
  ownerId: string;
  status: RegistryStatus;
  note?: string;
  consumers?: string[];   // who reads this — file paths
  lastChange?: string;    // pre-formatted, e.g. "12m ago"
  askPrompt: string;
}

export type ConflictKind = "overlap-edit" | "divergent-branch" | "duplicate-util" | "renamed-field";

export interface ConflictItem {
  id: string;
  kind: ConflictKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  parties: [string, string];
  suggestedFix?: string;
  askPrompt: string;
}

export type SeamStatus = "connected" | "waiting" | "conflicting";

export interface IntegrationSeam {
  id: string;
  feature: string;
  frontend: { ownerId: string; contract: string };
  backend: { ownerId: string; contract: string };
  status: SeamStatus;
  lastSync?: string;
  feSchema?: string[];   // optional fields the FE reads
  beSchema?: string[];   // optional fields the BE returns
  askPrompt: string;
}

export type DecisionTag = "decision" | "api-contract" | "assumption";

export interface DecisionEntry {
  id: string;
  text: string;
  authorId: string;
  ts: string;
  tag: DecisionTag;
  context?: string;       // additional reasoning revealed on expand
  affectedPaths?: string[];
}

export interface TeamContextSnapshot {
  whoIsBuildingWhat: { devId: string; line: string }[];
  changedFiles: string[];
  mocked: string[];
  openSeams: string[];
  recentDecisions: string[];
  blockers: string[];
  waiting?: string[];
  deployTruth?: string[];
  safeToTouch?: string[];
  todoFixme?: string[];
  agentActivity?: string[];
}

export type DeployEnvironment = "prod" | "staging" | "preview";
export type DeployStatus = "live" | "deploying" | "behind" | "failed";

export interface BranchDeployTruth {
  id: string;
  branch: string;
  ownerId: string;
  env: DeployEnvironment;
  status: DeployStatus;
  url: string;
  commit: string;
  updated: string;
  drift: string;
  askPrompt: string;
}

export type TouchRisk = "safe" | "watch" | "blocked";

export interface FileTouchSignal {
  id: string;
  path: string;
  ownerId: string;
  risk: TouchRisk;
  reason: string;
  lastTouched: string;
  askPrompt: string;
}

export type WaitingStatus = "waiting" | "blocked" | "ready";

export interface WaitingEdge {
  id: string;
  fromDevId: string;
  toDevId: string;
  work: string;
  status: WaitingStatus;
  since: string;
  askPrompt: string;
}

export interface AgentActivityEntry {
  id: string;
  ownerId: string;
  agent: string;
  ts: string;
  action: string;
  target: string;
  result: string;
}

export type TodoKind = "TODO" | "FIXME" | "HACK";
export type TodoPriority = "low" | "medium" | "high";

export interface TodoFixmeEntry {
  id: string;
  kind: TodoKind;
  priority: TodoPriority;
  path: string;
  line: number;
  ownerId: string;
  text: string;
  askPrompt: string;
}

export interface CodePageProps {
  devs?: Dev[];
  alerts?: CollisionAlert[];
  registry?: RegistryEntry[];
  conflicts?: ConflictItem[];
  seams?: IntegrationSeam[];
  decisions?: DecisionEntry[];
  contextSnapshot?: TeamContextSnapshot;
  deployTruth?: BranchDeployTruth[];
  fileSafety?: FileTouchSignal[];
  waitingGraph?: WaitingEdge[];
  agentActivity?: AgentActivityEntry[];
  todoFixmes?: TodoFixmeEntry[];
  onAskAgent?: (prompt: string) => void;
  onFetchContext?: () => void;
}

// ───────────────────────────────────────────────────────────────────────────
// Palette
// ───────────────────────────────────────────────────────────────────────────

const TEAL = "#00B4A0";
const RUST = "#B8543D";
const ORANGE = "#F59340";
const PURPLE = "#8B7FD4";
const INK = "#1A1612";
const MUTED = "#6B6259";
const BONE = "#FAF8F5";
const HAIR = "rgba(26,22,18,0.08)";
const HAIR_STRONG = "rgba(26,22,18,0.12)";

const ease = [0.22, 1, 0.36, 1] as const;

// ───────────────────────────────────────────────────────────────────────────
// Mock fixtures — three devs on Northstar Cloud
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_DEVS: Dev[] = [
  {
    id: "kartikeya",
    name: "Kartikeya",
    initials: "KA",
    color: TEAL,
    role: "frontend",
    tool: "vscode",
    staleMin: 2,
    branch: "feat/dashboard-cards",
    activeFile: "src/pages/Dashboard.tsx",
    inFlightFiles: 3,
    status: "live",
    lon: -62,
    lat: 26
  },
  {
    id: "mannan",
    name: "Mannan",
    initials: "MA",
    color: PURPLE,
    role: "agent",
    tool: "claude",
    staleMin: 1,
    branch: "feat/page-2-comms",
    activeFile: "src/components/CommsPanel.tsx",
    inFlightFiles: 6,
    status: "live",
    lon: 16,
    lat: -5
  },
  {
    id: "prabh",
    name: "Prabh",
    initials: "PR",
    color: ORANGE,
    role: "backend",
    tool: "cursor",
    staleMin: 7,
    branch: "feat/comms-routes",
    activeFile: "server/routes/comms.py",
    inFlightFiles: 4,
    status: "live",
    lon: 78,
    lat: 24
  },
  {
    id: "adhiraj",
    name: "Adhiraj",
    initials: "AD",
    color: RUST,
    role: "backend",
    tool: "vscode",
    staleMin: 5,
    branch: "feat/auth-session",
    activeFile: "server/middleware/auth.py",
    inFlightFiles: 2,
    status: "live",
    lon: -35,
    lat: -42
  }
];

const DEFAULT_ALERTS: CollisionAlert[] = [
  {
    id: "a1",
    kind: "contract-mismatch",
    severity: "blocking",
    message: "CommsPanel expects a list-shape from",
    mono: "GET /api/comms",
    parties: ["mannan", "prabh"],
    askPrompt:
      "Show me the contract mismatch on GET /api/comms between CommsPanel and routes/comms.py and propose a unified shape."
  },
  {
    id: "a2",
    kind: "overlap-edit",
    severity: "watch",
    message: "Two unmerged edits in flight on",
    mono: "src/types/comms.ts",
    parties: ["kartikeya", "mannan"],
    askPrompt:
      "Diff the two in-flight changes to src/types/comms.ts (Kartikeya vs Mannan) and call out the conflicting lines."
  }
];

const DEFAULT_REGISTRY: RegistryEntry[] = [
  {
    id: "r1",
    name: "GET /api/comms",
    type: "endpoint",
    ownerId: "prabh",
    status: "mocked",
    note: "returns a stub list, no auth wiring yet",
    consumers: ["src/components/CommsPanel.tsx", "src/hooks/useComms.ts"],
    lastChange: "12m ago",
    askPrompt: "What does GET /api/comms currently return and what's needed to make it real?"
  },
  {
    id: "r2",
    name: "POST /api/comms",
    type: "endpoint",
    ownerId: "prabh",
    status: "assumed",
    note: "frontend calls it; route file not created",
    consumers: ["src/components/CommsPanel.tsx"],
    lastChange: "1h ago",
    askPrompt: "POST /api/comms is assumed by the frontend — draft the route + handler."
  },
  {
    id: "r3",
    name: "GET /api/projects/:id",
    type: "endpoint",
    ownerId: "prabh",
    status: "real",
    consumers: ["src/pages/Dashboard.tsx"],
    lastChange: "2d ago",
    askPrompt: "Summarise the shape returned by GET /api/projects/:id."
  },
  {
    id: "r4",
    name: "POST /api/auth/session",
    type: "endpoint",
    ownerId: "adhiraj",
    status: "real",
    consumers: ["src/lib/auth.ts"],
    lastChange: "1d ago",
    askPrompt: "What sets POST /api/auth/session — middleware, cookies, expiry?"
  },
  {
    id: "r5",
    name: "Comm",
    type: "model",
    ownerId: "mannan",
    status: "partial",
    note: "fields drift between frontend and backend",
    consumers: ["src/types/comms.ts", "server/models/comm.py"],
    lastChange: "8m ago",
    askPrompt: "List every field on the Comm model and flag where FE and BE disagree."
  },
  {
    id: "r6",
    name: "Project",
    type: "model",
    ownerId: "kartikeya",
    status: "real",
    consumers: ["src/types/project.ts"],
    lastChange: "3d ago",
    askPrompt: "Show the Project model fields and consumers."
  },
  {
    id: "r7",
    name: "User",
    type: "model",
    ownerId: "adhiraj",
    status: "real",
    consumers: ["server/models/user.py", "src/types/user.ts"],
    lastChange: "5d ago",
    askPrompt: "Summarise the User model fields and auth coupling."
  },
  {
    id: "r8",
    name: "CommsPanel",
    type: "component",
    ownerId: "mannan",
    status: "mocked",
    note: "renders fixture comms, swap to query on contract lock",
    consumers: ["src/pages/Page2.tsx"],
    lastChange: "4m ago",
    askPrompt: "Show what CommsPanel renders today and the swap-to-real diff once the contract is locked."
  },
  {
    id: "r9",
    name: "DashboardHero",
    type: "component",
    ownerId: "kartikeya",
    status: "real",
    consumers: ["src/pages/Dashboard.tsx"],
    lastChange: "yesterday",
    askPrompt: "What data sources does DashboardHero depend on right now?"
  },
  {
    id: "r10",
    name: "RequestsList",
    type: "component",
    ownerId: "kartikeya",
    status: "partial",
    note: "pagination not implemented",
    consumers: ["src/pages/Requests.tsx"],
    lastChange: "2h ago",
    askPrompt: "What's missing from RequestsList to ship it — pagination, empty state, error?"
  },
  {
    id: "r11",
    name: "AuditLog",
    type: "component",
    ownerId: "mannan",
    status: "assumed",
    note: "referenced in nav, not built",
    consumers: ["src/components/NavBar.tsx"],
    lastChange: "—",
    askPrompt: "AuditLog is referenced but not built — scaffold it from the closest existing pattern."
  }
];

const DEFAULT_CONFLICTS: ConflictItem[] = [
  {
    id: "c1",
    kind: "overlap-edit",
    severity: "watch",
    title: "Same file in two branches",
    detail: "src/types/comms.ts has unmerged changes on feat/dashboard-cards and feat/page-2-comms.",
    parties: ["kartikeya", "mannan"],
    suggestedFix:
      "Land Kartikeya's branch first (smaller delta), then rebase Mannan's branch — overlap is in 4 lines around the Comm type.",
    askPrompt: "Walk me through what each branch changes in src/types/comms.ts and the safest merge order."
  },
  {
    id: "c2",
    kind: "renamed-field",
    severity: "blocking",
    title: "Renamed field, frontend not updated",
    detail: "Backend renamed Comm.body → Comm.message; CommsPanel still reads .body.",
    parties: ["prabh", "mannan"],
    suggestedFix:
      "Single rename across src/types/comms.ts and src/components/CommsPanel.tsx (3 reads). Backend keeps a transient alias for one release.",
    askPrompt: "Find every reader of Comm.body and produce a rename PR to Comm.message."
  },
  {
    id: "c3",
    kind: "duplicate-util",
    severity: "watch",
    title: "Two utilities solving the same thing",
    detail: "formatRelativeTime appears in src/lib/time.ts and src/utils/dates.ts.",
    parties: ["kartikeya", "mannan"],
    suggestedFix: "Keep src/lib/time.ts (broader test coverage); replace 2 imports of src/utils/dates.ts and delete it.",
    askPrompt: "Diff src/lib/time.ts vs src/utils/dates.ts and recommend which to keep."
  },
  {
    id: "c4",
    kind: "divergent-branch",
    severity: "watch",
    title: "Branch is 14 commits behind main",
    detail: "feat/comms-routes hasn't pulled main since the auth middleware rewrite.",
    parties: ["prabh", "adhiraj"],
    suggestedFix: "Rebase onto main; expect conflicts in server/middleware/auth.py around lines 40-72.",
    askPrompt: "What main-branch changes would feat/comms-routes need to rebase onto?"
  }
];

const DEFAULT_SEAMS: IntegrationSeam[] = [
  {
    id: "s1",
    feature: "Comms list",
    frontend: { ownerId: "mannan", contract: "GET /api/comms → Comm[]" },
    backend: { ownerId: "prabh", contract: "GET /api/comms → { items, cursor }" },
    status: "conflicting",
    lastSync: "drift detected 4m ago",
    feSchema: ["id", "author", "body", "createdAt"],
    beSchema: ["id", "author", "message", "created_at", "cursor"],
    askPrompt: "Reconcile the Comms list seam: frontend wants Comm[], backend returns { items, cursor }."
  },
  {
    id: "s2",
    feature: "Dashboard summary",
    frontend: { ownerId: "kartikeya", contract: "GET /api/projects/:id" },
    backend: { ownerId: "prabh", contract: "GET /api/projects/:id" },
    status: "connected",
    lastSync: "stable for 2d",
    feSchema: ["id", "name", "ownerName", "openRequests"],
    beSchema: ["id", "name", "ownerName", "openRequests"],
    askPrompt: "Confirm the Dashboard summary seam is stable and nothing's drifting."
  },
  {
    id: "s3",
    feature: "Audit log",
    frontend: { ownerId: "mannan", contract: "GET /api/audit?since=" },
    backend: { ownerId: "prabh", contract: "(route not created)" },
    status: "waiting",
    lastSync: "never",
    feSchema: ["id", "actor", "verb", "target", "at"],
    beSchema: [],
    askPrompt: "Audit log seam is waiting on the backend route — draft a minimal /api/audit handler."
  },
  {
    id: "s4",
    feature: "User profile",
    frontend: { ownerId: "kartikeya", contract: "GET /api/me" },
    backend: { ownerId: "adhiraj", contract: "GET /api/me → User" },
    status: "connected",
    lastSync: "stable for 8d",
    feSchema: ["id", "name", "email", "avatarUrl", "role"],
    beSchema: ["id", "name", "email", "avatarUrl", "role"],
    askPrompt: "Sanity-check the user profile seam — is the response cached anywhere stale?"
  },
  {
    id: "s5",
    feature: "Notifications",
    frontend: { ownerId: "mannan", contract: "GET /api/notifications" },
    backend: { ownerId: "prabh", contract: "polling endpoint, no websocket yet" },
    status: "waiting",
    lastSync: "scoped, not built",
    feSchema: ["id", "kind", "body", "readAt"],
    beSchema: ["id", "kind", "payload"],
    askPrompt: "Notifications: pick polling vs websocket and draft the smallest viable backend handler."
  },
  {
    id: "s6",
    feature: "File upload",
    frontend: { ownerId: "kartikeya", contract: "POST /api/upload (multipart)" },
    backend: { ownerId: "adhiraj", contract: "POST /api/upload → { url, size }" },
    status: "connected",
    lastSync: "stable for 4d",
    feSchema: ["url", "size"],
    beSchema: ["url", "size", "contentType"],
    askPrompt: "Should the frontend start reading contentType from the upload response?"
  }
];

const DEFAULT_DECISIONS: DecisionEntry[] = [
  {
    id: "d1",
    text: "Move auth session to httpOnly cookie; drop bearer-in-header flow.",
    authorId: "adhiraj",
    ts: "12 min ago",
    tag: "decision",
    context: "Bearer-in-header was leaking into logs. Cookie + SameSite=Lax matches our existing CSRF setup.",
    affectedPaths: ["server/middleware/auth.py", "src/lib/auth.ts"]
  },
  {
    id: "d2",
    text: "Comm payloads paginate with a cursor, not an offset. Page size 25.",
    authorId: "prabh",
    ts: "1 h ago",
    tag: "api-contract",
    context: "Offset paging breaks under live appends. Cursor uses the row's createdAt + id tiebreak.",
    affectedPaths: ["server/routes/comms.py", "src/components/CommsPanel.tsx"]
  },
  {
    id: "d3",
    text: "Assume agents never send back HTML — frontend renders markdown only.",
    authorId: "mannan",
    ts: "3 h ago",
    tag: "assumption",
    context: "Easier to sanitise; we have markdown rendering already; nothing in our current prompt set needs raw HTML.",
    affectedPaths: ["src/components/AgentMessage.tsx"]
  },
  {
    id: "d4",
    text: "Dashboard cards are presentational; data lives in a single useDashboard hook.",
    authorId: "kartikeya",
    ts: "yesterday",
    tag: "decision",
    context: "Keeps refetch/cache logic in one place; cards stay swappable.",
    affectedPaths: ["src/pages/Dashboard.tsx", "src/hooks/useDashboard.ts"]
  },
  {
    id: "d5",
    text: "All endpoints under /api/v1; v0 paths are deprecated and will 404 by Friday.",
    authorId: "prabh",
    ts: "yesterday",
    tag: "api-contract",
    context: "Frees us to ship breaking changes without coordinating with the demo client.",
    affectedPaths: ["server/routes/*"]
  },
  {
    id: "d6",
    text: "Frontend uses SWR for cache + revalidation. No Redux, no React Query.",
    authorId: "kartikeya",
    ts: "34 min ago",
    tag: "decision",
    context: "SWR fits our stale-while-revalidate flows without ceremony; lighter than React Query and we don't need the mutation primitives yet.",
    affectedPaths: ["src/hooks/*", "src/lib/fetcher.ts"]
  },
  {
    id: "d7",
    text: "Comm.message is plain text, max 4000 chars. Markdown rendered client-side.",
    authorId: "prabh",
    ts: "2 h ago",
    tag: "api-contract",
    context: "Backend stays content-agnostic. Sanitisation is the renderer's job.",
    affectedPaths: ["server/models/comm.py", "src/components/CommsPanel.tsx"]
  },
  {
    id: "d8",
    text: "Inline banner for all errors. No toasts, no modal dialogs.",
    authorId: "kartikeya",
    ts: "5 h ago",
    tag: "decision",
    context: "Toasts get missed; modals interrupt. Inline keeps the error attached to the action.",
    affectedPaths: ["src/components/ErrorBanner.tsx"]
  },
  {
    id: "d9",
    text: "Rate limiting deferred to gateway in week 4 — assume happy path for now.",
    authorId: "mannan",
    ts: "yesterday",
    tag: "assumption",
    context: "Until the gateway is in, no per-route limiter. Keeps the route code lean.",
    affectedPaths: ["server/routes/*"]
  },
  {
    id: "d10",
    text: "Auth tokens rotate every 24h; refresh handled by the cookie middleware.",
    authorId: "adhiraj",
    ts: "2d ago",
    tag: "api-contract",
    context: "Reduces blast radius of any token leak. Refresh is opaque to FE.",
    affectedPaths: ["server/middleware/auth.py"]
  }
];

const DEFAULT_DEPLOY_TRUTH: BranchDeployTruth[] = [
  {
    id: "bd1",
    branch: "main",
    ownerId: "adhiraj",
    env: "prod",
    status: "live",
    url: "prod.northstar.app",
    commit: "8f42c1a",
    updated: "18m ago",
    drift: "matches main",
    askPrompt: "Confirm what commit is live in prod and list any unreleased code after 8f42c1a."
  },
  {
    id: "bd2",
    branch: "feat/dashboard-cards",
    ownerId: "kartikeya",
    env: "staging",
    status: "behind",
    url: "staging.northstar.app",
    commit: "41ad8be",
    updated: "42m ago",
    drift: "3 commits behind branch head",
    askPrompt: "Show why staging is behind feat/dashboard-cards and what deploy would change."
  },
  {
    id: "bd3",
    branch: "feat/page-2-comms",
    ownerId: "mannan",
    env: "preview",
    status: "deploying",
    url: "pr-124.northstar.app",
    commit: "e91a72d",
    updated: "2m ago",
    drift: "build running",
    askPrompt: "Track the page-2-comms preview deploy and summarize the pending checks."
  },
  {
    id: "bd4",
    branch: "feat/comms-routes",
    ownerId: "prabh",
    env: "preview",
    status: "failed",
    url: "pr-127.northstar.app",
    commit: "b71ef09",
    updated: "9m ago",
    drift: "schema smoke test failed",
    askPrompt: "Open the failed preview deploy for feat/comms-routes and explain the schema failure."
  }
];

const DEFAULT_FILE_SAFETY: FileTouchSignal[] = [
  {
    id: "fs1",
    path: "src/types/comms.ts",
    ownerId: "mannan",
    risk: "blocked",
    reason: "two branches are changing Comm.body / Comm.message",
    lastTouched: "4m ago",
    askPrompt: "Can I safely edit src/types/comms.ts right now? Explain the collision and safest order."
  },
  {
    id: "fs2",
    path: "src/components/CommsPanel.tsx",
    ownerId: "mannan",
    risk: "watch",
    reason: "depends on the unsettled GET /api/comms shape",
    lastTouched: "6m ago",
    askPrompt: "Before I edit CommsPanel, show the current API shape risk and suggested guardrails."
  },
  {
    id: "fs3",
    path: "server/routes/comms.py",
    ownerId: "prabh",
    risk: "watch",
    reason: "preview deploy is failing schema smoke tests",
    lastTouched: "9m ago",
    askPrompt: "Show the current risks in server/routes/comms.py and what has to land first."
  },
  {
    id: "fs4",
    path: "src/pages/Dashboard.tsx",
    ownerId: "kartikeya",
    risk: "safe",
    reason: "branch is isolated; no overlapping edits detected",
    lastTouched: "2m ago",
    askPrompt: "Summarize why src/pages/Dashboard.tsx is safe to touch and any nearby branch drift."
  },
  {
    id: "fs5",
    path: "server/middleware/auth.py",
    ownerId: "adhiraj",
    risk: "blocked",
    reason: "Prabh's routes branch is waiting on the auth cookie rewrite",
    lastTouched: "12m ago",
    askPrompt: "Explain the auth.py dependency chain and who is blocked on this file."
  }
];

const DEFAULT_WAITING_GRAPH: WaitingEdge[] = [
  {
    id: "wg1",
    fromDevId: "mannan",
    toDevId: "prabh",
    work: "CommsPanel cannot ship until GET /api/comms shape is locked",
    status: "blocked",
    since: "4m",
    askPrompt: "Resolve the Mannan to Prabh blocker around the Comms list contract."
  },
  {
    id: "wg2",
    fromDevId: "prabh",
    toDevId: "adhiraj",
    work: "comms routes need the new httpOnly auth middleware",
    status: "waiting",
    since: "12m",
    askPrompt: "Show what Prabh needs from Adhiraj's auth-session branch."
  },
  {
    id: "wg3",
    fromDevId: "kartikeya",
    toDevId: "adhiraj",
    work: "dashboard user profile cache waits on GET /api/me freshness",
    status: "waiting",
    since: "18m",
    askPrompt: "Check the Kartikeya to Adhiraj dependency for GET /api/me freshness."
  },
  {
    id: "wg4",
    fromDevId: "adhiraj",
    toDevId: "kartikeya",
    work: "upload response contentType is ready for frontend adoption",
    status: "ready",
    since: "stable",
    askPrompt: "Draft the frontend change to read contentType from the upload response."
  }
];

const DEFAULT_AGENT_ACTIVITY: AgentActivityEntry[] = [
  {
    id: "aa1",
    ownerId: "mannan",
    agent: "Claude",
    ts: "1m ago",
    action: "summarized API drift",
    target: "src/components/CommsPanel.tsx",
    result: "flagged Comm.body -> Comm.message mismatch"
  },
  {
    id: "aa2",
    ownerId: "prabh",
    agent: "Cursor",
    ts: "6m ago",
    action: "ran route smoke check",
    target: "server/routes/comms.py",
    result: "preview schema check failed on cursor wrapper"
  },
  {
    id: "aa3",
    ownerId: "kartikeya",
    agent: "VS Code agent",
    ts: "11m ago",
    action: "extracted dashboard context",
    target: "src/hooks/useDashboard.ts",
    result: "confirmed hook owns refetch and cache state"
  },
  {
    id: "aa4",
    ownerId: "adhiraj",
    agent: "Socrates",
    ts: "14m ago",
    action: "captured auth decision",
    target: "server/middleware/auth.py",
    result: "recorded cookie migration and affected callers"
  }
];

const DEFAULT_TODO_FIXMES: TodoFixmeEntry[] = [
  {
    id: "tf1",
    kind: "FIXME",
    priority: "high",
    path: "src/components/CommsPanel.tsx",
    line: 88,
    ownerId: "mannan",
    text: "swap fixture comms to live query after contract lock",
    askPrompt: "Turn the CommsPanel FIXME into a concrete implementation checklist."
  },
  {
    id: "tf2",
    kind: "TODO",
    priority: "medium",
    path: "server/routes/comms.py",
    line: 142,
    ownerId: "prabh",
    text: "add auth middleware once cookie session lands",
    askPrompt: "Draft the route auth TODO in server/routes/comms.py."
  },
  {
    id: "tf3",
    kind: "HACK",
    priority: "medium",
    path: "src/lib/auth.ts",
    line: 31,
    ownerId: "adhiraj",
    text: "temporary bearer fallback during cookie migration",
    askPrompt: "Find and remove the auth bearer fallback after cookie migration is stable."
  },
  {
    id: "tf4",
    kind: "TODO",
    priority: "low",
    path: "src/pages/Dashboard.tsx",
    line: 214,
    ownerId: "kartikeya",
    text: "add empty state for dashboard requests",
    askPrompt: "Implement the dashboard requests empty state TODO."
  }
];

const DEFAULT_CONTEXT: TeamContextSnapshot = {
  whoIsBuildingWhat: [
    { devId: "kartikeya", line: "Dashboard cards, 3 files in flight on feat/dashboard-cards." },
    { devId: "mannan", line: "Page 2 comms surface via Claude agent, 6 files including CommsPanel." },
    { devId: "prabh", line: "Comms routes, 4 files in flight on feat/comms-routes." },
    { devId: "adhiraj", line: "Auth session middleware, 2 files in flight on feat/auth-session." }
  ],
  changedFiles: [
    "src/pages/Dashboard.tsx",
    "src/components/CommsPanel.tsx",
    "src/types/comms.ts (×2)",
    "server/routes/comms.py",
    "server/middleware/auth.py"
  ],
  mocked: ["GET /api/comms", "POST /api/comms (assumed)", "CommsPanel", "AuditLog (assumed)"],
  openSeams: [
    "Comms list — conflicting shape (Comm[] vs { items, cursor })",
    "Audit log — backend route not created"
  ],
  recentDecisions: [
    "Auth session → httpOnly cookie (Adhiraj, 12 min ago)",
    "Comms paginate by cursor (Prabh, 1 h ago)"
  ],
  blockers: [
    "CommsPanel cannot ship until /api/comms shape is locked.",
    "Comm.body → Comm.message rename not propagated to frontend."
  ],
  waiting: [
    "Mannan waits on Prabh for the Comms list contract.",
    "Prabh waits on Adhiraj for the httpOnly auth middleware.",
    "Kartikeya waits on Adhiraj for GET /api/me cache freshness."
  ],
  deployTruth: [
    "prod: main@8f42c1a live",
    "staging: feat/dashboard-cards is 3 commits behind",
    "preview: feat/comms-routes failed schema smoke tests"
  ],
  safeToTouch: [
    "safe: src/pages/Dashboard.tsx",
    "watch: src/components/CommsPanel.tsx",
    "blocked: src/types/comms.ts and server/middleware/auth.py"
  ],
  todoFixme: [
    "FIXME src/components/CommsPanel.tsx:88 swap fixture comms to live query",
    "TODO server/routes/comms.py:142 add auth middleware",
    "HACK src/lib/auth.ts:31 bearer fallback during cookie migration"
  ],
  agentActivity: [
    "Claude flagged Comm.body -> Comm.message mismatch.",
    "Cursor route smoke check failed on preview schema.",
    "Socrates captured auth cookie migration decision."
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function toolIcon(tool: Tool) {
  if (tool === "vscode") return <TbBrandVscode className="h-3.5 w-3.5" strokeWidth={1.5} />;
  if (tool === "claude") return <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />;
  return <TbTerminal2 className="h-3.5 w-3.5" strokeWidth={1.5} />;
}

function toolLabel(tool: Tool) {
  if (tool === "vscode") return "VS Code";
  if (tool === "claude") return "Claude agent";
  return "Cursor";
}

function roleAccent(role: DevRole) {
  if (role === "frontend") return TEAL;
  if (role === "backend") return ORANGE;
  return PURPLE;
}

function staleLabel(min: number) {
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function devById(devs: Dev[], id: string) {
  return devs.find((d) => d.id === id);
}

const containerStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease } }
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Animated number — springs from 0 to value on mount
// ───────────────────────────────────────────────────────────────────────────

function Sparkline({
  values,
  color,
  width = 88,
  height = 22,
  fill = true
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const step = width / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * (height - 4) - 2).toFixed(1)}`);
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `${linePath} L ${(values.length - 1) * step},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {fill ? <path d={areaPath} fill={color} fillOpacity={0.12} /> : null}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease }}
      />
      <circle
        cx={(values.length - 1) * step}
        cy={height - (values[values.length - 1] / max) * (height - 4) - 2}
        r={2}
        fill={color}
      />
    </svg>
  );
}

function AnimatedNumber({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 110, damping: 22, mass: 0.6 });
  const rounded = useTransform(spring, (v) => Math.round(v).toString());
  const [text, setText] = useState("0");
  useEffect(() => {
    const unsub = rounded.on("change", (v) => setText(v));
    mv.set(value);
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);
  return <span>{text}</span>;
}

// ───────────────────────────────────────────────────────────────────────────
// Avatar — initials disc with the dev's brand colour
// ───────────────────────────────────────────────────────────────────────────

function Initial({ dev, size = 32 }: { dev?: Dev; size?: number }) {
  if (!dev) return null;
  return (
    <span
      aria-label={dev.name}
      title={dev.name}
      className="inline-flex items-center justify-center rounded-full font-sans"
      style={{
        width: size,
        height: size,
        background: `${dev.color}1A`,
        color: dev.color,
        fontSize: Math.round(size * 0.42),
        border: `1px solid ${dev.color}55`
      }}
    >
      {dev.initials}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Contribution globe — drag-rotatable, with full-surface ownership color
// ───────────────────────────────────────────────────────────────────────────

function seedRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

interface GlobePoint { lon: number; lat: number; }
interface CoverageCell {
  id: string;
  color: string;
  points: GlobePoint[];
  opacity: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function angularDistance(lonA: number, latA: number, lonB: number, latB: number) {
  const toRad = Math.PI / 180;
  const aLat = latA * toRad;
  const bLat = latB * toRad;
  const dLon = (lonA - lonB) * toRad;
  const dot = Math.sin(aLat) * Math.sin(bLat) + Math.cos(aLat) * Math.cos(bLat) * Math.cos(dLon);
  return Math.acos(clamp(dot, -1, 1)) / toRad;
}

function generateCoverageCells(devs: Dev[]): CoverageCell[] {
  const cells: CoverageCell[] = [];
  const lonStep = 18;
  const latStep = 15;

  for (let lat = -90; lat < 90; lat += latStep) {
    for (let lon = -180; lon < 180; lon += lonStep) {
      const centerLon = lon + lonStep / 2;
      const centerLat = lat + latStep / 2;
      let owner = devs[0];
      let bestScore = Number.POSITIVE_INFINITY;

      for (const dev of devs) {
        const noise = (seedRandom(hashStr(`${lon}:${lat}:${dev.id}`))() - 0.5) * 20;
        const score = angularDistance(centerLon, centerLat, dev.lon, dev.lat) + noise - dev.inFlightFiles * 2.2;
        if (score < bestScore) {
          owner = dev;
          bestScore = score;
        }
      }

      cells.push({
        id: `${lon}:${lat}`,
        color: owner.color,
        opacity: 0.72 + Math.min(0.18, owner.inFlightFiles * 0.025),
        points: [
          { lon, lat },
          { lon: lon + lonStep, lat },
          { lon: lon + lonStep, lat: lat + latStep },
          { lon, lat: lat + latStep }
        ]
      });
    }
  }

  return cells;
}

function ContributionGlobe({ devs }: { devs: Dev[] }) {
  const size = 310;
  const r = 136;
  const cx = size / 2;
  const cy = size / 2;
  const TILT = 20;

  const [rot, setRot] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const dragRef = useRef({ x: 0, rot: 0 });
  const rotRef = useRef(0);
  rotRef.current = rot;

  const coverageCells = useMemo(() => generateCoverageCells(devs), [devs]);
  const total = devs.reduce((s, d) => s + d.inFlightFiles, 0) || 1;

  useEffect(() => {
    if (dragging) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setRot((r) => r + dt * 0.012);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const onDown = (clientX: number) => {
    setDragging(true);
    setHasInteracted(true);
    dragRef.current = { x: clientX, rot: rotRef.current };
  };
  const onMove = (clientX: number) => {
    if (!dragging) return;
    const dx = clientX - dragRef.current.x;
    setRot(dragRef.current.rot + dx * 0.6);
  };
  const onUp = () => setDragging(false);

  const tilt = (TILT * Math.PI) / 180;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const project = (lon: number, lat: number) => {
    const lonR = ((lon + rot) * Math.PI) / 180;
    const latR = (lat * Math.PI) / 180;
    const cosLat = Math.cos(latR);
    const x = cosLat * Math.sin(lonR);
    const y = Math.sin(latR);
    const z = cosLat * Math.cos(lonR);
    const y2 = y * cosT - z * sinT;
    const z2 = y * sinT + z * cosT;
    return { sx: cx + x * r, sy: cy - y2 * r, z: z2 };
  };

  const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
  const parallels = [-60, -30, 0, 30, 60];

  // continent contribution percentages
  const devShares = devs.map((d) => ({ ...d, pct: Math.round((d.inFlightFiles / total) * 100) }));

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size + 46, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
      onMouseDown={(e) => onDown(e.clientX)}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onUp}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="contribution globe, drag to rotate"
      >
        <defs>
          <linearGradient id="globeField" x1="10%" y1="8%" x2="92%" y2="95%">
            {devs.map((d, i) => (
              <stop
                key={`field-${d.id}`}
                offset={`${(i / Math.max(1, devs.length - 1)) * 100}%`}
                stopColor={d.color}
              />
            ))}
          </linearGradient>
          <radialGradient id="globeShade" cx="65%" cy="68%" r="55%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(26,22,18,0.18)" />
          </radialGradient>
          <radialGradient id="globeHighlight" cx="30%" cy="24%" r="58%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="52%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <clipPath id="globeClip">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>

        {/* sphere */}
        <circle cx={cx} cy={cy} r={r} fill="url(#globeField)" stroke={HAIR_STRONG} strokeWidth={1.2} />

        {/* contribution surface */}
        <g clipPath="url(#globeClip)">
          {coverageCells.map((cell) => {
            const projected = cell.points.map((p) => project(p.lon, p.lat));
            const avgZ = projected.reduce((s, p) => s + p.z, 0) / projected.length;
            if (avgZ < -0.3) return null;
            const depth = clamp((avgZ + 0.3) / 1.3, 0, 1);
            const path =
              projected
                .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
                .join(" ") + " Z";
            return (
              <path
                key={cell.id}
                d={path}
                fill={cell.color}
                opacity={cell.opacity * (0.74 + depth * 0.28)}
                stroke={cell.color}
                strokeOpacity={0.5}
                strokeWidth={0.7}
                strokeLinejoin="round"
              />
            );
          })}
        </g>

        {/* graticule — meridians */}
        {meridians.map((L) => {
          const pts: { sx: number; sy: number; z: number }[] = [];
          for (let lat = -90; lat <= 90; lat += 6) pts.push(project(L, lat));
          const visible = pts.filter((p) => p.z > -0.05);
          if (visible.length < 2) return null;
          const path = visible
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
            .join(" ");
          return <path key={`m${L}`} d={path} stroke="rgba(255,255,255,0.48)" strokeWidth={0.65} fill="none" opacity={0.8} />;
        })}

        {/* graticule — parallels */}
        {parallels.map((lat) => {
          const pts: { sx: number; sy: number; z: number }[] = [];
          for (let lon = -180; lon <= 180; lon += 6) pts.push(project(lon, lat));
          const visible = pts.filter((p) => p.z > -0.05);
          if (visible.length < 2) return null;
          const path = visible
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
            .join(" ");
          return <path key={`pa${lat}`} d={path} stroke="rgba(255,255,255,0.48)" strokeWidth={0.65} fill="none" opacity={0.8} />;
        })}

        {/* lighting */}
        <circle cx={cx} cy={cy} r={r} fill="url(#globeShade)" pointerEvents="none" />
        <circle cx={cx} cy={cy} r={r} fill="url(#globeHighlight)" pointerEvents="none" />

        {/* team labels */}
        {/* dev landmark balls (size scales with in-flight files) */}
        {devs.map((d) => {
          const p = project(d.lon, d.lat);
          const radius = 5 + d.inFlightFiles * 0.55;
          const depthOpacity = clamp((p.z + 0.45) / 1.45, 0.46, 1);
          const labelRight = p.sx < cx + 4;
          const labelX = labelRight ? clamp(p.sx + radius + 9, 18, size - 74) : clamp(p.sx - radius - 9, 74, size - 18);
          const labelY = clamp(p.sy - radius - 5, 16, size - 18);
          const anchor = labelRight ? "start" : "end";
          return (
            <g key={`lm-${d.id}`}>
              <line
                x1={p.sx}
                y1={p.sy}
                x2={labelX}
                y2={labelY - 3}
                stroke="rgba(255,255,255,0.72)"
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={depthOpacity}
              />
              <circle
                cx={p.sx}
                cy={p.sy}
                r={radius}
                fill={d.color}
                stroke="#fff"
                strokeWidth={2}
                opacity={0.42 + depthOpacity * 0.53}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                fontSize="10.5"
                fontWeight={700}
                fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                fill={INK}
                stroke="rgba(255,255,255,0.88)"
                strokeWidth={3}
                paintOrder="stroke"
                opacity={depthOpacity}
              >
                {d.name}
              </text>
              <text
                x={labelX}
                y={labelY + 11}
                textAnchor={anchor}
                fontSize="8"
                fontFamily="Geist Mono, ui-monospace, monospace"
                fill={INK}
                opacity={0.42 + depthOpacity * 0.34}
              >
                {d.inFlightFiles} files
              </text>
            </g>
          );
        })}

      </svg>

      {/* legend */}
      <div
        className="absolute inset-x-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[10px] border bg-white/88 px-2.5 py-1.5 font-mono text-[10px] leading-none backdrop-blur"
        style={{ borderColor: HAIR, color: MUTED, bottom: 0 }}
      >
        {devShares.map((d) => (
          <span key={d.id} className="flex items-center gap-1">
            <TbCircleFilled style={{ color: d.color }} className="h-2 w-2" />
            {d.name.toLowerCase()} · <span style={{ color: INK }}>{d.pct}%</span>
          </span>
        ))}
      </div>

      {/* drag hint */}
      <AnimatePresence>
        {!hasInteracted ? (
          <motion.span
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [-4, 4, -4] }}
            exit={{ opacity: 0 }}
            transition={{ x: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
            className="absolute right-0 top-0 rounded-full border bg-white px-2 py-0.5 font-mono text-[9px]"
            style={{ borderColor: HAIR, color: MUTED }}
          >
            drag ↔
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Hero — Live Work Map: presence cards + collision radar
// ───────────────────────────────────────────────────────────────────────────

function PresenceCard({ dev, onAsk }: { dev: Dev; onAsk: (p: string) => void }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(26,22,18,0.06)" }}
      transition={{ duration: 0.24, ease }}
      className="flex min-w-[240px] flex-1 flex-col gap-3 rounded-[12px] border bg-white p-4"
      style={{ borderColor: HAIR }}
    >
      <div className="flex items-center gap-3">
        <Initial dev={dev} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[14px]" style={{ color: INK }}>{dev.name}</span>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex h-1.5 w-1.5 rounded-full"
              aria-label={dev.status === "live" ? "live" : "idle"}
              style={{ background: dev.status === "live" ? TEAL : MUTED }}
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: MUTED }}>
            {toolIcon(dev.tool)}
            <span>{toolLabel(dev.tool)}</span>
            <span>·</span>
            <span>{staleLabel(dev.staleMin)}</span>
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-sans text-[10px]"
          style={{ background: `${roleAccent(dev.role)}14`, color: roleAccent(dev.role) }}
        >
          {dev.role}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: INK }}>
          <TbCode className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: MUTED }} />
          <span className="truncate">{dev.activeFile}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: MUTED }}>
          <TbGitBranch className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="truncate">{dev.branch}</span>
          <span className="ml-auto">{dev.inFlightFiles} in flight</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onAsk(`Summarise what ${dev.name} is doing on ${dev.branch} and whether it intersects my work.`)
        }
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[11px] transition-colors hover:bg-[#FAF8F5]"
        style={{ borderColor: HAIR, color: MUTED }}
      >
        <TbMessage2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        ask socrates about {dev.name.toLowerCase()}
      </button>
    </motion.article>
  );
}

function CollisionRow({ alert, devs, onAsk }: { alert: CollisionAlert; devs: Dev[]; onAsk: (p: string) => void }) {
  const [a, b] = alert.parties.map((id) => devById(devs, id));
  const accent = alert.severity === "blocking" ? RUST : ORANGE;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 2 }}
      className="flex flex-wrap items-center gap-3 rounded-[10px] border bg-white px-3 py-2.5"
      style={{ borderColor: HAIR }}
    >
      <motion.span
        animate={alert.severity === "blocking" ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: `${accent}14`, color: accent }}
      >
        <TbAlertTriangle className="h-4 w-4" strokeWidth={1.5} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 font-sans text-[13px]" style={{ color: INK }}>
          <span>{alert.message}</span>
          <span className="font-mono text-[12px]">{alert.mono}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
          <Initial dev={a} size={16} />
          <span>{a?.name}</span>
          <TbArrowsRightLeft className="h-3 w-3" strokeWidth={1.5} />
          <Initial dev={b} size={16} />
          <span>{b?.name}</span>
          <span className="ml-2" style={{ color: accent }}>{alert.severity}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAsk(alert.askPrompt)}
        className="rounded-[8px] px-3 py-1.5 font-sans text-[12px] text-white transition-opacity hover:opacity-90"
        style={{ background: accent }}
      >
        ask agent
      </button>
    </motion.div>
  );
}

function Hero({
  devs,
  alerts,
  onAsk,
  onFetchContext
}: {
  devs: Dev[];
  alerts: CollisionAlert[];
  onAsk: (p: string) => void;
  onFetchContext: () => void;
}) {
  return (
    <section
      className="rounded-[14px] border p-6"
      style={{ borderColor: HAIR, background: "linear-gradient(180deg, #FFFFFF 0%, #FBF7F1 100%)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
            LIVE WORK MAP
          </p>
          <h1 className="mt-2 font-sans text-[32px] leading-[1.1]" style={{ color: INK }}>
            Northstar Cloud, right now
          </h1>
          <p className="mt-2 max-w-[560px] font-sans text-[14px] leading-6" style={{ color: MUTED }}>
            Who's touching what, what's real, where you're about to collide. Streaming from each
            teammate's editor and agent context.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFetchContext}
            className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 font-sans text-[13px] text-white"
            style={{ background: RUST }}
          >
            <TbRefresh className="h-4 w-4" strokeWidth={1.5} />
            fetch team context
          </motion.button>
          <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: TEAL }}
            />
            streaming · synced 8s ago
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-3"
        >
          {devs.map((d) => (
            <PresenceCard key={d.id} dev={d} onAsk={onAsk} />
          ))}
        </motion.div>
        <div className="hidden items-center justify-center lg:flex">
          <ContributionGlobe devs={devs} />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
          <TbActivity className="h-3.5 w-3.5" strokeWidth={1.5} />
          COLLISION RADAR · {alerts.length} LIVE
        </div>
        <motion.div variants={containerStagger} initial="hidden" animate="show" className="space-y-2">
          {alerts.map((alert) => (
            <CollisionRow key={alert.id} alert={alert} devs={devs} onAsk={onAsk} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Health stats strip — between hero and Band 2
// ───────────────────────────────────────────────────────────────────────────

function StatsStrip({
  registry,
  seams,
  conflicts,
  decisions
}: {
  registry: RegistryEntry[];
  seams: IntegrationSeam[];
  conflicts: ConflictItem[];
  decisions: DecisionEntry[];
}) {
  const real = registry.filter((r) => r.status === "real").length;
  const readiness = Math.round((real / registry.length) * 100);
  const openSeams = seams.filter((s) => s.status !== "connected").length;
  const blocking = conflicts.filter((c) => c.severity === "blocking").length;
  const decided24h = decisions.filter((d) => /min ago|h ago/.test(d.ts)).length;

  const tiles = [
    {
      key: "readiness",
      label: "real coverage",
      value: readiness,
      suffix: "%",
      accent: TEAL,
      bar: readiness,
      help: `${real} of ${registry.length} entities are real`
    },
    {
      key: "seams",
      label: "open seams",
      value: openSeams,
      suffix: "",
      accent: ORANGE,
      bar: Math.min(100, openSeams * 33),
      help: "waiting or conflicting integrations"
    },
    {
      key: "blocking",
      label: "blocking conflicts",
      value: blocking,
      suffix: "",
      accent: RUST,
      bar: Math.min(100, blocking * 40),
      help: "must resolve before merge"
    },
    {
      key: "decisions",
      label: "decisions today",
      value: decided24h,
      suffix: "",
      accent: PURPLE,
      bar: Math.min(100, decided24h * 25),
      help: "captured from agent + IDE context"
    }
  ];

  return (
    <motion.section
      variants={containerStagger}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="project health stats"
    >
      {tiles.map((t) => (
        <motion.div
          key={t.key}
          variants={fadeUp}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-[12px] border bg-white p-4"
          style={{ borderColor: HAIR }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              {t.label.toUpperCase()}
            </p>
            <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-sans text-[28px] leading-none" style={{ color: INK }}>
              <AnimatedNumber value={t.value} />
            </span>
            {t.suffix ? (
              <span className="font-sans text-[14px]" style={{ color: MUTED }}>
                {t.suffix}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-sans text-[11px]" style={{ color: MUTED }}>{t.help}</p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: HAIR }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${t.bar}%` }}
              transition={{ duration: 0.9, ease, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: t.accent }}
            />
          </div>
        </motion.div>
      ))}
    </motion.section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Mock vs Real registry — bar viz, filter counts, sort, expandable rows
// ───────────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<RegistryStatus, { fg: string; bg: string; border: string; label: string }> = {
  real:    { fg: TEAL,   bg: `${TEAL}14`,   border: `${TEAL}55`,   label: "real"    },
  mocked:  { fg: ORANGE, bg: `${ORANGE}14`, border: `${ORANGE}55`, label: "mocked"  },
  partial: { fg: ORANGE, bg: "transparent", border: `${ORANGE}88`, label: "partial" },
  assumed: { fg: RUST,   bg: `${RUST}10`,   border: `${RUST}55`,   label: "assumed" }
};

function StatusPill({ status }: { status: RegistryStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
    >
      <TbCircleFilled className="h-2 w-2" />
      {s.label}
    </span>
  );
}

function TypeTag({ type }: { type: EntityType }) {
  const label = type === "endpoint" ? "endpoint" : type === "model" ? "model" : "component";
  return (
    <span
      className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
      style={{ background: "#F1ECE4", color: MUTED }}
    >
      {label}
    </span>
  );
}

function RegistryStatusBar({ registry }: { registry: RegistryEntry[] }) {
  const counts: Record<RegistryStatus, number> = {
    real: registry.filter((r) => r.status === "real").length,
    partial: registry.filter((r) => r.status === "partial").length,
    mocked: registry.filter((r) => r.status === "mocked").length,
    assumed: registry.filter((r) => r.status === "assumed").length
  };
  const total = registry.length || 1;
  const order: RegistryStatus[] = ["real", "partial", "mocked", "assumed"];

  return (
    <div>
      <div
        className="flex h-2 w-full overflow-hidden rounded-full"
        style={{ background: HAIR }}
        aria-label="status breakdown"
      >
        {order.map((s) => {
          const w = (counts[s] / total) * 100;
          if (w === 0) return null;
          return (
            <motion.span
              key={s}
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ duration: 0.8, ease, delay: 0.05 }}
              style={{ background: STATUS_STYLE[s].fg }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px]" style={{ color: MUTED }}>
        {order.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[s].fg }} />
            <span>{STATUS_STYLE[s].label}</span>
            <span style={{ color: INK }}>{counts[s]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type RegistrySort = "default" | "status" | "type" | "owner" | "recent";

function RegistryPanel({
  registry,
  devs,
  onAsk
}: {
  registry: RegistryEntry[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | RegistryStatus>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RegistrySort>("default");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const counts = useMemo(
    () => ({
      all: registry.length,
      real: registry.filter((r) => r.status === "real").length,
      mocked: registry.filter((r) => r.status === "mocked").length,
      partial: registry.filter((r) => r.status === "partial").length,
      assumed: registry.filter((r) => r.status === "assumed").length
    }),
    [registry]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = registry.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (r.note ?? "").toLowerCase().includes(q);
    });

    const sorted = [...base];
    if (sort === "status") {
      const order: Record<RegistryStatus, number> = { real: 0, partial: 1, mocked: 2, assumed: 3 };
      sorted.sort((a, b) => order[a.status] - order[b.status]);
    } else if (sort === "type") {
      sorted.sort((a, b) => a.type.localeCompare(b.type));
    } else if (sort === "owner") {
      sorted.sort((a, b) => a.ownerId.localeCompare(b.ownerId));
    } else if (sort === "recent") {
      const w = (s?: string) => {
        if (!s) return 9999;
        if (/just/.test(s)) return 0;
        const m = s.match(/(\d+)\s*(min|m|h|d)/i);
        if (!m) return 9999;
        const n = parseInt(m[1], 10);
        const unit = m[2].toLowerCase();
        return unit.startsWith("d") ? n * 1440 : unit.startsWith("h") ? n * 60 : n;
      };
      sorted.sort((a, b) => w(a.lastChange) - w(b.lastChange));
    }
    return sorted;
  }, [registry, filter, query, sort]);

  const mockedCount = counts.mocked + counts.assumed;

  const tabs: Array<{ k: "all" | RegistryStatus; label: string; count: number; accent?: string }> = [
    { k: "all", label: "all", count: counts.all },
    { k: "real", label: "real", count: counts.real, accent: TEAL },
    { k: "mocked", label: "mocked", count: counts.mocked, accent: ORANGE },
    { k: "partial", label: "partial", count: counts.partial, accent: ORANGE },
    { k: "assumed", label: "assumed", count: counts.assumed, accent: RUST }
  ];

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              MOCK VS REAL
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              What's actually wired up
            </h2>
            <p className="mt-0.5 font-sans text-[12px]" style={{ color: MUTED }}>
              <span style={{ color: INK }}>
                <AnimatedNumber value={mockedCount} />
              </span>{" "}
              of {registry.length} still mocked or assumed.
            </p>
          </div>
          <div className="relative w-full max-w-[280px]">
            <TbSearch
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ color: MUTED }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search endpoints, models, components"
              className="w-full rounded-[8px] border bg-white py-1.5 pl-7 pr-2 font-mono text-[11px] outline-none placeholder:text-[#A09790]"
              style={{ borderColor: HAIR, color: INK }}
            />
          </div>
        </div>

        <div className="mt-4">
          <RegistryStatusBar registry={registry} />
        </div>
      </header>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderBottom: `1px solid ${HAIR}` }}
      >
        {tabs.map((t) => {
          const active = filter === t.k;
          const accent = t.accent ?? RUST;
          return (
            <motion.button
              key={t.k}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(t.k)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors"
              style={{
                background: active ? `${accent}14` : "transparent",
                color: active ? accent : MUTED,
                border: `1px solid ${active ? `${accent}55` : HAIR}`
              }}
            >
              <span>{t.label}</span>
              <span
                className="rounded-full px-1.5 font-mono text-[10px]"
                style={{
                  background: active ? `${accent}22` : "#F1ECE4",
                  color: active ? accent : MUTED
                }}
              >
                {t.count}
              </span>
            </motion.button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <label
            className="hidden items-center gap-1.5 font-mono text-[10px] sm:flex"
            style={{ color: MUTED }}
          >
            sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as RegistrySort)}
              className="rounded-[6px] border bg-white px-1.5 py-0.5 font-mono text-[10px] outline-none"
              style={{ borderColor: HAIR, color: INK }}
            >
              <option value="default">default</option>
              <option value="status">by status</option>
              <option value="type">by type</option>
              <option value="owner">by owner</option>
              <option value="recent">most recent</option>
            </select>
          </label>
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>
            {filtered.length} shown
          </span>
        </div>
      </div>

      <motion.ul variants={containerStagger} initial="hidden" animate="show">
        <AnimatePresence initial={false}>
          {filtered.map((entry, i) => {
            const owner = devById(devs, entry.ownerId);
            const isOpen = !!expanded[entry.id];
            return (
              <motion.li
                key={entry.id}
                layout
                variants={fadeUp}
                exit={{ opacity: 0, y: -4 }}
                style={{ borderBottom: i === filtered.length - 1 ? "none" : `1px solid ${HAIR}` }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded((s) => ({ ...s, [entry.id]: !s[entry.id] }))}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#FAF8F5]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeTag type={entry.type} />
                      <span className="truncate font-mono text-[13px]" style={{ color: INK }}>
                        {entry.name}
                      </span>
                      {entry.lastChange ? (
                        <span
                          className="flex items-center gap-1 font-mono text-[10px]"
                          style={{ color: MUTED }}
                        >
                          <TbClock className="h-3 w-3" strokeWidth={1.5} />
                          {entry.lastChange}
                        </span>
                      ) : null}
                    </div>
                    {entry.note ? (
                      <p className="mt-0.5 truncate font-sans text-[12px]" style={{ color: MUTED }}>
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                  <Initial dev={owner} size={24} />
                  <StatusPill status={entry.status} />
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease }}
                    className="text-[#A09790]"
                  >
                    <TbChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="exp"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease }}
                      className="overflow-hidden"
                    >
                      <div
                        className="grid gap-3 px-5 py-3 sm:grid-cols-[1fr_auto]"
                        style={{ background: "#FBF7F1", borderTop: `1px solid ${HAIR}` }}
                      >
                        <div className="min-w-0">
                          <p
                            className="font-mono text-[10px] tracking-[0.16em]"
                            style={{ color: MUTED }}
                          >
                            CONSUMERS
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {(entry.consumers ?? []).map((c) => (
                              <li
                                key={c}
                                className="truncate font-mono text-[11px]"
                                style={{ color: INK }}
                              >
                                {c}
                              </li>
                            ))}
                            {(entry.consumers ?? []).length === 0 ? (
                              <li className="font-mono text-[11px]" style={{ color: MUTED }}>
                                no consumers indexed
                              </li>
                            ) : null}
                          </ul>
                        </div>
                        <div className="flex flex-row gap-2 self-start sm:flex-col sm:items-end">
                          <button
                            type="button"
                            onClick={() => onAsk(entry.askPrompt)}
                            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 font-sans text-[11px] text-white"
                            style={{ background: RUST }}
                          >
                            <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                            ask agent
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onAsk(`Make ${entry.name} real: list the smallest set of changes to flip its status from ${entry.status} to real.`)
                            }
                            className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[11px]"
                            style={{ borderColor: HAIR, color: INK }}
                          >
                            <TbBolt className="h-3.5 w-3.5" strokeWidth={1.5} />
                            make real
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 ? (
          <li className="px-5 py-10 text-center font-sans text-[13px]" style={{ color: MUTED }}>
            nothing matches that filter.
          </li>
        ) : null}
      </motion.ul>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Conflict radar — severity counts + expandable suggested fix
// ───────────────────────────────────────────────────────────────────────────

function ConflictCard({
  item,
  devs,
  onAsk
}: {
  item: ConflictItem;
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const accent = item.severity === "blocking" ? RUST : ORANGE;
  const [a, b] = item.parties.map((id) => devById(devs, id));
  const kindLabel = {
    "overlap-edit": "overlapping edits",
    "divergent-branch": "branch drift",
    "duplicate-util": "duplicate work",
    "renamed-field": "field mismatch"
  }[item.kind];

  return (
    <motion.article
      variants={fadeUp}
      layout
      className="relative overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: HAIR }}
    >
      {item.severity === "blocking" ? (
        <motion.span
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: accent }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accent }} />
      )}
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAF8F5]"
      >
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: `${accent}14`, color: accent }}
        >
          <TbGitFork className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[13px]" style={{ color: INK }}>
              {item.title}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: `${accent}10`, color: accent }}
            >
              {kindLabel}
            </span>
          </div>
          <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: MUTED }}>
            {item.detail}
          </p>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
            <Initial dev={a} size={16} />
            <span>{a?.name}</span>
            <TbArrowsRightLeft className="h-3 w-3" strokeWidth={1.5} />
            <Initial dev={b} size={16} />
            <span>{b?.name}</span>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease }}
          className="self-center text-[#A09790]"
        >
          <TbChevronDown className="h-4 w-4" strokeWidth={1.5} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="exp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3"
              style={{ background: "#FBF7F1", borderTop: `1px solid ${HAIR}` }}
            >
              {item.suggestedFix ? (
                <>
                  <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
                    SUGGESTED FIX
                  </p>
                  <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: INK }}>
                    {item.suggestedFix}
                  </p>
                </>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onAsk(item.askPrompt)}
                  className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[11px]"
                  style={{ borderColor: HAIR, color: INK }}
                >
                  <TbMessage2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  walk me through
                </button>
                <button
                  type="button"
                  onClick={() => onAsk(`Open a PR that resolves: ${item.title}`)}
                  className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 font-sans text-[11px] text-white"
                  style={{ background: accent }}
                >
                  <TbBolt className="h-3.5 w-3.5" strokeWidth={1.5} />
                  draft PR
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function ConflictRadar({
  conflicts,
  devs,
  onAsk
}: {
  conflicts: ConflictItem[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  type Kind = "all" | ConflictKind;
  const [kind, setKind] = useState<Kind>("all");

  const blocking = conflicts.filter((c) => c.severity === "blocking").length;
  const watch = conflicts.filter((c) => c.severity === "watch").length;

  const kinds: { k: Kind; label: string }[] = [
    { k: "all", label: "all" },
    { k: "overlap-edit", label: "overlap" },
    { k: "renamed-field", label: "rename" },
    { k: "duplicate-util", label: "dupe" },
    { k: "divergent-branch", label: "drift" }
  ];

  const filtered = useMemo(
    () => (kind === "all" ? conflicts : conflicts.filter((c) => c.kind === kind)),
    [conflicts, kind]
  );

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              CONFLICT RADAR
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              Where you'll trip
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px]"
              style={{ background: `${RUST}10`, color: RUST }}
            >
              <TbCircleFilled className="h-2 w-2" />
              <AnimatedNumber value={blocking} /> blocking
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px]"
              style={{ background: `${ORANGE}10`, color: ORANGE }}
            >
              <TbCircleFilled className="h-2 w-2" />
              <AnimatedNumber value={watch} /> watch
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kinds.map((k) => {
            const active = kind === k.k;
            return (
              <motion.button
                key={k.k}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setKind(k.k)}
                className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
                style={{
                  background: active ? `${RUST}14` : "transparent",
                  color: active ? RUST : MUTED,
                  border: `1px solid ${active ? `${RUST}55` : HAIR}`
                }}
              >
                {k.label}
              </motion.button>
            );
          })}
        </div>
      </header>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="space-y-2 p-4"
      >
        <AnimatePresence initial={false}>
          {filtered.map((c) => (
            <ConflictCard key={c.id} item={c} devs={devs} onAsk={onAsk} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px]" style={{ color: MUTED }}>
            no conflicts of this kind. nice.
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Integration seams — animated SVG connectors + schema diff peek
// ───────────────────────────────────────────────────────────────────────────

const SEAM_STYLE: Record<SeamStatus, { fg: string; bg: string; border: string; label: string }> = {
  connected:   { fg: TEAL,   bg: `${TEAL}14`,   border: `${TEAL}55`,   label: "connected"   },
  waiting:     { fg: ORANGE, bg: `${ORANGE}14`, border: `${ORANGE}55`, label: "waiting"     },
  conflicting: { fg: RUST,   bg: `${RUST}14`,   border: `${RUST}55`,   label: "conflicting" }
};

function SeamConnector({ status, color }: { status: SeamStatus; color: string }) {
  if (status === "connected") {
    return (
      <svg width="64" height="20" viewBox="0 0 64 20" className="flex-shrink-0">
        <line x1="0" y1="10" x2="64" y2="10" stroke={color} strokeWidth="2" />
        <motion.circle
          r="3"
          fill={color}
          cy={10}
          animate={{ cx: [0, 64] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    );
  }
  if (status === "waiting") {
    return (
      <svg width="64" height="20" viewBox="0 0 64 20" className="flex-shrink-0">
        <motion.line
          x1="0"
          y1="10"
          x2="64"
          y2="10"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="6 6"
          animate={{ strokeDashoffset: [0, -12] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    );
  }
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" className="flex-shrink-0">
      <motion.line
        x1="0"
        y1="10"
        x2="64"
        y2="10"
        stroke={color}
        strokeWidth="2"
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d="M 28 5 L 28 15 M 32 5 L 36 15" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function SchemaDiff({ fe, be }: { fe: string[]; be: string[] }) {
  const feSet = new Set(fe);
  const beSet = new Set(be);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
          FRONTEND READS
        </p>
        <ul className="mt-1 space-y-0.5">
          {fe.map((f) => (
            <li
              key={`fe-${f}`}
              className="font-mono text-[11px]"
              style={{ color: beSet.has(f) ? INK : RUST }}
            >
              {beSet.has(f) ? f : `${f}  ⨯ missing on backend`}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
          BACKEND RETURNS
        </p>
        <ul className="mt-1 space-y-0.5">
          {be.map((f) => (
            <li
              key={`be-${f}`}
              className="font-mono text-[11px]"
              style={{ color: feSet.has(f) ? INK : ORANGE }}
            >
              {feSet.has(f) ? f : `${f}  • not used by FE`}
            </li>
          ))}
          {be.length === 0 ? (
            <li className="font-mono text-[11px]" style={{ color: MUTED }}>
              (nothing yet)
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function SeamCard({
  seam,
  devs,
  onAsk
}: {
  seam: IntegrationSeam;
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const s = SEAM_STYLE[seam.status];
  const fe = devById(devs, seam.frontend.ownerId);
  const be = devById(devs, seam.backend.ownerId);
  const lineColor = s.fg;

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      layout
      className="overflow-hidden rounded-[12px] border bg-white"
      style={{ borderColor: HAIR }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[13px]" style={{ color: INK }}>
              {seam.feature}
            </span>
            {seam.lastSync ? (
              <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                · {seam.lastSync}
              </span>
            ) : null}
          </div>
          <span
            className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
            style={{ color: s.fg, background: s.bg, borderColor: s.border }}
          >
            {s.label}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
              <Initial dev={fe} size={18} />
              <span className="truncate">{fe?.name} · frontend</span>
            </div>
            <div className="mt-1 truncate font-mono text-[12px]" style={{ color: INK }}>
              {seam.frontend.contract}
            </div>
          </div>

          <SeamConnector status={seam.status} color={lineColor} />

          <div className="min-w-0 text-right">
            <div className="flex items-center justify-end gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
              <span className="truncate">backend · {be?.name}</span>
              <Initial dev={be} size={18} />
            </div>
            <div className="mt-1 truncate font-mono text-[12px]" style={{ color: INK }}>
              {seam.backend.contract}
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          {seam.feSchema || seam.beSchema ? (
            <button
              type="button"
              onClick={() => setOpen((x) => !x)}
              className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 font-sans text-[11px]"
              style={{ borderColor: HAIR, color: INK }}
            >
              <TbWaveSine className="h-3.5 w-3.5" strokeWidth={1.5} />
              {open ? "hide diff" : "peek diff"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onAsk(seam.askPrompt)}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 font-sans text-[11px] text-white"
            style={{ background: s.fg }}
          >
            <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            ask agent
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="diff"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3"
              style={{ background: "#FBF7F1", borderTop: `1px solid ${HAIR}` }}
            >
              <SchemaDiff fe={seam.feSchema ?? []} be={seam.beSchema ?? []} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function IntegrationSeamsPanel({
  seams,
  devs,
  onAsk
}: {
  seams: IntegrationSeam[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  type Filter = "all" | SeamStatus;
  const [filter, setFilter] = useState<Filter>("all");

  const connected = seams.filter((s) => s.status === "connected").length;
  const conflicting = seams.filter((s) => s.status === "conflicting").length;
  const waiting = seams.filter((s) => s.status === "waiting").length;
  const total = seams.length;
  const pct = Math.round((connected / Math.max(1, total)) * 100);
  const stableLong = seams.filter((s) => /stable for/.test(s.lastSync ?? "")).length;

  // synthetic 7-day stability trend
  const trend = useMemo(() => [62, 58, 65, 70, 64, 68, pct], [pct]);

  const tabs: Array<{ k: Filter; label: string; count: number; accent: string }> = [
    { k: "all", label: "all", count: total, accent: MUTED },
    { k: "connected", label: "connected", count: connected, accent: TEAL },
    { k: "waiting", label: "waiting", count: waiting, accent: ORANGE },
    { k: "conflicting", label: "conflicting", count: conflicting, accent: RUST }
  ];

  const filtered = useMemo(
    () => (filter === "all" ? seams : seams.filter((s) => s.status === filter)),
    [seams, filter]
  );

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              INTEGRATION SEAMS
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              Where the halves meet
            </h2>
            <p className="mt-0.5 font-sans text-[12px]" style={{ color: MUTED }}>
              <span style={{ color: INK }}><AnimatedNumber value={stableLong} /></span> stable &gt;1 week ·{" "}
              <span style={{ color: RUST }}><AnimatedNumber value={conflicting} /></span> drifting
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px]" style={{ color: MUTED }}>CONNECTED · 7d</p>
            <div className="mt-0.5 flex items-center justify-end gap-2">
              <Sparkline values={trend} color={TEAL} width={80} height={22} />
              <p className="font-sans text-[18px]" style={{ color: INK }}>
                <AnimatedNumber value={pct} />%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: HAIR }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: TEAL }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const active = filter === t.k;
            return (
              <motion.button
                key={t.k}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(t.k)}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
                style={{
                  background: active ? `${t.accent}14` : "transparent",
                  color: active ? t.accent : MUTED,
                  border: `1px solid ${active ? `${t.accent}55` : HAIR}`
                }}
              >
                {t.label}
                <span
                  className="rounded-full px-1.5 font-mono text-[9px]"
                  style={{
                    background: active ? `${t.accent}22` : "#F1ECE4",
                    color: active ? t.accent : MUTED
                  }}
                >
                  {t.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </header>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="grid gap-3 p-4"
      >
        <AnimatePresence initial={false}>
          {filtered.map((seam) => (
            <SeamCard key={seam.id} seam={seam} devs={devs} onAsk={onAsk} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 ? (
          <p className="py-6 text-center font-sans text-[12px]" style={{ color: MUTED }}>
            no seams in this state.
          </p>
        ) : null}
      </motion.div>

      <footer
        className="flex items-center justify-between gap-3 px-5 py-3 font-mono text-[10px]"
        style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}
      >
        <span>
          {seams.length} seams · {waiting + conflicting} open
        </span>
        <button
          type="button"
          onClick={() => onAsk("List every integration seam and its blocking field-level differences.")}
          className="inline-flex items-center gap-1 hover:text-[color:var(--text-1)]"
          style={{ color: PURPLE }}
        >
          <TbSparkles className="h-3 w-3" strokeWidth={1.5} />
          audit every seam →
        </button>
      </footer>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Decisions log — tag filter, expandable detail, timeline
// ───────────────────────────────────────────────────────────────────────────

const DECISION_TAG_STYLE: Record<DecisionTag, { fg: string; bg: string; label: string }> = {
  decision:       { fg: PURPLE, bg: `${PURPLE}14`, label: "decision"     },
  "api-contract": { fg: PURPLE, bg: `${PURPLE}14`, label: "api-contract" },
  assumption:     { fg: PURPLE, bg: `${PURPLE}14`, label: "assumption"   }
};

type TimeBucket = "today" | "yesterday" | "this week" | "older";

function bucketOf(ts: string): TimeBucket {
  const t = ts.toLowerCase();
  if (/min ago|just|^\d+\s*h ago/.test(t)) return "today";
  if (t.includes("yesterday")) return "yesterday";
  if (/\d+\s*d ago/.test(t)) return "this week";
  return "older";
}

function DecisionsLog({
  decisions,
  devs
}: {
  decisions: DecisionEntry[];
  devs: Dev[];
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<"all" | DecisionTag>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: decisions.length,
      decision: decisions.filter((d) => d.tag === "decision").length,
      "api-contract": decisions.filter((d) => d.tag === "api-contract").length,
      assumption: decisions.filter((d) => d.tag === "assumption").length
    }),
    [decisions]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decisions.filter((d) => {
      if (tag !== "all" && d.tag !== tag) return false;
      if (!q) return true;
      return d.text.toLowerCase().includes(q) || d.tag.includes(q);
    });
  }, [decisions, query, tag]);

  const grouped = useMemo(() => {
    const order: TimeBucket[] = ["today", "yesterday", "this week", "older"];
    const map = new Map<TimeBucket, DecisionEntry[]>();
    order.forEach((k) => map.set(k, []));
    for (const d of filtered) map.get(bucketOf(d.ts))!.push(d);
    return order
      .map((k) => ({ key: k, items: map.get(k)! }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Decision-density trend (synthetic 7-day count)
  const trend = useMemo(() => {
    const base = [2, 1, 3, 2, 4, 2, counts.all];
    return base.map((v) => Math.max(1, v));
  }, [counts.all]);

  const topAuthor = useMemo(() => {
    const tally: Record<string, number> = {};
    decisions.forEach((d) => {
      tally[d.authorId] = (tally[d.authorId] ?? 0) + 1;
    });
    const winnerId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
    return winnerId ? devById(devs, winnerId) : undefined;
  }, [decisions, devs]);

  const tabs: Array<{ k: "all" | DecisionTag; label: string }> = [
    { k: "all", label: "all" },
    { k: "decision", label: "decision" },
    { k: "api-contract", label: "contract" },
    { k: "assumption", label: "assumption" }
  ];

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              DECISIONS & CONTRACTS
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              What we've already agreed
            </h2>
            <p className="mt-0.5 font-sans text-[12px]" style={{ color: MUTED }}>
              <span style={{ color: INK }}>
                <AnimatedNumber value={counts.all} />
              </span>{" "}
              captured across the project · top contributor{" "}
              <span style={{ color: INK }}>{topAuthor?.name ?? "—"}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px]" style={{ color: MUTED }}>
              7d
            </p>
            <Sparkline values={trend} color={PURPLE} width={86} height={22} />
          </div>
        </div>

        <div className="relative mt-3">
          <TbSearch
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            strokeWidth={1.5}
            style={{ color: MUTED }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search decisions"
            className="w-full rounded-[8px] border bg-white py-1.5 pl-7 pr-2 font-mono text-[11px] outline-none placeholder:text-[#A09790]"
            style={{ borderColor: HAIR, color: INK }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const active = tag === t.k;
            return (
              <motion.button
                key={t.k}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setTag(t.k)}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
                style={{
                  background: active ? `${PURPLE}14` : "transparent",
                  color: active ? PURPLE : MUTED,
                  border: `1px solid ${active ? `${PURPLE}55` : HAIR}`
                }}
              >
                {t.label}
                <span
                  className="rounded-full px-1.5 font-mono text-[9px]"
                  style={{
                    background: active ? `${PURPLE}22` : "#F1ECE4",
                    color: active ? PURPLE : MUTED
                  }}
                >
                  {counts[t.k]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </header>

      <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className="px-5 py-4"
      >
        {grouped.length === 0 ? (
          <p className="py-4 text-center font-sans text-[12px]" style={{ color: MUTED }}>
            nothing matches.
          </p>
        ) : null}
        {grouped.map((group, gi) => (
          <div key={group.key} className={gi === 0 ? "" : "mt-4"}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="font-mono text-[10px] tracking-[0.18em]"
                style={{ color: MUTED }}
              >
                {group.key.toUpperCase()}
              </span>
              <span className="h-px flex-1" style={{ background: HAIR }} />
              <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                {group.items.length}
              </span>
            </div>
            <ol className="relative pl-6">
              <span
                className="absolute left-[6px] top-1 bottom-1 w-px"
                style={{ background: HAIR }}
                aria-hidden
              />
              <AnimatePresence initial={false}>
                {group.items.map((d) => {
                  const author = devById(devs, d.authorId);
                  const t = DECISION_TAG_STYLE[d.tag];
                  const isOpen = openId === d.id;
                  const isHot = bucketOf(d.ts) === "today";
                  return (
                    <motion.li
                      key={d.id}
                      variants={fadeUp}
                      layout
                      exit={{ opacity: 0, x: -6 }}
                      className="relative mb-3 last:mb-0"
                    >
                      <motion.span
                        className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full border bg-white"
                        style={{ borderColor: PURPLE }}
                        animate={isHot ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : d.id)}
                        className="block w-full text-left"
                      >
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span
                            className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                            style={{ color: t.fg, background: t.bg }}
                          >
                            {t.label}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: MUTED }}>
                            <Initial dev={author} size={14} />
                            {author?.name} · {d.ts}
                          </span>
                          {d.affectedPaths && d.affectedPaths.length > 0 ? (
                            <span
                              className="ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                              style={{ background: "#F1ECE4", color: MUTED }}
                            >
                              affects {d.affectedPaths.length}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-sans text-[13px] leading-5" style={{ color: INK }}>
                          {d.text}
                        </p>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.div
                            key="exp"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease }}
                            className="overflow-hidden"
                          >
                            <div
                              className="mt-2 rounded-[8px] border p-3"
                              style={{ borderColor: HAIR, background: "#FBF7F1" }}
                            >
                              {d.context ? (
                                <p className="font-sans text-[12px] leading-5" style={{ color: INK }}>
                                  {d.context}
                                </p>
                              ) : null}
                              {d.affectedPaths && d.affectedPaths.length > 0 ? (
                                <div className="mt-2">
                                  <p
                                    className="font-mono text-[10px] tracking-[0.16em]"
                                    style={{ color: MUTED }}
                                  >
                                    AFFECTS
                                  </p>
                                  <ul className="mt-1 space-y-0.5">
                                    {d.affectedPaths.map((p) => (
                                      <li
                                        key={p}
                                        className="truncate font-mono text-[11px]"
                                        style={{ color: INK }}
                                      >
                                        {p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Fetch context preview — animated token count, copy, regen, compile pulse
// ───────────────────────────────────────────────────────────────────────────

const DEPLOY_STYLE: Record<DeployStatus, { fg: string; bg: string; label: string }> = {
  live: { fg: TEAL, bg: `${TEAL}14`, label: "live" },
  deploying: { fg: PURPLE, bg: `${PURPLE}14`, label: "deploying" },
  behind: { fg: ORANGE, bg: `${ORANGE}14`, label: "behind" },
  failed: { fg: RUST, bg: `${RUST}14`, label: "failed" }
};

const TOUCH_STYLE: Record<TouchRisk, { fg: string; bg: string; label: string }> = {
  safe: { fg: TEAL, bg: `${TEAL}14`, label: "safe" },
  watch: { fg: ORANGE, bg: `${ORANGE}14`, label: "watch" },
  blocked: { fg: RUST, bg: `${RUST}14`, label: "blocked" }
};

const WAIT_STYLE: Record<WaitingStatus, { fg: string; bg: string; label: string }> = {
  ready: { fg: TEAL, bg: `${TEAL}14`, label: "ready" },
  waiting: { fg: ORANGE, bg: `${ORANGE}14`, label: "waiting" },
  blocked: { fg: RUST, bg: `${RUST}14`, label: "blocked" }
};

const TODO_STYLE: Record<TodoPriority, { fg: string; bg: string; label: string }> = {
  low: { fg: TEAL, bg: `${TEAL}14`, label: "low" },
  medium: { fg: ORANGE, bg: `${ORANGE}14`, label: "medium" },
  high: { fg: RUST, bg: `${RUST}14`, label: "high" }
};

function BranchDeployTruthPanel({
  deploys,
  devs,
  onAsk
}: {
  deploys: BranchDeployTruth[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const liveCount = deploys.filter((d) => d.status === "live").length;
  const issueCount = deploys.filter((d) => d.status === "behind" || d.status === "failed").length;

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              BRANCH & DEPLOY TRUTH
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              What is actually live
            </h2>
          </div>
          <div className="text-right font-mono text-[10px]" style={{ color: MUTED }}>
            <span style={{ color: TEAL }}>{liveCount} live</span>
            <span> · </span>
            <span style={{ color: issueCount > 0 ? RUST : MUTED }}>{issueCount} needs attention</span>
          </div>
        </div>
      </header>

      <motion.div variants={containerStagger} initial="hidden" animate="show" className="divide-y" style={{ borderColor: HAIR }}>
        {deploys.map((deploy) => {
          const owner = devById(devs, deploy.ownerId);
          const s = DEPLOY_STYLE[deploy.status];
          return (
            <motion.button
              key={deploy.id}
              type="button"
              variants={fadeUp}
              onClick={() => onAsk(deploy.askPrompt)}
              className="grid w-full gap-3 px-5 py-3 text-left transition-colors hover:bg-[#FAF8F5] sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px]" style={{ color: INK }}>{deploy.branch}</span>
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ color: s.fg, background: s.bg }}>
                    {deploy.env} · {s.label}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]" style={{ color: MUTED }}>
                  <Initial dev={owner} size={16} />
                  <span>{owner?.name}</span>
                  <span>{deploy.commit}</span>
                  <span>{deploy.url}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-sans text-[12px]" style={{ color: s.fg }}>{deploy.drift}</p>
                <p className="mt-0.5 font-mono text-[10px]" style={{ color: MUTED }}>{deploy.updated}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

function SafeToTouchPanel({
  files,
  devs,
  onAsk
}: {
  files: FileTouchSignal[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const blocked = files.filter((f) => f.risk === "blocked").length;

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              SAFE TO TOUCH
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              File risk lights
            </h2>
          </div>
          <span className="rounded-full px-2 py-1 font-mono text-[10px]" style={{ color: blocked ? RUST : TEAL, background: blocked ? `${RUST}10` : `${TEAL}10` }}>
            {blocked} blocked
          </span>
        </div>
      </header>

      <motion.div variants={containerStagger} initial="hidden" animate="show" className="space-y-2 p-4">
        {files.map((file) => {
          const owner = devById(devs, file.ownerId);
          const s = TOUCH_STYLE[file.risk];
          return (
            <motion.button
              key={file.id}
              type="button"
              variants={fadeUp}
              whileHover={{ x: 2 }}
              onClick={() => onAsk(file.askPrompt)}
              className="w-full rounded-[10px] border bg-white px-3 py-2.5 text-left"
              style={{ borderColor: HAIR }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.fg }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-[12px]" style={{ color: INK }}>{file.path}</span>
                    <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ color: s.fg, background: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: MUTED }}>{file.reason}</p>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
                    <Initial dev={owner} size={15} />
                    <span>{owner?.name}</span>
                    <span>last touched {file.lastTouched}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

function BlockedWaitingGraph({
  edges,
  devs,
  onAsk
}: {
  edges: WaitingEdge[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const blocked = edges.filter((e) => e.status === "blocked").length;
  const waiting = edges.filter((e) => e.status === "waiting").length;

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              BLOCKED / WAITING GRAPH
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              Who is waiting on whom
            </h2>
          </div>
          <div className="flex gap-1.5 font-mono text-[10px]">
            <span className="rounded-full px-2 py-1" style={{ color: RUST, background: `${RUST}10` }}>{blocked} blocked</span>
            <span className="rounded-full px-2 py-1" style={{ color: ORANGE, background: `${ORANGE}10` }}>{waiting} waiting</span>
          </div>
        </div>
      </header>

      <motion.div variants={containerStagger} initial="hidden" animate="show" className="grid gap-3 p-4 md:grid-cols-2">
        {edges.map((edge) => {
          const from = devById(devs, edge.fromDevId);
          const to = devById(devs, edge.toDevId);
          const s = WAIT_STYLE[edge.status];
          return (
            <motion.button
              key={edge.id}
              type="button"
              variants={fadeUp}
              whileHover={{ y: -2 }}
              onClick={() => onAsk(edge.askPrompt)}
              className="rounded-[10px] border bg-white p-3 text-left"
              style={{ borderColor: HAIR }}
            >
              <div className="flex items-center gap-2">
                <Initial dev={from} size={28} />
                <div className="h-px flex-1" style={{ background: s.fg }} />
                <TbArrowsRightLeft className="h-4 w-4" strokeWidth={1.5} style={{ color: s.fg }} />
                <div className="h-px flex-1" style={{ background: s.fg }} />
                <Initial dev={to} size={28} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {from?.name} to {to?.name}
                </p>
                <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ color: s.fg, background: s.bg }}>
                  {s.label} · {edge.since}
                </span>
              </div>
              <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: INK }}>{edge.work}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

function AgentActivityStream({
  items,
  devs
}: {
  items: AgentActivityEntry[];
  devs: Dev[];
}) {
  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
          AGENT ACTIVITY STREAM
        </p>
        <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
          What agents did recently
        </h2>
      </header>

      <motion.ol variants={containerStagger} initial="hidden" animate="show" className="relative space-y-3 p-4">
        {items.map((item) => {
          const owner = devById(devs, item.ownerId);
          return (
            <motion.li key={item.id} variants={fadeUp} className="flex gap-3">
              <Initial dev={owner} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-[13px]" style={{ color: INK }}>{item.action}</span>
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ color: PURPLE, background: `${PURPLE}12` }}>
                    {item.agent}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px]" style={{ color: MUTED }}>{item.target}</p>
                <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: INK }}>{item.result}</p>
                <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>{owner?.name} · {item.ts}</p>
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}

function TodoFixmeAggregator({
  items,
  devs,
  onAsk
}: {
  items: TodoFixmeEntry[];
  devs: Dev[];
  onAsk: (p: string) => void;
}) {
  const [kind, setKind] = useState<"all" | TodoKind>("all");
  const filtered = useMemo(() => (kind === "all" ? items : items.filter((i) => i.kind === kind)), [items, kind]);
  const high = items.filter((i) => i.priority === "high").length;
  const tabs: Array<"all" | TodoKind> = ["all", "TODO", "FIXME", "HACK"];

  return (
    <section className="rounded-[12px] border bg-white" style={{ borderColor: HAIR }}>
      <header className="border-b px-5 py-4" style={{ borderColor: HAIR }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              TODO / FIXME AGGREGATOR
            </p>
            <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
              Notes hiding in code
            </h2>
          </div>
          <span className="rounded-full px-2 py-1 font-mono text-[10px]" style={{ color: high ? RUST : MUTED, background: high ? `${RUST}10` : "#F1ECE4" }}>
            {high} high
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const active = kind === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setKind(t)}
                className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                style={{
                  color: active ? ORANGE : MUTED,
                  background: active ? `${ORANGE}14` : "transparent",
                  border: `1px solid ${active ? `${ORANGE}55` : HAIR}`
                }}
              >
                {t.toLowerCase()}
              </button>
            );
          })}
        </div>
      </header>

      <motion.div variants={containerStagger} initial="hidden" animate="show" className="space-y-2 p-4">
        {filtered.map((item) => {
          const owner = devById(devs, item.ownerId);
          const s = TODO_STYLE[item.priority];
          return (
            <motion.button
              key={item.id}
              type="button"
              variants={fadeUp}
              onClick={() => onAsk(item.askPrompt)}
              className="w-full rounded-[10px] border bg-white p-3 text-left transition-colors hover:bg-[#FAF8F5]"
              style={{ borderColor: HAIR }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ color: s.fg, background: s.bg }}>
                  {item.kind} · {s.label}
                </span>
                <span className="font-mono text-[11px]" style={{ color: MUTED }}>
                  {item.path}:{item.line}
                </span>
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px]" style={{ color: MUTED }}>
                  <Initial dev={owner} size={14} />
                  {owner?.name}
                </span>
              </div>
              <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: INK }}>{item.text}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

function buildContextText(snapshot: TeamContextSnapshot, devs: Dev[]): string {
  const lines: string[] = [];
  lines.push("# Team context — Northstar Cloud\n");
  lines.push("## Who's building what");
  snapshot.whoIsBuildingWhat.forEach((w) => {
    const d = devById(devs, w.devId);
    lines.push(`- ${d?.name ?? w.devId}: ${w.line}`);
  });
  lines.push("\n## Changed files");
  snapshot.changedFiles.forEach((f) => lines.push(`- ${f}`));
  lines.push("\n## Mocked / assumed");
  snapshot.mocked.forEach((m) => lines.push(`- ${m}`));
  lines.push("\n## Open seams");
  snapshot.openSeams.forEach((m) => lines.push(`- ${m}`));
  lines.push("\n## Recent decisions");
  snapshot.recentDecisions.forEach((m) => lines.push(`- ${m}`));
  lines.push("\n## Blockers");
  snapshot.blockers.forEach((m) => lines.push(`- ${m}`));
  if (snapshot.waiting?.length) {
    lines.push("\n## Blocked / waiting graph");
    snapshot.waiting.forEach((m) => lines.push(`- ${m}`));
  }
  if (snapshot.deployTruth?.length) {
    lines.push("\n## Branch & deploy truth");
    snapshot.deployTruth.forEach((m) => lines.push(`- ${m}`));
  }
  if (snapshot.safeToTouch?.length) {
    lines.push("\n## Safe to touch");
    snapshot.safeToTouch.forEach((m) => lines.push(`- ${m}`));
  }
  if (snapshot.todoFixme?.length) {
    lines.push("\n## TODO / FIXME");
    snapshot.todoFixme.forEach((m) => lines.push(`- ${m}`));
  }
  if (snapshot.agentActivity?.length) {
    lines.push("\n## Agent activity");
    snapshot.agentActivity.forEach((m) => lines.push(`- ${m}`));
  }
  return lines.join("\n");
}

function CodeBlockPreview({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <pre
      className="m-0 overflow-auto rounded-[10px] border p-3 font-mono text-[11px] leading-5"
      style={{ borderColor: HAIR, background: "#FBF7F1", maxHeight: 360, color: INK }}
    >
      {lines.map((line, i) => {
        let el: ReactNode = line || " ";
        let color = INK;
        if (line.startsWith("# ")) {
          color = INK;
          el = <span style={{ fontWeight: 500 }}>{line}</span>;
        } else if (line.startsWith("## ")) {
          color = PURPLE;
        } else if (line.startsWith("- ")) {
          color = INK;
          el = (
            <>
              <span style={{ color: MUTED }}>-</span>
              {line.slice(1)}
            </>
          );
        } else {
          color = MUTED;
        }
        return (
          <div key={i} style={{ color }}>
            {el}
          </div>
        );
      })}
    </pre>
  );
}

function FetchContextPreview({
  snapshot,
  devs
}: {
  snapshot: TeamContextSnapshot;
  devs: Dev[];
}) {
  const [compiling, setCompiling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(1);
  const [view, setView] = useState<"both" | "sections" | "raw">("both");

  const text = useMemo(() => buildContextText(snapshot, devs), [snapshot, devs, seed]);
  const tokens = useMemo(() => Math.max(120, Math.round(text.length / 4)), [text]);

  const regen = () => {
    setCompiling(true);
    setTimeout(() => {
      setSeed((s) => s + 1);
      setCompiling(false);
    }, 900);
  };

  const copy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const stats = [
    { label: "files", value: snapshot.changedFiles.length, color: TEAL },
    { label: "mocked", value: snapshot.mocked.length, color: ORANGE },
    { label: "seams", value: snapshot.openSeams.length, color: RUST },
    { label: "decisions", value: snapshot.recentDecisions.length, color: PURPLE },
    { label: "waiting", value: snapshot.waiting?.length ?? 0, color: RUST },
    { label: "todos", value: snapshot.todoFixme?.length ?? 0, color: ORANGE }
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[12px] border p-5"
      style={{
        borderColor: HAIR,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F7F1E7 100%)"
      }}
    >
      <AnimatePresence>
        {compiling ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]"
            style={{ background: "rgba(247,241,231,0.55)" }}
          >
            <div
              className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 font-mono text-[11px]"
              style={{ borderColor: HAIR, color: PURPLE }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              >
                <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              </motion.span>
              recompiling snapshot
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: PURPLE }}>
            FETCH TEAM CONTEXT · PREVIEW
          </p>
          <h2 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
            What an agent receives
          </h2>
          <p className="mt-0.5 max-w-[640px] font-sans text-[12px]" style={{ color: MUTED }}>
            The compiled snapshot pushed to a teammate's agent on "fetch current team context."
            Updates as files change, decisions land, and seams drift.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px]"
            style={{ borderColor: `${PURPLE}55`, color: PURPLE, background: `${PURPLE}10` }}
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: PURPLE }}
            />
            agent-ready
          </span>
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>
            v.{seed.toString().padStart(2, "0")} · ~ <AnimatedNumber value={tokens} /> tokens
          </span>
        </div>
      </div>

      {/* mini stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-2 rounded-[8px] border bg-white px-3 py-2"
            style={{ borderColor: HAIR }}
          >
            <div>
              <p className="font-mono text-[9px] tracking-[0.16em]" style={{ color: MUTED }}>
                {s.label.toUpperCase()}
              </p>
              <p className="font-sans text-[16px] leading-none" style={{ color: INK }}>
                <AnimatedNumber value={s.value} />
              </p>
            </div>
            <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
          </div>
        ))}
      </div>

      {/* view switcher */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div
          className="inline-flex items-center rounded-full border bg-white p-0.5 font-mono text-[10px]"
          style={{ borderColor: HAIR }}
        >
          {(["both", "sections", "raw"] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="rounded-full px-2 py-0.5 transition-colors"
                style={{
                  background: active ? `${PURPLE}14` : "transparent",
                  color: active ? PURPLE : MUTED
                }}
              >
                {v === "both" ? "split" : v}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          regenerated every 30s · last build just now
        </span>
      </div>

      <motion.div
        key={seed}
        variants={containerStagger}
        initial="hidden"
        animate="show"
        className={
          view === "both"
            ? "mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
            : "mt-3 grid gap-4"
        }
      >
        {view !== "raw" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ContextSection title="Who's building what" count={snapshot.whoIsBuildingWhat.length}>
              <ul className="space-y-1.5">
                {snapshot.whoIsBuildingWhat.map((row) => {
                  const d = devById(devs, row.devId);
                  return (
                    <li key={row.devId} className="flex items-start gap-2">
                      <Initial dev={d} size={18} />
                      <span
                        className="font-sans text-[12px] leading-5"
                        style={{ color: INK }}
                      >
                        <span className="font-mono text-[11px]" style={{ color: MUTED }}>
                          {d?.name}:&nbsp;
                        </span>
                        {row.line}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </ContextSection>

            <ContextSection title="Changed files" count={snapshot.changedFiles.length}>
              <MonoList items={snapshot.changedFiles} />
            </ContextSection>

            <ContextSection title="Mocked / assumed" count={snapshot.mocked.length} accent={ORANGE}>
              <MonoList items={snapshot.mocked} accent={ORANGE} />
            </ContextSection>

            <ContextSection title="Open seams" count={snapshot.openSeams.length} accent={RUST}>
              <PlainList items={snapshot.openSeams} />
            </ContextSection>

            <ContextSection title="Recent decisions" count={snapshot.recentDecisions.length}>
              <PlainList items={snapshot.recentDecisions} />
            </ContextSection>

            <ContextSection title="Blockers" count={snapshot.blockers.length} accent={RUST}>
              <PlainList items={snapshot.blockers} accent={RUST} />
            </ContextSection>

            {snapshot.waiting?.length ? (
              <ContextSection title="Waiting graph" count={snapshot.waiting.length} accent={RUST}>
                <PlainList items={snapshot.waiting} accent={RUST} />
              </ContextSection>
            ) : null}

            {snapshot.deployTruth?.length ? (
              <ContextSection title="Deploy truth" count={snapshot.deployTruth.length} accent={TEAL}>
                <MonoList items={snapshot.deployTruth} />
              </ContextSection>
            ) : null}

            {snapshot.safeToTouch?.length ? (
              <ContextSection title="Safe to touch" count={snapshot.safeToTouch.length} accent={TEAL}>
                <MonoList items={snapshot.safeToTouch} />
              </ContextSection>
            ) : null}

            {snapshot.todoFixme?.length ? (
              <ContextSection title="TODO / FIXME" count={snapshot.todoFixme.length} accent={ORANGE}>
                <MonoList items={snapshot.todoFixme} accent={ORANGE} />
              </ContextSection>
            ) : null}

            {snapshot.agentActivity?.length ? (
              <ContextSection title="Agent activity" count={snapshot.agentActivity.length} accent={PURPLE}>
                <PlainList items={snapshot.agentActivity} />
              </ContextSection>
            ) : null}
          </div>
        ) : null}

        {view !== "sections" ? (
          <motion.div variants={fadeUp} className="relative">
            <div
              className="flex items-center justify-between rounded-t-[10px] border px-3 py-1.5 font-mono text-[10px]"
              style={{
                borderColor: HAIR,
                borderBottom: "none",
                background: "#F1ECE4",
                color: MUTED
              }}
            >
              <span>team-context.v{seed.toString().padStart(2, "0")}.md</span>
              <span>{text.length} chars · ~{tokens} tokens</span>
            </div>
            <div style={{ marginTop: -1 }}>
              <CodeBlockPreview text={text} />
            </div>
          </motion.div>
        ) : null}
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: TEAL }}
          />
          watching for changes
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            {copied ? (
              <>
                <TbCheck className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: TEAL }} />
                copied
              </>
            ) : (
              <>
                <TbCopy className="h-3.5 w-3.5" strokeWidth={1.5} />
                copy markdown
              </>
            )}
          </button>
          <button
            type="button"
            onClick={regen}
            className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <TbRefresh className="h-3.5 w-3.5" strokeWidth={1.5} />
            regenerate
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <TbDownload className="h-3.5 w-3.5" strokeWidth={1.5} />
            .md
          </button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-sans text-[12px] text-white"
            style={{ background: PURPLE }}
          >
            <TbSend className="h-3.5 w-3.5" strokeWidth={1.5} />
            push to my agent
          </motion.button>
        </div>
      </div>
    </section>
  );
}

function ContextSection({
  title,
  accent,
  count,
  children
}: {
  title: string;
  accent?: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -1 }}
      className="rounded-[10px] border bg-white p-3"
      style={{ borderColor: HAIR }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p
          className="font-mono text-[10px] tracking-[0.16em]"
          style={{ color: accent ?? MUTED }}
        >
          {title.toUpperCase()}
        </p>
        {typeof count === "number" ? (
          <span
            className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
            style={{
              background: accent ? `${accent}14` : "#F1ECE4",
              color: accent ?? MUTED
            }}
          >
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </motion.div>
  );
}

function MonoList({ items, accent }: { items: string[]; accent?: string }) {
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li
          key={it}
          className="truncate font-mono text-[11px]"
          style={{ color: accent ?? INK }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

function PlainList({ items, accent }: { items: string[]; accent?: string }) {
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li
          key={it}
          className="flex items-start gap-1.5 font-sans text-[12px] leading-5"
          style={{ color: accent ?? INK }}
        >
          <span
            className="mt-1 inline-block h-1 w-1 flex-shrink-0 rounded-full"
            style={{ background: accent ?? MUTED }}
          />
          {it}
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────

export default function CodePage({
  devs = DEFAULT_DEVS,
  alerts = DEFAULT_ALERTS,
  registry = DEFAULT_REGISTRY,
  conflicts = DEFAULT_CONFLICTS,
  seams = DEFAULT_SEAMS,
  decisions = DEFAULT_DECISIONS,
  contextSnapshot = DEFAULT_CONTEXT,
  deployTruth = DEFAULT_DEPLOY_TRUTH,
  fileSafety = DEFAULT_FILE_SAFETY,
  waitingGraph = DEFAULT_WAITING_GRAPH,
  agentActivity = DEFAULT_AGENT_ACTIVITY,
  todoFixmes = DEFAULT_TODO_FIXMES,
  onAskAgent,
  onFetchContext
}: CodePageProps) {
  const ask = (p: string) => {
    if (onAskAgent) {
      onAskAgent(p);
      return;
    }
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[CodePage] onAskAgent →", p);
    }
  };

  const fetchCtx = () => {
    if (onFetchContext) {
      onFetchContext();
      return;
    }
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[CodePage] onFetchContext");
    }
  };

  return (
    <section className="h-full overflow-y-auto" style={{ background: BONE }}>
      <div className="mx-auto max-w-[1240px] px-6 py-10 sm:px-8">
        <Hero devs={devs} alerts={alerts} onAsk={ask} onFetchContext={fetchCtx} />

        <div className="mt-6">
          <StatsStrip
            registry={registry}
            seams={seams}
            conflicts={conflicts}
            decisions={decisions}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <RegistryPanel registry={registry} devs={devs} onAsk={ask} />
          <ConflictRadar conflicts={conflicts} devs={devs} onAsk={ask} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <IntegrationSeamsPanel seams={seams} devs={devs} onAsk={ask} />
          <DecisionsLog decisions={decisions} devs={devs} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <BlockedWaitingGraph edges={waitingGraph} devs={devs} onAsk={ask} />
          <BranchDeployTruthPanel deploys={deployTruth} devs={devs} onAsk={ask} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <SafeToTouchPanel files={fileSafety} devs={devs} onAsk={ask} />
          <TodoFixmeAggregator items={todoFixmes} devs={devs} onAsk={ask} />
        </div>

        <div className="mt-8">
          <AgentActivityStream items={agentActivity} devs={devs} />
        </div>

        <div className="mt-8">
          <FetchContextPreview snapshot={contextSnapshot} devs={devs} />
        </div>

        <footer
          className="mt-10 flex items-center justify-center gap-1.5 font-mono text-[10px]"
          style={{ color: MUTED }}
        >
          <TbHelpCircle className="h-3 w-3" strokeWidth={1.5} />
          context streams from VS Code and agent extensions — nothing here is from git alone.
        </footer>
      </div>
    </section>
  );
}
