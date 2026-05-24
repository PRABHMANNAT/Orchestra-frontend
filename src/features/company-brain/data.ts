/* Company Brain — mock fixtures */

import type {
  AgentFeedback,
  AuditEntry,
  BrainDoc,
  Conflict,
  ContextPack,
  KnowledgeGap,
  PermissionsMatrixRow,
  Person,
  SmartCollection,
  SuggestedPack
} from "./types";

export const TEAL = "#00B4A0";
export const RUST = "#B8543D";
export const ORANGE = "#F59340";
export const PURPLE = "#8B7FD4";
export const INK = "#1A1612";
export const MUTED = "#6B6259";
export const HAIR = "rgba(26,22,18,0.08)";
export const HAIR_STRONG = "rgba(26,22,18,0.14)";
export const BONE = "#FAF8F5";

export const PEOPLE: Person[] = [
  { id: "kartikeya", name: "Kartikeya", initials: "KA", color: TEAL, role: "frontend" },
  { id: "mannan",    name: "Mannan",    initials: "MA", color: PURPLE, role: "agent ops" },
  { id: "adhiraj",   name: "Adhiraj",   initials: "AD", color: ORANGE, role: "backend" },
  { id: "prabh",     name: "Prabh",     initials: "PR", color: RUST,   role: "full-stack" },
  { id: "sarah",     name: "Sarah Chen", initials: "SC", color: "#3B82C4", role: "design" },
  { id: "marcus",    name: "Marcus T",   initials: "MT", color: "#7A8C5F", role: "PM" }
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);

export const COLLECTIONS: SmartCollection[] = [
  { id: "all",        name: "All documents",      count: 248 },
  { id: "smart",      name: "Smart collections",  count: 12  },
  { id: "by-project", name: "By project",         count: 8   },
  { id: "by-team",    name: "By team",            count: 6   },
  { id: "recent",     name: "Recently added",     count: 14  },
  { id: "flagged",    name: "Flagged",            count: 5   },
  { id: "archived",   name: "Archived",           count: 33  }
];

export const SMART_SUBS = [
  { id: "truth",     name: "Sources of truth",  count: 22 },
  { id: "onboarding",name: "Onboarding",        count: 18 },
  { id: "specs",     name: "Specs & RFCs",      count: 41 },
  { id: "incidents", name: "Incidents",         count: 9  }
];

export const PROJECTS = [
  { id: "northstar", name: "Northstar Cloud", count: 87 },
  { id: "payments",  name: "Payments revamp",  count: 34 },
  { id: "agent",     name: "Agent platform",   count: 51 },
  { id: "devx",      name: "DevX",             count: 22 }
];

export const TEAMS = [
  { id: "eng",      name: "Engineering", count: 142 },
  { id: "product",  name: "Product",     count: 58  },
  { id: "design",   name: "Design",      count: 31  },
  { id: "go-to",    name: "GTM",         count: 17  }
];

export const DOCS: BrainDoc[] = [
  {
    id: "d-001",
    title: "Northstar auth flow — canonical RFC",
    summary:
      "Source of truth for authentication: httpOnly cookies, 24h rotation, refresh handled by middleware. Replaces the bearer-in-header flow used in v0.",
    type: "md",
    source: "github",
    uploaderId: "adhiraj",
    uploadedAt: "12m ago",
    modifiedAt: "12m ago",
    tags: ["auth", "rfc", "canonical"],
    projectId: "northstar",
    access: "public-team",
    freshness: "fresh",
    isSourceOfTruth: "auth flow",
    fetchedThisWeek: { humans: 48, agents: 211 },
    content:
      "# Northstar auth flow\n\nWe authenticate users via an httpOnly cookie. Tokens rotate every 24h.\n\n## Why httpOnly\nBearer-in-header was leaking into request logs.\n\n## Cookie\n- name: `ns_session`\n- SameSite: Lax\n- Secure: true\n- HttpOnly: true\n\n## Refresh\nThe middleware checks `exp`; on expiry it silently issues a new cookie if the refresh token is valid.\n\n## Migration\nDeprecate `Authorization: Bearer` by Friday. v0 paths will 404."
  },
  {
    id: "d-002",
    title: "Comms API contract (v1)",
    summary:
      "Defines the Comms list endpoint as cursor-paginated. Page size 25. Includes the Comm shape with message (renamed from body) and createdAt.",
    type: "md",
    source: "manual",
    uploaderId: "adhiraj",
    uploadedAt: "1h ago",
    tags: ["api", "contract", "comms"],
    projectId: "northstar",
    access: "public-team",
    freshness: "fresh",
    isSourceOfTruth: "comms api",
    fetchedThisWeek: { humans: 22, agents: 134 },
    conflictWith: { docId: "d-006", topic: "Comm.body vs Comm.message" }
  },
  {
    id: "d-003",
    title: "Onboarding playlist — backend engineers",
    summary:
      "Mandatory reading for new backend hires. Covers local setup, the auth flow, the comms API, the staging deploy, and the on-call rotation.",
    type: "md",
    source: "notion",
    uploaderId: "marcus",
    uploadedAt: "2d ago",
    tags: ["onboarding", "backend", "playlist"],
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 7, agents: 4 }
  },
  {
    id: "d-004",
    title: "Q3 board update — final.pdf",
    summary:
      "Q3 board deck covering MRR growth, agent platform launch, hiring plan. Includes ARR forecast for FY26 and the bridge to profitability narrative.",
    type: "pdf",
    source: "drive",
    uploaderId: "sarah",
    uploadedAt: "3d ago",
    tags: ["board", "finance", "narrative"],
    access: "role-restricted",
    freshness: "fresh",
    fetchedThisWeek: { humans: 9, agents: 0 }
  },
  {
    id: "d-005",
    title: "Customer interview — Lisa F. (Foster Studio)",
    summary:
      "60-min interview with Lisa Foster on agent context drift. Top theme: she does not trust agents to fetch the right doc without human-curated packs.",
    type: "audio",
    source: "manual",
    uploaderId: "sarah",
    uploadedAt: "4d ago",
    tags: ["research", "customer", "interview"],
    access: "project-only",
    freshness: "fresh",
    transcript: [
      { ts: "00:02", text: "...so the first time it cited a wrong RFC, that's when we stopped letting it touch the security docs." },
      { ts: "01:34", text: "We curate the packs by hand because trust is one-shot — one bad cite and the team disables the agent." },
      { ts: "04:11", text: "If it could show me what it's about to fetch, I'd let it back in." }
    ],
    fetchedThisWeek: { humans: 4, agents: 0 }
  },
  {
    id: "d-006",
    title: "Comms API — legacy notes (pre-v1)",
    summary:
      "Notes from the pre-v1 era. Treats Comm.body as the field name and assumes offset pagination. Superseded by the v1 contract.",
    type: "md",
    source: "slack",
    uploaderId: "mannan",
    uploadedAt: "3w ago",
    tags: ["api", "comms", "legacy"],
    projectId: "northstar",
    access: "public-team",
    freshness: "stale",
    expiresAt: "expired 2d ago",
    conflictWith: { docId: "d-002", topic: "Comm.body vs Comm.message" },
    fetchedThisWeek: { humans: 1, agents: 9 }
  },
  {
    id: "d-007",
    title: "Loom: Mannan walks through the agent context layer",
    summary:
      "15-min Loom recording explaining how the Brain compiles context for an agent fetch. Covers cache hit/miss, freshness rules, and access checks.",
    type: "video",
    source: "loom",
    uploaderId: "mannan",
    uploadedAt: "1w ago",
    tags: ["explainer", "agents", "loom"],
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 16, agents: 0 }
  },
  {
    id: "d-008",
    title: "Incident: 2025-10-04 — agent fetched stale auth doc",
    summary:
      "Post-mortem on the incident where an agent cited the deprecated bearer-in-header flow during a customer demo. Action items: enforce freshness on auth docs.",
    type: "md",
    source: "manual",
    uploaderId: "prabh",
    uploadedAt: "5w ago",
    tags: ["incident", "post-mortem", "agents"],
    access: "public-team",
    freshness: "stale-soon",
    fetchedThisWeek: { humans: 3, agents: 12 }
  },
  {
    id: "d-009",
    title: "Brand voice guide v3",
    summary:
      "Updated brand voice rules. Sentence case in product UI, mono for code and metadata, no exclamation marks in transactional copy.",
    type: "docx",
    source: "drive",
    uploaderId: "sarah",
    uploadedAt: "2w ago",
    tags: ["brand", "design", "copy"],
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 11, agents: 4 }
  },
  {
    id: "d-010",
    title: "Payments revamp — kickoff one-pager",
    summary:
      "One-page brief for the payments revamp. Goals, scope (no PSP migration), constraints (must not break v0 webhooks), and owners.",
    type: "md",
    source: "notion",
    uploaderId: "marcus",
    uploadedAt: "6d ago",
    tags: ["payments", "kickoff", "brief"],
    projectId: "payments",
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 18, agents: 7 }
  },
  {
    id: "d-011",
    title: "Deploy runbook — staging",
    summary:
      "Step-by-step staging deploy. Covers rollback, smoke checks, and how to verify the auth middleware came up healthy.",
    type: "md",
    source: "github",
    uploaderId: "adhiraj",
    uploadedAt: "8mo ago",
    tags: ["runbook", "ops", "deploy"],
    access: "public-team",
    freshness: "stale",
    fetchedThisWeek: { humans: 6, agents: 14 }
  },
  {
    id: "d-012",
    title: "Security review — Q2 — confidential",
    summary:
      "External security review from Q2. Findings on auth surface, dependency hygiene, and admin endpoint coverage. Two highs unresolved.",
    type: "pdf",
    source: "drive",
    uploaderId: "prabh",
    uploadedAt: "4mo ago",
    tags: ["security", "review", "confidential"],
    access: "human-only",
    freshness: "stale-soon",
    fetchedThisWeek: { humans: 2, agents: 0 }
  },
  {
    id: "d-013",
    title: "Code snippet — useDashboard hook",
    summary:
      "The single hook the Dashboard cards read from. Owns refetch + cache logic. Cards stay presentational and swappable.",
    type: "code",
    source: "github",
    uploaderId: "kartikeya",
    uploadedAt: "yesterday",
    tags: ["frontend", "hook", "dashboard"],
    projectId: "northstar",
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 5, agents: 9 }
  },
  {
    id: "d-014",
    title: "Agent platform — RFC #042 — pack triggers",
    summary:
      "RFC for context-pack trigger conditions. Proposes file-glob + project + task-type matching. Open question: who can author a pack?",
    type: "md",
    source: "github",
    uploaderId: "mannan",
    uploadedAt: "2d ago",
    tags: ["rfc", "agents", "packs"],
    projectId: "agent",
    access: "public-team",
    freshness: "fresh",
    fetchedThisWeek: { humans: 14, agents: 6 }
  },
  {
    id: "d-015",
    title: "Pricing notes — Series B raise",
    summary:
      "Internal pricing notes from the Series B raise. Includes the per-seat vs per-agent debate and the landed-pricing for design partners.",
    type: "md",
    source: "manual",
    uploaderId: "marcus",
    uploadedAt: "1mo ago",
    tags: ["pricing", "fundraising", "confidential"],
    access: "role-restricted",
    freshness: "fresh",
    fetchedThisWeek: { humans: 3, agents: 0 }
  }
];

export const docById = (id: string) => DOCS.find((d) => d.id === id);

export const CONFLICTS: Conflict[] = [
  {
    id: "cf-001",
    docA: { id: "d-002", title: "Comms API contract (v1)" },
    docB: { id: "d-006", title: "Comms API — legacy notes (pre-v1)" },
    topic: "Comm.body vs Comm.message",
    claim: "v1 renames body→message. The legacy notes still treat body as canonical and offset paging as the default."
  },
  {
    id: "cf-002",
    docA: { id: "d-001", title: "Northstar auth flow — canonical RFC" },
    docB: { id: "d-011", title: "Deploy runbook — staging" },
    topic: "Bearer vs cookie auth",
    claim: "Runbook still references the bearer header in the smoke check; canonical doc says it 404s by Friday."
  },
  {
    id: "cf-003",
    docA: { id: "d-014", title: "RFC #042 — pack triggers" },
    docB: { id: "d-007", title: "Loom: agent context layer" },
    topic: "Who can author packs",
    claim: "Loom claims anyone on the team; RFC restricts to project owners and platform-eng."
  }
];

export const GAPS: KnowledgeGap[] = [
  {
    id: "g-001",
    topic: "Local setup for the agent platform",
    signal: "Devs asked about auth flow 12 times this week, no canonical doc exists",
    count: 12
  },
  {
    id: "g-002",
    topic: "How to grant an agent access to a private doc",
    signal: "5 support threads in the last 14 days",
    count: 5
  },
  {
    id: "g-003",
    topic: "Comms cursor pagination on the frontend",
    signal: "3 PRs landed without a shared util; one regressed",
    count: 3
  },
  {
    id: "g-004",
    topic: "On-call rotation rules during launch week",
    signal: "Asked 4 times in #ops, no canonical answer",
    count: 4
  }
];

export const STALE_DOC_IDS = ["d-011", "d-006", "d-012"];

export const RECENT_UPLOADS_IDS = ["d-001", "d-002", "d-014", "d-007", "d-013", "d-010"];

export const TOP_FETCHED_IDS = ["d-001", "d-002", "d-006", "d-014", "d-011"];

export const PENDING_REVIEW_IDS = ["d-006", "d-011", "d-008"];

export const ONBOARDING_STATUS = {
  hireName: "Aanya R.",
  joinedDays: 6,
  playlist: [
    { docId: "d-003", done: true,  doneAt: "day 1" },
    { docId: "d-001", done: true,  doneAt: "day 2" },
    { docId: "d-002", done: true,  doneAt: "day 3" },
    { docId: "d-007", done: false, doneAt: "—" },
    { docId: "d-011", done: false, doneAt: "—" }
  ]
};

export const AUDIT: AuditEntry[] = [
  {
    id: "au-001",
    ts: "08:14:22",
    actorId: "mannan",
    actorKind: "agent",
    action: "used-in-agent-response",
    docId: "d-001",
    docTitle: "Northstar auth flow — canonical RFC",
    context: "Prompt: 'How does session refresh work in Northstar?'"
  },
  {
    id: "au-002",
    ts: "08:11:09",
    actorId: "adhiraj",
    actorKind: "human",
    action: "edited",
    docId: "d-002",
    docTitle: "Comms API contract (v1)",
    context: "Set source-of-truth on 'comms api'"
  },
  {
    id: "au-003",
    ts: "08:02:55",
    actorId: "mannan",
    actorKind: "agent",
    action: "fetched",
    docId: "d-006",
    docTitle: "Comms API — legacy notes (pre-v1)",
    context: "Tool call: brain.fetch(query='comm body field')",
    suspicious: "fetching a doc flagged stale 2d ago"
  },
  {
    id: "au-004",
    ts: "07:45:12",
    actorId: "sarah",
    actorKind: "human",
    action: "viewed",
    docId: "d-005",
    docTitle: "Customer interview — Lisa F.",
    context: "Search: 'agent trust drift'"
  },
  {
    id: "au-005",
    ts: "07:30:01",
    actorId: "prabh",
    actorKind: "human",
    action: "downloaded",
    docId: "d-012",
    docTitle: "Security review — Q2 — confidential",
    context: "Detail page action",
    suspicious: "mass download — 6 confidential docs in 4 min"
  },
  {
    id: "au-006",
    ts: "07:14:33",
    actorId: "kartikeya",
    actorKind: "human",
    action: "viewed",
    docId: "d-001",
    docTitle: "Northstar auth flow — canonical RFC",
    context: "Brain Pulse → recent uploads"
  },
  {
    id: "au-007",
    ts: "yesterday 19:02",
    actorId: "mannan",
    actorKind: "agent",
    action: "used-in-agent-response",
    docId: "d-014",
    docTitle: "RFC #042 — pack triggers",
    context: "Prompt: 'Can I trigger a pack on a file glob?'"
  },
  {
    id: "au-008",
    ts: "yesterday 17:41",
    actorId: "adhiraj",
    actorKind: "human",
    action: "edited",
    docId: "d-001",
    docTitle: "Northstar auth flow — canonical RFC",
    context: "Added 'Migration' section"
  }
];

export const CONTEXT_PACKS: ContextPack[] = [
  {
    id: "pk-001",
    name: "Auth & sessions",
    description: "Canonical auth flow + middleware + the deprecated v0 notes for migration context.",
    docIds: ["d-001", "d-011"],
    triggers: ["file glob: server/middleware/auth*", "project: northstar", "task: auth"],
    status: "active",
    usedByAgents: 4,
    loadsThisWeek: 87,
    successRate: 92,
    lastUpdated: "2d ago"
  },
  {
    id: "pk-002",
    name: "Comms surface",
    description: "Everything an agent needs to ship on the Comms surface: v1 contract, Loom explainer, RFC.",
    docIds: ["d-002", "d-007", "d-014"],
    triggers: ["project: northstar", "file glob: src/components/Comms*"],
    status: "active",
    usedByAgents: 3,
    loadsThisWeek: 41,
    successRate: 88,
    lastUpdated: "1d ago"
  },
  {
    id: "pk-003",
    name: "Brand voice",
    description: "For any agent generating customer-facing copy. Voice guide + brand examples.",
    docIds: ["d-009"],
    triggers: ["task: copywriting", "tag: customer-facing"],
    status: "active",
    usedByAgents: 2,
    loadsThisWeek: 23,
    successRate: 95,
    lastUpdated: "5d ago"
  },
  {
    id: "pk-004",
    name: "Onboarding (backend)",
    description: "What a new backend hire's agent loads on day one to answer their first 10 questions.",
    docIds: ["d-003", "d-001", "d-002", "d-011"],
    triggers: ["user: new hire (<14d)", "role: backend"],
    status: "paused",
    usedByAgents: 1,
    loadsThisWeek: 6,
    successRate: 81,
    lastUpdated: "2w ago"
  }
];

export const SUGGESTED_PACKS: SuggestedPack[] = [
  {
    id: "sp-001",
    reason: "Agents fetched these 4 docs together 23 times in the past week.",
    suggestedName: "Payments context",
    docIds: ["d-010", "d-002", "d-001", "d-013"]
  },
  {
    id: "sp-002",
    reason: "Sarah + the design agent loaded these together 11 times.",
    suggestedName: "Design research",
    docIds: ["d-005", "d-009"]
  }
];

export const FEEDBACK: AgentFeedback[] = [
  {
    id: "fb-001",
    question: "What field name does the Comm payload use?",
    answer: "The Comm payload uses a field called `body`. Example: `{ id, author, body, createdAt }`.",
    citedDocId: "d-006",
    citedDocTitle: "Comms API — legacy notes (pre-v1)",
    correction: "v1 renamed `body` to `message`. The legacy notes are pre-v1 — agent should have cited d-002.",
    flaggedBy: "adhiraj",
    ts: "2h ago",
    status: "open"
  },
  {
    id: "fb-002",
    question: "How do we authenticate against the API?",
    answer: "Send an `Authorization: Bearer <token>` header. The token is returned by POST /api/auth/login.",
    citedDocId: "d-011",
    citedDocTitle: "Deploy runbook — staging",
    correction: "Bearer is being removed by Friday. The canonical answer is the httpOnly cookie flow in d-001.",
    flaggedBy: "prabh",
    ts: "yesterday",
    status: "open"
  },
  {
    id: "fb-003",
    question: "Can a non-owner author a context pack?",
    answer: "Yes — anyone on the team can author a pack.",
    citedDocId: "d-007",
    citedDocTitle: "Loom: agent context layer",
    correction: "RFC #042 restricts authoring to project owners and platform-eng. The loom predates the RFC.",
    flaggedBy: "mannan",
    ts: "2d ago",
    status: "open"
  },
  {
    id: "fb-004",
    question: "When does the on-call rotation start during launch week?",
    answer: "I don't have a doc for the launch-week rotation specifically.",
    citedDocId: "d-011",
    citedDocTitle: "Deploy runbook — staging",
    correction: "Acknowledged: this is a known gap.",
    flaggedBy: "kartikeya",
    ts: "3d ago",
    status: "resolved"
  }
];

export const DEFAULT_PERMISSIONS: PermissionsMatrixRow[] = [
  {
    id: "team-eng",
    kind: "team",
    name: "Engineering",
    permissions: { view: true, useInAgentContext: true, editMetadata: false, delete: false }
  },
  {
    id: "team-product",
    kind: "team",
    name: "Product",
    permissions: { view: true, useInAgentContext: true, editMetadata: false, delete: false }
  },
  {
    id: "role-platform",
    kind: "role",
    name: "Platform engineering",
    permissions: { view: true, useInAgentContext: true, editMetadata: true, delete: false }
  },
  {
    id: "person-adhiraj",
    kind: "person",
    name: "Adhiraj (owner)",
    permissions: { view: true, useInAgentContext: true, editMetadata: true, delete: true }
  },
  {
    id: "role-contractor",
    kind: "role",
    name: "Contractors",
    permissions: { view: true, useInAgentContext: false, editMetadata: false, delete: false }
  }
];
