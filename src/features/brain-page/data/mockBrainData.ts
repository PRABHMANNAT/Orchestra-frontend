/* Brain Page — mock fixtures
 * Series-A startup data for Northstar Cloud
 */

export type DomainId =
  | "northstar"
  | "apollo"
  | "acme"
  | "engineering"
  | "sales"
  | "design"
  | "onboarding"
  | "legal";

export type Domain = {
  id: DomainId;
  name: string;
  docCount: number;
  color: string;
  lastUpdated: string;
  contributors: string[];
};

export const DOMAINS: Domain[] = [
  {
    id: "engineering",
    name: "Engineering Wiki",
    docCount: 312,
    color: "#A85B3D",
    lastUpdated: "2026-05-23T14:22:00Z",
    contributors: ["Kartikeya Rao", "Adhiraj Singh", "Marcus Thompson"]
  },
  {
    id: "northstar",
    name: "Project Northstar",
    docCount: 247,
    color: "#B8543D",
    lastUpdated: "2026-05-24T09:14:00Z",
    contributors: ["Sarah Chen", "Prabh Mannat", "Hiroshi Tanaka"]
  },
  {
    id: "sales",
    name: "Sales Playbook",
    docCount: 184,
    color: "#C28840",
    lastUpdated: "2026-05-22T18:40:00Z",
    contributors: ["Lisa Foster", "Mei Chen", "Marcus Thompson"]
  },
  {
    id: "apollo",
    name: "Project Apollo",
    docCount: 156,
    color: "#7A8C5F",
    lastUpdated: "2026-05-23T11:02:00Z",
    contributors: ["Adhiraj Singh", "Yuki Sato", "Sarah Chen"]
  },
  {
    id: "design",
    name: "Design System",
    docCount: 142,
    color: "#5E7A8C",
    lastUpdated: "2026-05-21T16:18:00Z",
    contributors: ["Sarah Chen", "Aanya Iyer", "Ji-woo Park"]
  },
  {
    id: "onboarding",
    name: "Onboarding",
    docCount: 98,
    color: "#8C5D3B",
    lastUpdated: "2026-05-20T13:30:00Z",
    contributors: ["Mannan Verma", "Lisa Foster"]
  },
  {
    id: "acme",
    name: "Customer Acme",
    docCount: 67,
    color: "#9E6B3D",
    lastUpdated: "2026-05-24T07:08:00Z",
    contributors: ["Marcus Thompson", "Mei Chen"]
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    docCount: 41,
    color: "#6B6259",
    lastUpdated: "2026-05-18T10:55:00Z",
    contributors: ["Priya Sharma", "James Whitford"]
  }
];

export type SourceStatus = "synced" | "syncing" | "error" | "not_connected";

export type Source = {
  id: string;
  name: string;
  status: SourceStatus;
  itemsIndexed: number;
  lastSync: string;
  icon: string;
};

export const SOURCES: Source[] = [
  { id: "github", name: "GitHub", status: "synced", itemsIndexed: 1842, lastSync: "2026-05-24T08:42:00Z", icon: "github" },
  { id: "gdrive", name: "Google Drive", status: "syncing", itemsIndexed: 624, lastSync: "2026-05-24T09:14:00Z", icon: "gdrive" },
  { id: "slack", name: "Slack", status: "synced", itemsIndexed: 3127, lastSync: "2026-05-24T09:10:00Z", icon: "slack" },
  { id: "notion", name: "Notion", status: "synced", itemsIndexed: 412, lastSync: "2026-05-24T08:30:00Z", icon: "notion" },
  { id: "figma", name: "Figma", status: "syncing", itemsIndexed: 89, lastSync: "2026-05-24T09:12:00Z", icon: "figma" },
  { id: "linear", name: "Linear", status: "synced", itemsIndexed: 218, lastSync: "2026-05-24T08:55:00Z", icon: "linear" },
  { id: "vscode", name: "VS Code", status: "synced", itemsIndexed: 47, lastSync: "2026-05-24T07:18:00Z", icon: "vscode" },
  { id: "cursor", name: "Cursor", status: "error", itemsIndexed: 34, lastSync: "2026-05-23T22:04:00Z", icon: "cursor" },
  { id: "antigravity", name: "Antigravity", status: "error", itemsIndexed: 12, lastSync: "2026-05-23T18:42:00Z", icon: "antigravity" },
  { id: "gmail", name: "Gmail", status: "synced", itemsIndexed: 1284, lastSync: "2026-05-24T09:02:00Z", icon: "gmail" },
  { id: "fireflies", name: "Fireflies", status: "synced", itemsIndexed: 156, lastSync: "2026-05-24T08:48:00Z", icon: "fireflies" },
  { id: "manual", name: "Manual Uploads", status: "not_connected", itemsIndexed: 0, lastSync: "", icon: "upload" }
];

export type DocType = "doc" | "decision" | "comm" | "code" | "design" | "meeting" | "customer";

export type DocFreshness = "active" | "stale" | "historical";

export type Doc = {
  id: string;
  title: string;
  type: DocType;
  source: string;
  summary: string;
  uploader: { name: string; initials: string; color: string };
  updatedAt: string;
  fetchCount: number;
  freshness: DocFreshness;
  restricted: boolean;
  agentAccessible: boolean;
  domain: DomainId;
  project?: string;
};

const PEOPLE = [
  { name: "Kartikeya Rao", initials: "KR", color: "#B8543D" },
  { name: "Sarah Chen", initials: "SC", color: "#3B82C4" },
  { name: "Adhiraj Singh", initials: "AS", color: "#7A8C5F" },
  { name: "Prabh Mannat", initials: "PM", color: "#8B7FD4" },
  { name: "Mannan Verma", initials: "MV", color: "#C28840" },
  { name: "Marcus Thompson", initials: "MT", color: "#5E7A8C" },
  { name: "Lisa Foster", initials: "LF", color: "#9E3B2E" },
  { name: "Hiroshi Tanaka", initials: "HT", color: "#2D4A3E" },
  { name: "Mei Chen", initials: "MC", color: "#A85B3D" },
  { name: "Aanya Iyer", initials: "AI", color: "#6B6259" },
  { name: "Ji-woo Park", initials: "JP", color: "#8C5D3B" },
  { name: "Yuki Sato", initials: "YS", color: "#5A5450" },
  { name: "Priya Sharma", initials: "PS", color: "#7A8C5F" },
  { name: "James Whitford", initials: "JW", color: "#3B82C4" }
];

const TITLES_BY_TYPE: Record<DocType, string[]> = {
  doc: [
    "Northstar architecture overview",
    "Payments v2 technical RFC",
    "Auth migration strategy",
    "Multi-tenant data model",
    "Observability stack decisions",
    "Frontend performance budget",
    "API versioning policy",
    "Service mesh evaluation",
    "Postgres → Aurora migration plan",
    "Edge cache layer design",
    "Background jobs platform",
    "Feature flag rollout playbook",
    "Incident response runbook",
    "Secret rotation procedure",
    "Internal SDK release notes",
    "Webhook delivery guarantees",
    "Rate limiting strategy",
    "Embedding pipeline architecture",
    "Data warehouse schema v3"
  ],
  decision: [
    "Why we chose JWT over session cookies",
    "Decision: Postgres as primary DB",
    "Decision: Drop GraphQL, REST-first",
    "Decision: Self-host vs Vercel",
    "Decision: Sentry → OpenTelemetry",
    "Decision: Yearly pricing model",
    "Decision: Enterprise tier gating",
    "Decision: Sunset legacy v1 API",
    "Decision: Move billing to Stripe",
    "Decision: Geo-replication regions"
  ],
  comm: [
    "Pricing call recap — Acme",
    "Weekly engineering sync",
    "Slack thread: incident 0524",
    "Slack: hiring loop changes",
    "Customer call — Apollo expansion",
    "Investor update Q1",
    "All-hands recap May",
    "Slack: design review feedback"
  ],
  code: [
    "northstar/api · auth middleware",
    "payments-v2/checkout.ts",
    "shared/cache adapter",
    "billing webhooks handler",
    "feature-flags rollout helper",
    "embeddings/index.ts",
    "graph traversal worker"
  ],
  design: [
    "Onboarding redesign v3",
    "Pricing page exploration",
    "Dashboard IA proposal",
    "Brain detail drawer",
    "Empty states pack",
    "Design tokens audit",
    "Mobile nav patterns"
  ],
  meeting: [
    "Acme QBR — May 2026",
    "Apollo kickoff",
    "Northstar roadmap review",
    "Pricing committee",
    "Security review with legal",
    "Onboarding retro"
  ],
  customer: [
    "Acme — implementation notes",
    "Acme — SSO requirements",
    "Apollo — data residency",
    "Apollo — usage patterns",
    "Customer feedback digest"
  ]
};

const SUMMARIES = [
  "Outlines the technical approach and migration path. Decision logs referenced from prior RFCs and engineering syncs.",
  "Captures rationale, alternatives considered, and rollback strategy. Linked to Linear epic and customer asks.",
  "Walks through the architecture diagram, failure modes, and on-call ownership. Referenced by 4 active projects.",
  "Summary of conversation with stakeholders. Action items extracted. Owners and deadlines assigned.",
  "Detailed implementation notes including code paths, edge cases, and test coverage gaps that need follow-up.",
  "Final decision after two weeks of debate. Trade-offs documented. Engineering and product both signed off.",
  "Customer asks, deal-blockers, and renewal risk indicators. Owner is on call for follow-up this week.",
  "Quarterly business review notes with executive summary, churn signals, and expansion opportunities.",
  "Component inventory, token system, and accessibility audit findings. Used by all four product surfaces.",
  "Draft RFC seeking feedback by Friday. Open questions flagged with @owner mentions in inline comments."
];

const SOURCES_FOR_TYPE: Record<DocType, string[]> = {
  doc: ["notion", "gdrive", "github"],
  decision: ["notion", "gdrive"],
  comm: ["slack", "gmail", "fireflies"],
  code: ["github", "vscode"],
  design: ["figma"],
  meeting: ["fireflies", "gdrive"],
  customer: ["gmail", "notion"]
};

const DOMAIN_KEYS: DomainId[] = ["northstar", "apollo", "acme", "engineering", "sales", "design", "onboarding", "legal"];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const DOCS: Doc[] = (() => {
  const docs: Doc[] = [];
  let idCounter = 1;
  const types: DocType[] = ["doc", "decision", "comm", "code", "design", "meeting", "customer"];
  for (const type of types) {
    const titles = TITLES_BY_TYPE[type];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const seed = hash(title + type + i);
      const uploader = PEOPLE[seed % PEOPLE.length];
      const sources = SOURCES_FOR_TYPE[type];
      const source = sources[seed % sources.length];
      const daysAgo = (seed % 60);
      const updatedAt = new Date(Date.UTC(2026, 4, 24, 9, 0) - daysAgo * 86400000).toISOString();
      const freshness: DocFreshness = daysAgo < 14 ? "active" : daysAgo < 35 ? "stale" : "historical";
      const domain = DOMAIN_KEYS[seed % DOMAIN_KEYS.length];
      docs.push({
        id: `d${idCounter++}`,
        title,
        type,
        source,
        summary: SUMMARIES[seed % SUMMARIES.length],
        uploader,
        updatedAt,
        fetchCount: (seed % 47) + 1,
        freshness,
        restricted: seed % 8 === 0,
        agentAccessible: seed % 9 !== 0,
        domain,
        project: domain === "northstar" ? "Northstar Cloud" : domain === "apollo" ? "Project Apollo" : domain === "acme" ? "Customer Acme" : undefined
      });
    }
  }
  // pad to ~140
  while (docs.length < 140) {
    const type = types[docs.length % types.length];
    const titles = TITLES_BY_TYPE[type];
    const title = titles[docs.length % titles.length] + ` (rev ${Math.floor(docs.length / titles.length) + 1})`;
    const seed = hash(title + type + docs.length);
    const uploader = PEOPLE[seed % PEOPLE.length];
    const sources = SOURCES_FOR_TYPE[type];
    const source = sources[seed % sources.length];
    const daysAgo = (seed % 60);
    const updatedAt = new Date(Date.UTC(2026, 4, 24, 9, 0) - daysAgo * 86400000).toISOString();
    const freshness: DocFreshness = daysAgo < 14 ? "active" : daysAgo < 35 ? "stale" : "historical";
    const domain = DOMAIN_KEYS[seed % DOMAIN_KEYS.length];
    docs.push({
      id: `d${idCounter++}`,
      title,
      type,
      source,
      summary: SUMMARIES[seed % SUMMARIES.length],
      uploader,
      updatedAt,
      fetchCount: (seed % 47) + 1,
      freshness,
      restricted: seed % 8 === 0,
      agentAccessible: seed % 9 !== 0,
      domain
    });
  }
  return docs;
})();

/* Relationship Web nodes */
export type WebNodeType = "project" | "doc" | "decision" | "person" | "customer";

export type WebNode = {
  id: string;
  label: string;
  type: WebNodeType;
  group?: string;
  size: number;
};

export type WebLink = {
  source: string;
  target: string;
  weight: number;
};

export const WEB_NODES: WebNode[] = [
  // Projects (central)
  { id: "p-northstar", label: "Northstar Cloud", type: "project", size: 22 },
  { id: "p-payments", label: "Payments v2", type: "project", size: 20 },
  { id: "p-onboarding", label: "Onboarding Redesign", type: "project", size: 18 },
  { id: "p-acme", label: "Acme Integration", type: "project", size: 18 },
  // Docs
  { id: "doc-arch", label: "Architecture RFC", type: "doc", size: 12 },
  { id: "doc-auth", label: "Auth migration", type: "doc", size: 11 },
  { id: "doc-billing", label: "Billing webhook spec", type: "doc", size: 11 },
  { id: "doc-tokens", label: "Design tokens", type: "doc", size: 10 },
  { id: "doc-runbook", label: "Incident runbook", type: "doc", size: 10 },
  { id: "doc-pricing", label: "Pricing model", type: "doc", size: 11 },
  { id: "doc-sso", label: "SSO requirements", type: "doc", size: 10 },
  { id: "doc-onboarding", label: "Onboarding flow v3", type: "doc", size: 11 },
  // Decisions
  { id: "dec-jwt", label: "JWT over sessions", type: "decision", size: 10 },
  { id: "dec-stripe", label: "Stripe for billing", type: "decision", size: 10 },
  { id: "dec-rest", label: "REST-first API", type: "decision", size: 9 },
  { id: "dec-aurora", label: "Aurora migration", type: "decision", size: 9 },
  { id: "dec-pricing", label: "Yearly pricing", type: "decision", size: 9 },
  // People
  { id: "per-kartikeya", label: "Kartikeya", type: "person", size: 9 },
  { id: "per-sarah", label: "Sarah Chen", type: "person", size: 9 },
  { id: "per-adhiraj", label: "Adhiraj", type: "person", size: 8 },
  { id: "per-prabh", label: "Prabh", type: "person", size: 8 },
  { id: "per-mannan", label: "Mannan", type: "person", size: 8 },
  { id: "per-marcus", label: "Marcus T", type: "person", size: 8 },
  { id: "per-mei", label: "Mei Chen", type: "person", size: 8 },
  { id: "per-hiroshi", label: "Hiroshi T", type: "person", size: 8 },
  { id: "per-lisa", label: "Lisa Foster", type: "person", size: 8 },
  // Customers
  { id: "cust-acme", label: "Acme Corp", type: "customer", size: 12 },
  { id: "cust-apollo", label: "Apollo Labs", type: "customer", size: 11 },
  { id: "cust-helios", label: "Helios Robotics", type: "customer", size: 10 },
  { id: "cust-meridian", label: "Meridian Bank", type: "customer", size: 11 }
];

export const WEB_LINKS: WebLink[] = [
  // Northstar connections
  { source: "p-northstar", target: "doc-arch", weight: 3 },
  { source: "p-northstar", target: "doc-auth", weight: 2 },
  { source: "p-northstar", target: "doc-runbook", weight: 2 },
  { source: "p-northstar", target: "dec-jwt", weight: 3 },
  { source: "p-northstar", target: "dec-aurora", weight: 2 },
  { source: "p-northstar", target: "per-kartikeya", weight: 3 },
  { source: "p-northstar", target: "per-adhiraj", weight: 2 },
  { source: "p-northstar", target: "per-hiroshi", weight: 2 },
  { source: "p-northstar", target: "cust-meridian", weight: 2 },
  // Payments v2
  { source: "p-payments", target: "doc-billing", weight: 3 },
  { source: "p-payments", target: "dec-stripe", weight: 3 },
  { source: "p-payments", target: "dec-rest", weight: 2 },
  { source: "p-payments", target: "per-prabh", weight: 3 },
  { source: "p-payments", target: "per-marcus", weight: 2 },
  { source: "p-payments", target: "cust-apollo", weight: 2 },
  { source: "p-payments", target: "doc-pricing", weight: 2 },
  // Onboarding
  { source: "p-onboarding", target: "doc-onboarding", weight: 3 },
  { source: "p-onboarding", target: "doc-tokens", weight: 2 },
  { source: "p-onboarding", target: "per-sarah", weight: 3 },
  { source: "p-onboarding", target: "per-mannan", weight: 2 },
  { source: "p-onboarding", target: "per-lisa", weight: 2 },
  // Acme
  { source: "p-acme", target: "doc-sso", weight: 3 },
  { source: "p-acme", target: "cust-acme", weight: 3 },
  { source: "p-acme", target: "per-mei", weight: 2 },
  { source: "p-acme", target: "per-marcus", weight: 2 },
  { source: "p-acme", target: "doc-billing", weight: 2 },
  // Cross links
  { source: "doc-arch", target: "dec-jwt", weight: 2 },
  { source: "doc-arch", target: "dec-rest", weight: 1 },
  { source: "doc-billing", target: "dec-stripe", weight: 2 },
  { source: "doc-pricing", target: "dec-pricing", weight: 2 },
  { source: "doc-tokens", target: "per-sarah", weight: 2 },
  { source: "doc-sso", target: "doc-auth", weight: 1 },
  { source: "cust-acme", target: "doc-sso", weight: 2 },
  { source: "cust-apollo", target: "doc-pricing", weight: 1 },
  { source: "cust-helios", target: "p-northstar", weight: 1 },
  { source: "per-kartikeya", target: "doc-arch", weight: 2 },
  { source: "per-sarah", target: "doc-onboarding", weight: 2 }
];

export type Agent = {
  id: string;
  name: string;
  tagline: string;
  lastActive: string;
  activity: string;
};

export const AGENTS: Agent[] = [
  {
    id: "scout",
    name: "Scout",
    tagline: "Finds context for what you're about to do",
    lastActive: "2026-05-24T09:11:00Z",
    activity: "Indexed 12 files from GitHub · 4m ago"
  },
  {
    id: "historian",
    name: "Historian",
    tagline: "Explains why decisions were made",
    lastActive: "2026-05-24T09:03:00Z",
    activity: "Answered \"why JWT\" for Kartikeya · 12m ago"
  },
  {
    id: "connector",
    name: "Connector",
    tagline: "Finds who knows what",
    lastActive: "2026-05-24T08:48:00Z",
    activity: "Linked Mei to Acme SSO thread · 27m ago"
  },
  {
    id: "curator",
    name: "Curator",
    tagline: "Flags stale, missing, or conflicting knowledge",
    lastActive: "2026-05-24T09:07:00Z",
    activity: "Flagged 3 stale memories · 8m ago"
  },
  {
    id: "onboarder",
    name: "Onboarder",
    tagline: "Personalizes knowledge tours for new hires",
    lastActive: "2026-05-23T17:42:00Z",
    activity: "Prepared welcome pack for Yuki · 16h ago"
  }
];

export const AGENT_FEED = [
  { id: "f1", text: "Scout · indexed 12 files from GitHub · 4m ago" },
  { id: "f2", text: "Curator · flagged 3 stale memories · 8m ago" },
  { id: "f3", text: "Historian · answered 'why JWT' for Kartikeya · 12m ago" },
  { id: "f4", text: "Connector · linked Mei to Acme SSO thread · 27m ago" },
  { id: "f5", text: "Scout · surfaced billing webhook RFC for Prabh · 42m ago" },
  { id: "f6", text: "Curator · resolved 1 conflict in pricing decisions · 1h ago" },
  { id: "f7", text: "Onboarder · prepared welcome pack for Yuki · 16h ago" },
  { id: "f8", text: "Historian · explained Aurora migration to Hiroshi · 1d ago" }
];

export type PulseConflict = {
  id: string;
  title: string;
  desc: string;
};

export const CONFLICTS: PulseConflict[] = [
  {
    id: "c1",
    title: "Pricing tier: yearly vs monthly billing",
    desc: "Two decisions documents disagree on default plan duration."
  },
  {
    id: "c2",
    title: "Auth: refresh token TTL",
    desc: "Engineering RFC says 30d; runbook says 7d."
  },
  {
    id: "c3",
    title: "Acme SSO: SAML vs OIDC",
    desc: "Customer call notes contradict the requirements doc."
  },
  {
    id: "c4",
    title: "Onboarding step count",
    desc: "Design spec shows 4 steps; PRD shows 5."
  }
];

export const GAPS = [
  { id: "g1", title: "Missing runbook for Aurora failover" },
  { id: "g2", title: "No documented rollback for billing webhooks" },
  { id: "g3", title: "Acme implementation gaps unrecorded" }
];

export const STALE = [
  { id: "s1", title: "Frontend perf budget (last updated 89d ago)" },
  { id: "s2", title: "Internal SDK release notes (74d)" },
  { id: "s3", title: "Onboarding empty states (62d)" }
];

export const TOP_FETCHED = [
  { id: "t1", title: "Auth migration strategy", fetches: 47 },
  { id: "t2", title: "Decision: JWT over sessions", fetches: 41 },
  { id: "t3", title: "Billing webhook spec", fetches: 38 }
];

export const PENDING_REVIEW = 7;

export type IngestionFlow = {
  sourceId: string;
  active: boolean;
};

export const INGESTION_FLOWS: IngestionFlow[] = [
  { sourceId: "github", active: true },
  { sourceId: "gdrive", active: true },
  { sourceId: "slack", active: true },
  { sourceId: "notion", active: false },
  { sourceId: "figma", active: true },
  { sourceId: "linear", active: false },
  { sourceId: "gmail", active: true },
  { sourceId: "fireflies", active: false }
];
