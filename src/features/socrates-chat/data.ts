/* Socrates — canned demo conversations + artifact registry */

export type ArtifactKind =
  | "calendar"
  | "metrics"
  | "arch"
  | "org"
  | "decisions"
  | "compare"
  | "code"
  | "doc"
  | "graph";

export type ArtifactSpec = {
  id: string;
  kind: ArtifactKind;
  title: string;
  subtitle?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  artifact?: ArtifactSpec;
  timestamp: string;
  citations?: { label: string; source: string }[];
};

export type Suggestion = {
  text: string;
  kind: ArtifactKind;
};

export const SUGGESTIONS: Suggestion[] = [
  { text: "Show me the team's week", kind: "calendar" },
  { text: "How does our auth system work?", kind: "arch" },
  { text: "Compare JWT vs session cookies", kind: "compare" },
  { text: "Show retrieval latency over time", kind: "metrics" },
  { text: "Who owns Northstar Cloud?", kind: "org" },
  { text: "Walk me through the pricing decision", kind: "decisions" },
  { text: "Draft an RFC for the cache layer", kind: "doc" },
  { text: "Generate the rate limiter middleware", kind: "code" },
  { text: "Map dependencies between projects", kind: "graph" }
];

type Template = {
  triggers: string[];
  reply: string;
  artifact: ArtifactSpec;
  citations?: { label: string; source: string }[];
};

export const TEMPLATES: Template[] = [
  {
    triggers: ["calendar", "week", "schedule", "team's week", "meetings"],
    reply: "Here's the engineering team's week. I've highlighted the three commitments that don't have an owner yet — those are the most likely to slip. Hover any block for the room and attendees.",
    artifact: { id: "art-cal", kind: "calendar", title: "Engineering · week of May 25", subtitle: "23 events · 3 unassigned" },
    citations: [
      { label: "Google Calendar", source: "calendar" },
      { label: "Linear epic E-42", source: "linear" }
    ]
  },
  {
    triggers: ["auth", "jwt", "how does", "system work", "architecture"],
    reply: "Northstar uses a stateless JWT flow. Refresh tokens (30d) live in HttpOnly cookies; access tokens (15m) are passed in the Authorization header. The edge gateway verifies the JWT signature before any request reaches the API tier. Aurora handles user lookups via the user-cache shard.",
    artifact: { id: "art-arch", kind: "arch", title: "Northstar auth · request flow", subtitle: "edge → gateway → API → aurora" },
    citations: [
      { label: "dec-jwt", source: "decisions" },
      { label: "Auth migration RFC", source: "notion" },
      { label: "northstar/api/auth.ts", source: "github" }
    ]
  },
  {
    triggers: ["compare", "jwt vs", "vs session", "tradeoff", "trade-off"],
    reply: "Both are valid. Sessions win on revocation, JWTs win on horizontal scaling. We chose JWT because the read tier sits behind two CDN regions and the session lookup hop was adding 80ms p50. Here's the side-by-side from the original decision doc.",
    artifact: { id: "art-cmp", kind: "compare", title: "JWT vs session cookies", subtitle: "decision from Mar 2026" },
    citations: [{ label: "dec-jwt", source: "decisions" }]
  },
  {
    triggers: ["latency", "metric", "plot", "retrieval", "performance", "p50", "p99"],
    reply: "P50 retrieval is steady at 142ms. We saw a spike around May 18 when the embedding index was rebuilt — the cache miss rate jumped to 19% for an hour. Everything's been quiet since.",
    artifact: { id: "art-metrics", kind: "metrics", title: "Retrieval latency · 14 days", subtitle: "P50 · P95 · P99" }
  },
  {
    triggers: ["owns", "owner", "who owns", "team", "org", "people"],
    reply: "Kartikeya leads Northstar Cloud. Reporting in: Adhiraj (backend), Hiroshi (platform), Aanya (DX). Cross-functional partners are Sarah (design) and Marcus (PM). Lisa from sales sits in the weekly review.",
    artifact: { id: "art-org", kind: "org", title: "Northstar Cloud · ownership", subtitle: "6 contributors · 2 partners" }
  },
  {
    triggers: ["pricing", "decision", "history", "why did", "rationale"],
    reply: "The pricing decision went through four iterations across six weeks. The final structure (yearly default, monthly opt-in, enterprise gated) emerged from the Apr 8 customer panel. Acme and Apollo both asked for yearly procurement terms — that tipped it.",
    artifact: { id: "art-dec", kind: "decisions", title: "Pricing model · decision timeline", subtitle: "Apr–May 2026 · 4 milestones" },
    citations: [
      { label: "Pricing committee notes", source: "notion" },
      { label: "Customer call · Acme", source: "fireflies" }
    ]
  },
  {
    triggers: ["rfc", "draft", "spec", "write", "cache layer", "design"],
    reply: "Drafted. I've pulled from the existing edge-cache notes, the perf budget RFC, and the Aurora migration plan. Open the artifact to edit inline.",
    artifact: { id: "art-doc", kind: "doc", title: "RFC · Edge cache layer", subtitle: "draft · 4 sections · 1,240 words" }
  },
  {
    triggers: ["rate limit", "middleware", "code", "generate", "implement"],
    reply: "Here's a token-bucket rate limiter as Express middleware. It uses Redis for shared state and falls back to in-memory under partition. The numbers default to 100 req/min per IP — adjust the `limit` and `window` to match the rate plan.",
    artifact: { id: "art-code", kind: "code", title: "rate-limiter.ts", subtitle: "Express middleware · TypeScript" }
  },
  {
    triggers: ["depend", "map", "connection", "graph", "between projects", "dependencies"],
    reply: "Five active projects, twelve shared dependencies. Northstar Cloud is the upstream for three of them — any breaking change there ripples to Payments v2 and Onboarding. Acme integration is the most isolated.",
    artifact: { id: "art-graph", kind: "graph", title: "Project dependencies", subtitle: "5 projects · 12 edges" }
  }
];

export const FALLBACK_REPLY = "I can pull from the company brain to answer that. Here's what I'm thinking — let me know if you want me to dig deeper into any of the citations.";

export function findTemplate(query: string): Template | null {
  const q = query.toLowerCase();
  for (const t of TEMPLATES) {
    for (const trigger of t.triggers) {
      if (q.includes(trigger.toLowerCase())) {
        return t;
      }
    }
  }
  return null;
}

/* ============ Artifact data ============ */

export const CALENDAR_EVENTS = [
  { day: 0, hour: 9.5, dur: 1, title: "Northstar standup", attendees: 6, room: "Atrium", owner: "Kartikeya", unassigned: false },
  { day: 0, hour: 11, dur: 0.5, title: "1:1 · Adhiraj", attendees: 2, room: "huddle 3", owner: "Kartikeya", unassigned: false },
  { day: 0, hour: 14, dur: 1.5, title: "Aurora migration review", attendees: 4, room: "Cedar", owner: "Hiroshi", unassigned: false },
  { day: 1, hour: 10, dur: 1, title: "Design review · onboarding v3", attendees: 5, room: "Pine", owner: "Sarah", unassigned: false },
  { day: 1, hour: 13, dur: 2, title: "Customer call · Acme QBR", attendees: 4, room: "Cedar", owner: null, unassigned: true },
  { day: 2, hour: 9, dur: 1, title: "Northstar standup", attendees: 6, room: "Atrium", owner: "Kartikeya", unassigned: false },
  { day: 2, hour: 11, dur: 1.5, title: "Pricing committee", attendees: 7, room: "Boardroom", owner: "Marcus", unassigned: false },
  { day: 2, hour: 15, dur: 1, title: "Security review", attendees: 3, room: "Pine", owner: null, unassigned: true },
  { day: 3, hour: 9.5, dur: 0.5, title: "Stand-up", attendees: 6, room: "Atrium", owner: "Kartikeya", unassigned: false },
  { day: 3, hour: 11, dur: 1, title: "RFC walk-through · cache", attendees: 5, room: "Cedar", owner: "Adhiraj", unassigned: false },
  { day: 3, hour: 14, dur: 1, title: "Hiring loop debrief", attendees: 4, room: "Pine", owner: "Prabh", unassigned: false },
  { day: 4, hour: 10, dur: 1, title: "All-hands prep", attendees: 8, room: "Atrium", owner: null, unassigned: true },
  { day: 4, hour: 13, dur: 1, title: "Apollo data residency", attendees: 3, room: "huddle 3", owner: "Hiroshi", unassigned: false },
  { day: 4, hour: 15.5, dur: 1, title: "Investor update review", attendees: 4, room: "Boardroom", owner: "Marcus", unassigned: false }
];

export const ARCH_NODES = [
  { id: "client", label: "Client", col: 0, row: 1, kind: "external" },
  { id: "edge", label: "Edge Gateway", col: 1, row: 1, kind: "edge" },
  { id: "jwks", label: "JWKS verifier", col: 1, row: 2.4, kind: "edge" },
  { id: "api", label: "Northstar API", col: 2, row: 1, kind: "service" },
  { id: "cache", label: "User cache", col: 2, row: 2.4, kind: "cache" },
  { id: "aurora", label: "Aurora · primary", col: 3, row: 0.6, kind: "db" },
  { id: "replica", label: "Aurora · replica", col: 3, row: 1.6, kind: "db" },
  { id: "audit", label: "Audit log", col: 3, row: 2.6, kind: "queue" }
];

export const ARCH_EDGES = [
  { from: "client", to: "edge", label: "HTTPS" },
  { from: "edge", to: "jwks", label: "verify" },
  { from: "edge", to: "api", label: "forward" },
  { from: "api", to: "cache", label: "lookup" },
  { from: "api", to: "aurora", label: "writes" },
  { from: "api", to: "replica", label: "reads" },
  { from: "api", to: "audit", label: "emit" }
];

export const COMPARE_DATA = {
  left: {
    name: "JWT (chosen)",
    tone: "accent" as const,
    rows: [
      { k: "Scale", v: "Stateless · horizontal" },
      { k: "Revoke", v: "Requires blocklist or short TTL" },
      { k: "Latency", v: "0 extra hop" },
      { k: "Storage", v: "None at edge" },
      { k: "Refresh", v: "30d HttpOnly cookie" },
      { k: "Risk", v: "Token theft via XSS (low)" }
    ]
  },
  right: {
    name: "Sessions",
    tone: "muted" as const,
    rows: [
      { k: "Scale", v: "Stateful · session store needed" },
      { k: "Revoke", v: "Instant — delete row" },
      { k: "Latency", v: "+1 DB lookup (~80ms p50)" },
      { k: "Storage", v: "Redis cluster" },
      { k: "Refresh", v: "Server-managed expiry" },
      { k: "Risk", v: "Session fixation (mitigated)" }
    ]
  },
  verdict: "JWT shipped. Revocation handled by 15-minute access-token TTL + edge-side blocklist for compromised refresh tokens."
};

export const METRICS_DATA = {
  series: [
    { name: "P50", color: "#7A8C5F", values: [128, 132, 130, 135, 142, 138, 144, 140, 142, 245, 168, 144, 140, 142] },
    { name: "P95", color: "#C28840", values: [284, 292, 280, 296, 312, 304, 318, 308, 310, 540, 384, 320, 308, 312] },
    { name: "P99", color: "#9E3B2E", values: [612, 622, 605, 638, 660, 651, 672, 655, 666, 1180, 820, 678, 657, 666] }
  ],
  callouts: [
    { day: 9, label: "embedding index rebuild · cache miss spike" }
  ]
};

export const ORG_NODES = [
  { id: "kartikeya", name: "Kartikeya Rao", role: "Tech Lead · Northstar", color: "#B8543D", reportsTo: null, kind: "lead" },
  { id: "adhiraj", name: "Adhiraj Singh", role: "Backend", color: "#7A8C5F", reportsTo: "kartikeya", kind: "ic" },
  { id: "hiroshi", name: "Hiroshi Tanaka", role: "Platform", color: "#2D4A3E", reportsTo: "kartikeya", kind: "ic" },
  { id: "aanya", name: "Aanya Iyer", role: "DX", color: "#6B6259", reportsTo: "kartikeya", kind: "ic" },
  { id: "sarah", name: "Sarah Chen", role: "Design partner", color: "#3B82C4", reportsTo: null, kind: "partner" },
  { id: "marcus", name: "Marcus Thompson", role: "PM partner", color: "#5E7A8C", reportsTo: null, kind: "partner" },
  { id: "lisa", name: "Lisa Foster", role: "Sales · attends weekly", color: "#9E3B2E", reportsTo: null, kind: "guest" }
];

export const DECISIONS = [
  { date: "Apr 04", title: "Apollo expansion brings pricing to the table", who: "Marcus", body: "Apollo asks for yearly procurement terms in their renewal call. Marcus flags this could conflict with our current monthly-default plan.", kind: "trigger" },
  { date: "Apr 08", title: "Customer panel · 5 enterprise buyers", who: "Sales", body: "All five prefer yearly. Two would refuse to onboard on a month-to-month plan. One asks for a tiered enterprise rate.", kind: "research" },
  { date: "Apr 22", title: "Pricing options drafted (v1)", who: "Marcus, Kartikeya", body: "Three options: keep monthly, switch to yearly default, dual default with sales-led upsell. Engineering effort estimated at 4–6 weeks per option.", kind: "design" },
  { date: "May 06", title: "Yearly default w/ monthly opt-in · ratified", who: "Pricing committee", body: "Final shape: yearly default at 12 months, monthly available with 18% surcharge, enterprise tier gated behind sales. Rolls out June 1.", kind: "decision" }
];

export const RFC_DOC = {
  title: "RFC · Edge Cache Layer",
  status: "Draft · awaiting review",
  author: "Adhiraj Singh",
  sections: [
    {
      heading: "Context",
      body: "Northstar's API tier is averaging 142ms P50 for authenticated reads. The dominant cost is the user-profile lookup, which hits the Aurora replica on every request. Caching at the edge would cut this to under 20ms for warm tenants."
    },
    {
      heading: "Proposal",
      body: "Introduce a per-tenant edge cache with 5-minute TTL, invalidated on profile mutations via a fanout queue. Cache stores the JWT-derived subject claim, role array, and feature flags. Cache miss falls back to the existing read path."
    },
    {
      heading: "Alternatives considered",
      body: "1. In-memory cache at the API tier — rejected, doesn't help cross-region. 2. Aurora read replica per region — too expensive at our current scale. 3. Push-based cache (server-sent updates) — over-engineered for this surface."
    },
    {
      heading: "Open questions",
      body: "How do we handle cache invalidation when a tenant churns mid-session? Adhiraj proposes a soft-delete with grace TTL. Hiroshi wants a hard purge. Decision needed by Friday."
    }
  ]
};

export const CODE_SAMPLE = `import type { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

type RateLimitOpts = {
  limit: number;       // requests
  window: number;      // seconds
  keyFn?: (req: Request) => string;
};

export function rateLimit({ limit, window, keyFn }: RateLimitOpts) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = \`rl:\${keyFn ? keyFn(req) : req.ip}\`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, window);
    }
    if (count > limit) {
      const ttl = await redis.ttl(key);
      res.setHeader("Retry-After", String(ttl));
      return res.status(429).json({
        error: "rate_limited",
        retry_after: ttl
      });
    }
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - count)));
    next();
  };
}
`;

export const GRAPH_DATA = {
  nodes: [
    { id: "northstar", label: "Northstar Cloud", kind: "platform", weight: 22 },
    { id: "payments", label: "Payments v2", kind: "product", weight: 18 },
    { id: "onboarding", label: "Onboarding Redesign", kind: "product", weight: 16 },
    { id: "acme", label: "Acme Integration", kind: "customer", weight: 14 },
    { id: "apollo", label: "Apollo Expansion", kind: "customer", weight: 14 },
    { id: "billing", label: "Billing Service", kind: "service", weight: 13 },
    { id: "auth", label: "Auth Service", kind: "service", weight: 15 },
    { id: "design", label: "Design System", kind: "library", weight: 12 }
  ],
  edges: [
    { from: "northstar", to: "auth", strength: 3 },
    { from: "northstar", to: "billing", strength: 2 },
    { from: "payments", to: "billing", strength: 3 },
    { from: "payments", to: "auth", strength: 2 },
    { from: "onboarding", to: "design", strength: 3 },
    { from: "onboarding", to: "auth", strength: 1 },
    { from: "acme", to: "auth", strength: 2 },
    { from: "acme", to: "billing", strength: 2 },
    { from: "apollo", to: "northstar", strength: 2 },
    { from: "apollo", to: "billing", strength: 2 },
    { from: "billing", to: "northstar", strength: 1 },
    { from: "auth", to: "northstar", strength: 1 }
  ]
};
