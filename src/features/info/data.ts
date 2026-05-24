// Realistic dummy data for the Info / Operator-View page.
// 47 people, 12 projects, 8 blockers, 18 ship entries, 6 open roles.

export type Team = "Engineering" | "Design" | "Product" | "GTM" | "Ops";

export type WorkloadLevel = "light" | "balanced" | "high" | "overloaded";

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: Team;
  manager: string;
  joined: string; // ISO date
  currentFocus: string; // mono line
  workload: WorkloadLevel;
  workloadPct: number; // 0-130
  tool: "vscode" | "cursor" | "claude" | "figma" | "notion" | "linear";
  lastActive: string; // mono "4m ago"
  activeTasks: { id: string; title: string; status: "in-progress" | "review" | "blocked" | "done" }[];
  shippedLast7d: { what: string; project: string; when: string }[];
  workloadTrend: number[]; // 8 weeks sparkline
  skills: string[];
  ownership: string[];
  status: "active" | "on-leave" | "new";
  projects: string[]; // project ids
};

export type ProjectHealth = "healthy" | "at-risk" | "off-track";
export type ProjectVelocity = "improving" | "flat" | "declining";

export type Project = {
  id: string;
  name: string;
  description: string;
  health: ProjectHealth;
  team: Team;
  teamLead: string; // person id
  teamSize: number;
  nextMilestone: string;
  daysToDeadline: number;
  velocity: ProjectVelocity;
  lastShipped: { what: string; when: string };
  openBlockers: number;
  activeBlockers: { who: string; what: string }[];
  milestones: { name: string; date: string; state: "done" | "current" | "upcoming" }[];
  shippingLog: { what: string; by: string; when: string }[];
  linkedDocs: { kind: "rfc" | "decision" | "doc"; title: string }[];
};

export type Blocker = {
  id: string;
  whoId: string;
  what: string;
  waitingOn: string;
  ageHours: number;
  projectId: string;
};

export type ShipEntry = {
  id: string;
  byId: string;
  what: string;
  projectId: string;
  when: string;
  type: "feature" | "fix" | "refactor" | "docs" | "decision";
};

export type OpenRole = {
  id: string;
  title: string;
  team: Team;
  stage: "sourcing" | "interview" | "offer";
  candidates: number;
  openedDays: number;
};

export type AttentionItem = {
  id: string;
  severity: "red" | "amber";
  message: string;
  action: string;
  targetId?: string;
};

const personSeed: Omit<Person, "id" | "initials" | "activeTasks" | "shippedLast7d" | "workloadTrend" | "skills" | "ownership" | "projects">[] = [
  // Engineering — 22 people
  { name: "Mannan Arora", role: "Senior Backend Engineer", team: "Engineering", manager: "Sarah Chen", joined: "2023-04-11", currentFocus: "services/auth/middleware.ts · feat/cookie-rotation", workload: "overloaded", workloadPct: 124, tool: "cursor", lastActive: "3m ago", status: "active" },
  { name: "Priya Kumar", role: "Staff Engineer", team: "Engineering", manager: "Sarah Chen", joined: "2022-01-18", currentFocus: "platform/queue/scheduler.go · main", workload: "high", workloadPct: 92, tool: "vscode", lastActive: "1m ago", status: "active" },
  { name: "Adhiraj Singh", role: "Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2024-02-03", currentFocus: "src/pages/Dashboard.tsx · feat/dashboard-cards", workload: "balanced", workloadPct: 71, tool: "vscode", lastActive: "8m ago", status: "active" },
  { name: "Marcus Thompson", role: "Engineering Manager", team: "Engineering", manager: "Sarah Chen", joined: "2021-09-02", currentFocus: "1:1s · roadmap/Q3.md", workload: "high", workloadPct: 88, tool: "notion", lastActive: "12m ago", status: "active" },
  { name: "Wei Zhang", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2023-08-12", currentFocus: "services/payments/charge.ts · fix/idempotency", workload: "balanced", workloadPct: 68, tool: "cursor", lastActive: "2m ago", status: "active" },
  { name: "Aanya Iyer", role: "Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2023-11-22", currentFocus: "src/features/checkout/Cart.tsx · feat/v2", workload: "balanced", workloadPct: 74, tool: "cursor", lastActive: "5m ago", status: "active" },
  { name: "Hiroshi Tanaka", role: "Infrastructure Engineer", team: "Engineering", manager: "Sarah Chen", joined: "2022-06-14", currentFocus: "infra/terraform/eu-west-1/ · main", workload: "high", workloadPct: 95, tool: "vscode", lastActive: "14m ago", status: "active" },
  { name: "Emily Carter", role: "Senior Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2022-03-20", currentFocus: "design-system/tokens.ts · feat/dark-mode", workload: "balanced", workloadPct: 70, tool: "vscode", lastActive: "21m ago", status: "active" },
  { name: "Rohan Mehta", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2024-08-05", currentFocus: "services/notifications/dispatch.go · main", workload: "light", workloadPct: 42, tool: "cursor", lastActive: "1h ago", status: "new" },
  { name: "Sofia Alvarez", role: "Senior Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2022-10-30", currentFocus: "services/billing/invoice.ts · feat/proration", workload: "high", workloadPct: 91, tool: "cursor", lastActive: "4m ago", status: "active" },
  { name: "Daniel Park", role: "Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2023-06-12", currentFocus: "src/pages/Settings.tsx · feat/profile-prefs", workload: "balanced", workloadPct: 65, tool: "vscode", lastActive: "32m ago", status: "active" },
  { name: "Ishaan Verma", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2024-01-09", currentFocus: "services/search/indexer.ts · feat/embeddings", workload: "high", workloadPct: 98, tool: "cursor", lastActive: "7m ago", status: "active" },
  { name: "Mei Lin Wu", role: "Mobile Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2023-02-28", currentFocus: "ios/CheckoutVC.swift · feat/applepay", workload: "balanced", workloadPct: 72, tool: "vscode", lastActive: "18m ago", status: "active" },
  { name: "Kavya Reddy", role: "QA Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2023-09-15", currentFocus: "tests/e2e/checkout.spec.ts · main", workload: "light", workloadPct: 50, tool: "vscode", lastActive: "2h ago", status: "active" },
  { name: "James Wilson", role: "Senior Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2021-11-04", currentFocus: "src/components/Editor.tsx · feat/collab", workload: "high", workloadPct: 87, tool: "cursor", lastActive: "6m ago", status: "active" },
  { name: "Yuki Sato", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2024-07-22", currentFocus: "services/analytics/events.go · main", workload: "balanced", workloadPct: 66, tool: "cursor", lastActive: "11m ago", status: "new" },
  { name: "Arjun Patel", role: "Platform Engineer", team: "Engineering", manager: "Sarah Chen", joined: "2022-08-17", currentFocus: "platform/api-gateway/router.go · main", workload: "balanced", workloadPct: 73, tool: "vscode", lastActive: "9m ago", status: "active" },
  { name: "Olivia Bennett", role: "Frontend Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2023-05-29", currentFocus: "src/features/onboarding/Flow.tsx · main", workload: "on-leave" === "on-leave" ? "light" : "balanced", workloadPct: 0, tool: "vscode", lastActive: "4d ago", status: "on-leave" },
  { name: "Karan Joshi", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2024-03-04", currentFocus: "services/auth/oauth.ts · feat/google", workload: "balanced", workloadPct: 64, tool: "cursor", lastActive: "13m ago", status: "active" },
  { name: "Diana Romero", role: "Engineering Manager", team: "Engineering", manager: "Sarah Chen", joined: "2022-04-25", currentFocus: "planning · sprint/24", workload: "high", workloadPct: 90, tool: "notion", lastActive: "22m ago", status: "active" },
  { name: "Tomohiro Kato", role: "Senior Mobile Engineer", team: "Engineering", manager: "Marcus Thompson", joined: "2022-12-11", currentFocus: "android/CheckoutFragment.kt · main", workload: "balanced", workloadPct: 76, tool: "vscode", lastActive: "27m ago", status: "active" },
  { name: "Neha Sharma", role: "Backend Engineer", team: "Engineering", manager: "Priya Kumar", joined: "2024-09-20", currentFocus: "services/billing/webhook.ts · main", workload: "light", workloadPct: 38, tool: "cursor", lastActive: "45m ago", status: "new" },

  // Design — 8 people
  { name: "Sana Iqbal", role: "Design Lead", team: "Design", manager: "Lisa Foster", joined: "2021-07-08", currentFocus: "figma · Checkout v2 / final", workload: "high", workloadPct: 89, tool: "figma", lastActive: "4m ago", status: "active" },
  { name: "Alex Park", role: "Product Designer", team: "Design", manager: "Sana Iqbal", joined: "2023-03-15", currentFocus: "figma · Dashboard refresh", workload: "balanced", workloadPct: 70, tool: "figma", lastActive: "9m ago", status: "active" },
  { name: "Camille Dubois", role: "Senior Product Designer", team: "Design", manager: "Sana Iqbal", joined: "2022-05-19", currentFocus: "figma · Settings IA", workload: "balanced", workloadPct: 68, tool: "figma", lastActive: "16m ago", status: "active" },
  { name: "Ravi Subramanian", role: "Product Designer", team: "Design", manager: "Sana Iqbal", joined: "2024-04-02", currentFocus: "figma · Onboarding flow", workload: "balanced", workloadPct: 72, tool: "figma", lastActive: "31m ago", status: "active" },
  { name: "Zara Khan", role: "Brand Designer", team: "Design", manager: "Sana Iqbal", joined: "2023-10-08", currentFocus: "brand · Q3 launch identity", workload: "light", workloadPct: 48, tool: "figma", lastActive: "1h ago", status: "active" },
  { name: "Noah Williams", role: "Design Systems Lead", team: "Design", manager: "Sana Iqbal", joined: "2022-09-14", currentFocus: "figma · tokens v3", workload: "high", workloadPct: 86, tool: "figma", lastActive: "12m ago", status: "active" },
  { name: "Yuna Cho", role: "Senior Product Designer", team: "Design", manager: "Sana Iqbal", joined: "2023-01-22", currentFocus: "figma · Admin console", workload: "balanced", workloadPct: 74, tool: "figma", lastActive: "26m ago", status: "active" },
  { name: "Anika Goyal", role: "Product Designer", team: "Design", manager: "Sana Iqbal", joined: "2024-06-10", currentFocus: "figma · Mobile checkout", workload: "light", workloadPct: 52, tool: "figma", lastActive: "38m ago", status: "new" },

  // Product — 7 people
  { name: "Lisa Foster", role: "VP Product", team: "Product", manager: "Sarah Chen", joined: "2021-02-15", currentFocus: "notion · Q3 strategy doc", workload: "high", workloadPct: 93, tool: "notion", lastActive: "6m ago", status: "active" },
  { name: "Vikram Bhatia", role: "Senior PM", team: "Product", manager: "Lisa Foster", joined: "2022-07-11", currentFocus: "linear · Payments revamp", workload: "high", workloadPct: 88, tool: "linear", lastActive: "2m ago", status: "active" },
  { name: "Hannah Becker", role: "Product Manager", team: "Product", manager: "Lisa Foster", joined: "2023-04-30", currentFocus: "linear · Agent platform v1", workload: "balanced", workloadPct: 75, tool: "linear", lastActive: "14m ago", status: "active" },
  { name: "Kunal Desai", role: "Product Manager", team: "Product", manager: "Lisa Foster", joined: "2023-09-04", currentFocus: "linear · DevX initiative", workload: "balanced", workloadPct: 69, tool: "linear", lastActive: "23m ago", status: "active" },
  { name: "Sophie Martin", role: "Senior PM", team: "Product", manager: "Lisa Foster", joined: "2022-11-28", currentFocus: "linear · Onboarding revamp", workload: "balanced", workloadPct: 71, tool: "linear", lastActive: "19m ago", status: "active" },
  { name: "Aditya Rao", role: "Product Manager", team: "Product", manager: "Lisa Foster", joined: "2024-05-13", currentFocus: "linear · Admin tooling", workload: "balanced", workloadPct: 66, tool: "linear", lastActive: "41m ago", status: "new" },
  { name: "Ji-Ho Lee", role: "Product Manager", team: "Product", manager: "Lisa Foster", joined: "2023-12-08", currentFocus: "linear · Search relevance", workload: "balanced", workloadPct: 73, tool: "linear", lastActive: "33m ago", status: "active" },

  // GTM — 6 people
  { name: "Rachel Goldberg", role: "Head of Sales", team: "GTM", manager: "Sarah Chen", joined: "2021-12-01", currentFocus: "salesforce · Q3 pipeline", workload: "high", workloadPct: 87, tool: "notion", lastActive: "8m ago", status: "active" },
  { name: "Sneha Pillai", role: "Account Executive", team: "GTM", manager: "Rachel Goldberg", joined: "2023-06-19", currentFocus: "salesforce · Acme renewal", workload: "balanced", workloadPct: 72, tool: "notion", lastActive: "17m ago", status: "active" },
  { name: "Tom Andersson", role: "Marketing Lead", team: "GTM", manager: "Sarah Chen", joined: "2022-08-08", currentFocus: "notion · Q3 launch plan", workload: "high", workloadPct: 84, tool: "notion", lastActive: "11m ago", status: "active" },
  { name: "Pooja Krishnan", role: "Content Lead", team: "GTM", manager: "Tom Andersson", joined: "2023-03-27", currentFocus: "notion · Customer stories", workload: "balanced", workloadPct: 67, tool: "notion", lastActive: "29m ago", status: "active" },
  { name: "Liam O'Connor", role: "Account Executive", team: "GTM", manager: "Rachel Goldberg", joined: "2024-02-14", currentFocus: "salesforce · Northstar deal", workload: "balanced", workloadPct: 70, tool: "notion", lastActive: "44m ago", status: "new" },
  { name: "Mira Hassan", role: "Growth Marketer", team: "GTM", manager: "Tom Andersson", joined: "2023-11-06", currentFocus: "ads · Q3 campaign brief", workload: "balanced", workloadPct: 65, tool: "notion", lastActive: "51m ago", status: "active" },

  // Ops — 4 people
  { name: "Sarah Chen", role: "Founder, CEO", team: "Ops", manager: "—", joined: "2020-05-04", currentFocus: "notion · Investor update Q3", workload: "high", workloadPct: 94, tool: "notion", lastActive: "1m ago", status: "active" },
  { name: "David Okonkwo", role: "Head of People", team: "Ops", manager: "Sarah Chen", joined: "2022-02-22", currentFocus: "notion · Hiring rubric v2", workload: "balanced", workloadPct: 72, tool: "notion", lastActive: "24m ago", status: "active" },
  { name: "Meera Nair", role: "Head of Finance", team: "Ops", manager: "Sarah Chen", joined: "2021-10-17", currentFocus: "sheets · Burn analysis Q3", workload: "balanced", workloadPct: 78, tool: "notion", lastActive: "37m ago", status: "active" },
  { name: "Chen Wei", role: "Operations Manager", team: "Ops", manager: "Sarah Chen", joined: "2023-08-30", currentFocus: "notion · Vendor consolidation", workload: "light", workloadPct: 55, tool: "notion", lastActive: "1h ago", status: "active" }
];

function makeInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");
}

const projectAssignments: Record<string, string[]> = {
  "northstar-cloud": ["mannan-arora", "priya-kumar", "wei-zhang", "hiroshi-tanaka", "arjun-patel", "diana-romero", "vikram-bhatia", "sana-iqbal", "noah-williams"],
  "payments-revamp": ["mannan-arora", "sofia-alvarez", "wei-zhang", "aanya-iyer", "mei-lin-wu", "tomohiro-kato", "vikram-bhatia", "camille-dubois"],
  "agent-platform": ["priya-kumar", "ishaan-verma", "rohan-mehta", "hannah-becker", "yuna-cho"],
  "devx": ["james-wilson", "adhiraj-singh", "emily-carter", "kunal-desai", "alex-park"],
  "onboarding-revamp": ["daniel-park", "ravi-subramanian", "olivia-bennett", "sophie-martin", "anika-goyal"],
  "search-relevance": ["ishaan-verma", "yuki-sato", "ji-ho-lee", "camille-dubois"],
  "admin-tooling": ["karan-joshi", "yuna-cho", "aditya-rao", "neha-sharma"],
  "mobile-checkout": ["mei-lin-wu", "tomohiro-kato", "anika-goyal", "aanya-iyer"],
  "design-system-v3": ["noah-williams", "emily-carter", "alex-park"],
  "analytics-pipeline": ["yuki-sato", "arjun-patel", "kavya-reddy"],
  "brand-q3": ["zara-khan", "pooja-krishnan", "tom-andersson", "mira-hassan"],
  "billing-proration": ["sofia-alvarez", "neha-sharma", "kavya-reddy"]
};

export const people: Person[] = personSeed.map((p) => {
  const id = slugId(p.name);
  const initials = makeInitials(p.name);
  const projects = Object.entries(projectAssignments)
    .filter(([, ids]) => ids.includes(id))
    .map(([pid]) => pid);
  const baseTrend = p.workloadPct || 60;
  const trend = Array.from({ length: 8 }, (_, i) => Math.max(20, Math.min(125, baseTrend + Math.sin(i * 1.3 + name.length) * 15 - (i === 7 ? 0 : (7 - i) * 1.5))));
  return {
    ...p,
    id,
    initials,
    projects,
    workloadTrend: trend.map((n) => Math.round(n)),
    activeTasks: [
      { id: `t-${id}-1`, title: p.currentFocus.split("·")[0].trim().split("/").pop() || "Task", status: p.workload === "overloaded" ? "blocked" : "in-progress" },
      { id: `t-${id}-2`, title: "Code review queue", status: "review" },
      { id: `t-${id}-3`, title: "Sprint planning prep", status: p.workload === "light" ? "done" : "in-progress" }
    ],
    shippedLast7d: p.workload === "light" || p.status === "new" || p.status === "on-leave"
      ? [{ what: "Small bugfix", project: projects[0] ?? "northstar-cloud", when: "3d ago" }]
      : [
          { what: "Merged PR #4821", project: projects[0] ?? "northstar-cloud", when: "1d ago" },
          { what: "Shipped pricing endpoint", project: projects[0] ?? "northstar-cloud", when: "3d ago" },
          { what: "Docs update", project: projects[0] ?? "northstar-cloud", when: "5d ago" }
        ],
    skills: ["TypeScript", "PostgreSQL", "Distributed systems"].slice(0, 2 + (id.length % 2)),
    ownership: ["auth", "billing", "search"].slice(0, 1 + (id.length % 3))
  };
});

export const projects: Project[] = [
  {
    id: "northstar-cloud",
    name: "Northstar Cloud",
    description: "Multi-region cloud platform — our flagship.",
    health: "at-risk",
    team: "Engineering",
    teamLead: "priya-kumar",
    teamSize: 9,
    nextMilestone: "EU region GA",
    daysToDeadline: 14,
    velocity: "flat",
    lastShipped: { what: "Region selector UI", when: "2d ago" },
    openBlockers: 3,
    activeBlockers: [
      { who: "Mannan Arora", what: "Cookie rotation needs security review" },
      { who: "Hiroshi Tanaka", what: "Terraform EU module pending vendor approval" },
      { who: "Wei Zhang", what: "Payments idempotency edge case" }
    ],
    milestones: [
      { name: "Architecture review", date: "May 2", state: "done" },
      { name: "Beta region cut", date: "May 14", state: "done" },
      { name: "EU region GA", date: "Jun 7", state: "current" },
      { name: "APAC region GA", date: "Jul 12", state: "upcoming" }
    ],
    shippingLog: [
      { what: "Region selector UI", by: "Adhiraj Singh", when: "2d ago" },
      { what: "Multi-region read replicas", by: "Hiroshi Tanaka", when: "4d ago" },
      { what: "Latency dashboards", by: "Arjun Patel", when: "6d ago" }
    ],
    linkedDocs: [
      { kind: "rfc", title: "Region-aware routing RFC" },
      { kind: "decision", title: "EU data residency approach" },
      { kind: "doc", title: "Northstar runbook" }
    ]
  },
  {
    id: "payments-revamp",
    name: "Payments revamp",
    description: "Replace v0 checkout with cursor-paginated v1, Apple Pay, proration.",
    health: "healthy",
    team: "Engineering",
    teamLead: "vikram-bhatia",
    teamSize: 8,
    nextMilestone: "Apple Pay GA",
    daysToDeadline: 9,
    velocity: "improving",
    lastShipped: { what: "Checkout v2", when: "2d ago" },
    openBlockers: 1,
    activeBlockers: [{ who: "Wei Zhang", what: "Stripe webhook race condition under load" }],
    milestones: [
      { name: "v2 design lock", date: "Apr 18", state: "done" },
      { name: "Checkout v2 ship", date: "May 22", state: "done" },
      { name: "Apple Pay GA", date: "Jun 2", state: "current" },
      { name: "Proration & refunds", date: "Jun 28", state: "upcoming" }
    ],
    shippingLog: [
      { what: "Checkout v2 rolled to 100%", by: "Aanya Iyer", when: "2d ago" },
      { what: "Mobile checkout fixes", by: "Mei Lin Wu", when: "3d ago" },
      { what: "Invoice line item PR", by: "Sofia Alvarez", when: "5d ago" }
    ],
    linkedDocs: [
      { kind: "rfc", title: "Apple Pay integration RFC" },
      { kind: "decision", title: "Proration model: time-based" }
    ]
  },
  {
    id: "agent-platform",
    name: "Agent platform",
    description: "Internal agent runtime, tool registry, and policy layer.",
    health: "healthy",
    team: "Engineering",
    teamLead: "priya-kumar",
    teamSize: 5,
    nextMilestone: "Tool registry v1",
    daysToDeadline: 21,
    velocity: "improving",
    lastShipped: { what: "Embeddings indexer", when: "1d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Runtime prototype", date: "Apr 30", state: "done" },
      { name: "Tool registry v1", date: "Jun 14", state: "current" },
      { name: "Policy engine alpha", date: "Jul 22", state: "upcoming" }
    ],
    shippingLog: [
      { what: "Embeddings indexer", by: "Ishaan Verma", when: "1d ago" },
      { what: "Runtime hot reload", by: "Rohan Mehta", when: "4d ago" }
    ],
    linkedDocs: [
      { kind: "rfc", title: "Tool capability schema RFC" },
      { kind: "doc", title: "Agent runtime overview" }
    ]
  },
  {
    id: "devx",
    name: "DevX",
    description: "Internal dev tooling: CI speed, local env, codegen.",
    health: "healthy",
    team: "Engineering",
    teamLead: "marcus-thompson",
    teamSize: 4,
    nextMilestone: "CI 40% faster",
    daysToDeadline: 18,
    velocity: "flat",
    lastShipped: { what: "Local env CLI", when: "3d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Build cache rollout", date: "Apr 11", state: "done" },
      { name: "Local env CLI", date: "May 20", state: "done" },
      { name: "CI 40% faster", date: "Jun 11", state: "current" }
    ],
    shippingLog: [
      { what: "Local env CLI", by: "James Wilson", when: "3d ago" },
      { what: "Test parallelism", by: "Emily Carter", when: "6d ago" }
    ],
    linkedDocs: [{ kind: "doc", title: "DevX charter" }]
  },
  {
    id: "onboarding-revamp",
    name: "Onboarding revamp",
    description: "Reduce activation friction from sign-up to first value.",
    health: "at-risk",
    team: "Product",
    teamLead: "sophie-martin",
    teamSize: 5,
    nextMilestone: "Activation A/B launch",
    daysToDeadline: 7,
    velocity: "declining",
    lastShipped: { what: "Welcome step redesign", when: "5d ago" },
    openBlockers: 2,
    activeBlockers: [
      { who: "Daniel Park", what: "Auth handoff timing — backend not finalized" },
      { who: "Ravi Subramanian", what: "Pending copy from GTM" }
    ],
    milestones: [
      { name: "User research", date: "Apr 4", state: "done" },
      { name: "Welcome redesign", date: "May 17", state: "done" },
      { name: "Activation A/B launch", date: "May 31", state: "current" }
    ],
    shippingLog: [
      { what: "Welcome step redesign", by: "Ravi Subramanian", when: "5d ago" },
      { what: "Sign-up funnel events", by: "Daniel Park", when: "7d ago" }
    ],
    linkedDocs: [
      { kind: "decision", title: "Activation metric definition" }
    ]
  },
  {
    id: "search-relevance",
    name: "Search relevance",
    description: "Hybrid keyword + semantic search across the brain.",
    health: "healthy",
    team: "Engineering",
    teamLead: "ji-ho-lee",
    teamSize: 4,
    nextMilestone: "Relevance eval rig",
    daysToDeadline: 25,
    velocity: "improving",
    lastShipped: { what: "Embeddings v2", when: "2d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Embeddings v2", date: "May 21", state: "done" },
      { name: "Relevance eval rig", date: "Jun 18", state: "current" }
    ],
    shippingLog: [
      { what: "Embeddings v2", by: "Ishaan Verma", when: "2d ago" },
      { what: "Re-ranker prototype", by: "Yuki Sato", when: "5d ago" }
    ],
    linkedDocs: [{ kind: "rfc", title: "Hybrid retrieval RFC" }]
  },
  {
    id: "admin-tooling",
    name: "Admin tooling",
    description: "Internal admin console: support workflows, audit logs.",
    health: "healthy",
    team: "Product",
    teamLead: "aditya-rao",
    teamSize: 4,
    nextMilestone: "Audit log v1",
    daysToDeadline: 33,
    velocity: "flat",
    lastShipped: { what: "User impersonation", when: "4d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Console scaffolding", date: "Apr 23", state: "done" },
      { name: "User impersonation", date: "May 19", state: "done" },
      { name: "Audit log v1", date: "Jun 26", state: "current" }
    ],
    shippingLog: [
      { what: "User impersonation", by: "Karan Joshi", when: "4d ago" }
    ],
    linkedDocs: [{ kind: "doc", title: "Admin console scope" }]
  },
  {
    id: "mobile-checkout",
    name: "Mobile checkout",
    description: "iOS + Android parity with web checkout v2.",
    health: "healthy",
    team: "Engineering",
    teamLead: "tomohiro-kato",
    teamSize: 4,
    nextMilestone: "iOS submission",
    daysToDeadline: 12,
    velocity: "improving",
    lastShipped: { what: "Apple Pay sheet", when: "1d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "iOS scaffolding", date: "Apr 28", state: "done" },
      { name: "Apple Pay sheet", date: "May 23", state: "done" },
      { name: "iOS submission", date: "Jun 5", state: "current" }
    ],
    shippingLog: [
      { what: "Apple Pay sheet", by: "Mei Lin Wu", when: "1d ago" },
      { what: "Android checkout flow", by: "Tomohiro Kato", when: "4d ago" }
    ],
    linkedDocs: []
  },
  {
    id: "design-system-v3",
    name: "Design system v3",
    description: "Token-driven design system; dark mode parity.",
    health: "healthy",
    team: "Design",
    teamLead: "noah-williams",
    teamSize: 3,
    nextMilestone: "Tokens v3 freeze",
    daysToDeadline: 16,
    velocity: "flat",
    lastShipped: { what: "Color tokens v3 draft", when: "3d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Tokens audit", date: "Apr 12", state: "done" },
      { name: "Color tokens v3 draft", date: "May 21", state: "done" },
      { name: "Tokens v3 freeze", date: "Jun 9", state: "current" }
    ],
    shippingLog: [
      { what: "Color tokens v3 draft", by: "Noah Williams", when: "3d ago" }
    ],
    linkedDocs: [{ kind: "rfc", title: "Token naming RFC" }]
  },
  {
    id: "analytics-pipeline",
    name: "Analytics pipeline",
    description: "Event ingestion, schemas, derived metrics.",
    health: "off-track",
    team: "Engineering",
    teamLead: "arjun-patel",
    teamSize: 3,
    nextMilestone: "Schema registry v1",
    daysToDeadline: -3,
    velocity: "declining",
    lastShipped: { what: "Event schema linter", when: "8d ago" },
    openBlockers: 2,
    activeBlockers: [
      { who: "Yuki Sato", what: "Backfill job blowing memory on prod" },
      { who: "Arjun Patel", what: "Awaiting data team sign-off on schema" }
    ],
    milestones: [
      { name: "Ingestion prototype", date: "Mar 30", state: "done" },
      { name: "Schema registry v1", date: "May 19", state: "current" }
    ],
    shippingLog: [
      { what: "Event schema linter", by: "Yuki Sato", when: "8d ago" }
    ],
    linkedDocs: [{ kind: "decision", title: "Schema versioning approach" }]
  },
  {
    id: "brand-q3",
    name: "Brand Q3 launch",
    description: "New identity rollout, launch site, story bank.",
    health: "healthy",
    team: "GTM",
    teamLead: "tom-andersson",
    teamSize: 4,
    nextMilestone: "Launch site preview",
    daysToDeadline: 28,
    velocity: "improving",
    lastShipped: { what: "Brand identity v2 lockup", when: "4d ago" },
    openBlockers: 0,
    activeBlockers: [],
    milestones: [
      { name: "Identity exploration", date: "Apr 10", state: "done" },
      { name: "Lockup v2", date: "May 20", state: "done" },
      { name: "Launch site preview", date: "Jun 21", state: "current" }
    ],
    shippingLog: [
      { what: "Brand identity v2 lockup", by: "Zara Khan", when: "4d ago" }
    ],
    linkedDocs: []
  },
  {
    id: "billing-proration",
    name: "Billing proration",
    description: "Mid-cycle plan changes; refund logic.",
    health: "at-risk",
    team: "Engineering",
    teamLead: "sofia-alvarez",
    teamSize: 3,
    nextMilestone: "Invoice v2 cutover",
    daysToDeadline: 11,
    velocity: "flat",
    lastShipped: { what: "Proration calculator", when: "6d ago" },
    openBlockers: 1,
    activeBlockers: [
      { who: "Sofia Alvarez", what: "Edge case: downgrade with credit balance" }
    ],
    milestones: [
      { name: "Proration calculator", date: "May 18", state: "done" },
      { name: "Invoice v2 cutover", date: "Jun 4", state: "current" }
    ],
    shippingLog: [
      { what: "Proration calculator", by: "Sofia Alvarez", when: "6d ago" }
    ],
    linkedDocs: [{ kind: "rfc", title: "Proration math RFC" }]
  }
];

export const blockers: Blocker[] = [
  { id: "b1", whoId: "yuki-sato", what: "Backfill job blowing memory on prod", waitingOn: "Data infra team", ageHours: 96, projectId: "analytics-pipeline" },
  { id: "b2", whoId: "mannan-arora", what: "Cookie rotation pending security sign-off", waitingOn: "Security team", ageHours: 81, projectId: "northstar-cloud" },
  { id: "b3", whoId: "daniel-park", what: "Auth handoff timing — backend not finalized", waitingOn: "Karan Joshi", ageHours: 52, projectId: "onboarding-revamp" },
  { id: "b4", whoId: "wei-zhang", what: "Stripe webhook race condition under load", waitingOn: "Stripe support", ageHours: 38, projectId: "payments-revamp" },
  { id: "b5", whoId: "hiroshi-tanaka", what: "Terraform EU module pending vendor approval", waitingOn: "Vendor (Cloudflare)", ageHours: 30, projectId: "northstar-cloud" },
  { id: "b6", whoId: "ravi-subramanian", what: "Awaiting onboarding copy from GTM", waitingOn: "Pooja Krishnan", ageHours: 22, projectId: "onboarding-revamp" },
  { id: "b7", whoId: "sofia-alvarez", what: "Downgrade-with-credit edge case design", waitingOn: "Vikram Bhatia (PM)", ageHours: 14, projectId: "billing-proration" },
  { id: "b8", whoId: "arjun-patel", what: "Schema registry sign-off", waitingOn: "Data team review", ageHours: 9, projectId: "analytics-pipeline" }
];

export const shipLog: ShipEntry[] = [
  { id: "s1", byId: "ishaan-verma", what: "Embeddings indexer v2 deployed", projectId: "agent-platform", when: "1d ago", type: "feature" },
  { id: "s2", byId: "mei-lin-wu", what: "Apple Pay sheet in iOS app", projectId: "mobile-checkout", when: "1d ago", type: "feature" },
  { id: "s3", byId: "aanya-iyer", what: "Checkout v2 rolled to 100% of traffic", projectId: "payments-revamp", when: "2d ago", type: "feature" },
  { id: "s4", byId: "adhiraj-singh", what: "Region selector UI", projectId: "northstar-cloud", when: "2d ago", type: "feature" },
  { id: "s5", byId: "yuki-sato", what: "Re-ranker prototype merged", projectId: "search-relevance", when: "2d ago", type: "feature" },
  { id: "s6", byId: "noah-williams", what: "Color tokens v3 draft", projectId: "design-system-v3", when: "3d ago", type: "decision" },
  { id: "s7", byId: "james-wilson", what: "Local env CLI v0.4", projectId: "devx", when: "3d ago", type: "feature" },
  { id: "s8", byId: "tomohiro-kato", what: "Android checkout flow merged", projectId: "mobile-checkout", when: "4d ago", type: "feature" },
  { id: "s9", byId: "hiroshi-tanaka", what: "Multi-region read replicas", projectId: "northstar-cloud", when: "4d ago", type: "feature" },
  { id: "s10", byId: "karan-joshi", what: "User impersonation in admin", projectId: "admin-tooling", when: "4d ago", type: "feature" },
  { id: "s11", byId: "zara-khan", what: "Brand identity v2 lockup approved", projectId: "brand-q3", when: "4d ago", type: "decision" },
  { id: "s12", byId: "ravi-subramanian", what: "Welcome step redesign live", projectId: "onboarding-revamp", when: "5d ago", type: "feature" },
  { id: "s13", byId: "sofia-alvarez", what: "Invoice line items PR", projectId: "payments-revamp", when: "5d ago", type: "fix" },
  { id: "s14", byId: "emily-carter", what: "Test parallelism — CI 18% faster", projectId: "devx", when: "6d ago", type: "refactor" },
  { id: "s15", byId: "arjun-patel", what: "Latency dashboards in Grafana", projectId: "northstar-cloud", when: "6d ago", type: "docs" },
  { id: "s16", byId: "daniel-park", what: "Sign-up funnel events instrumented", projectId: "onboarding-revamp", when: "7d ago", type: "feature" },
  { id: "s17", byId: "rohan-mehta", what: "Runtime hot reload for agents", projectId: "agent-platform", when: "7d ago", type: "feature" },
  { id: "s18", byId: "wei-zhang", what: "Idempotency keys on payment charge", projectId: "payments-revamp", when: "7d ago", type: "fix" }
];

export const openRoles: OpenRole[] = [
  { id: "r1", title: "Senior Backend Engineer", team: "Engineering", stage: "interview", candidates: 4, openedDays: 28 },
  { id: "r2", title: "Staff Frontend Engineer", team: "Engineering", stage: "sourcing", candidates: 11, openedDays: 12 },
  { id: "r3", title: "Product Designer (Mobile)", team: "Design", stage: "offer", candidates: 1, openedDays: 41 },
  { id: "r4", title: "Senior Product Manager", team: "Product", stage: "interview", candidates: 3, openedDays: 22 },
  { id: "r5", title: "Solutions Engineer", team: "GTM", stage: "sourcing", candidates: 6, openedDays: 9 },
  { id: "r6", title: "Site Reliability Engineer", team: "Engineering", stage: "interview", candidates: 2, openedDays: 35 }
];

export const attentionItems: AttentionItem[] = [
  { id: "a1", severity: "red", message: "Mannan is overloaded — 6 active tasks, 2 days behind on auth flow", action: "Reassign", targetId: "mannan-arora" },
  { id: "a2", severity: "red", message: "Analytics pipeline is 3 days past its Schema Registry milestone", action: "Review", targetId: "analytics-pipeline" },
  { id: "a3", severity: "amber", message: "Yuki has been blocked on backfill memory for 4 days — most expensive blocker", action: "Unblock", targetId: "b1" },
  { id: "a4", severity: "amber", message: "Onboarding A/B launch is in 7 days with 2 open blockers", action: "Review", targetId: "onboarding-revamp" },
  { id: "a5", severity: "amber", message: "Backend team has run at 110%+ capacity for 3 weeks — suggested hire", action: "Approve", targetId: "r1" },
  { id: "a6", severity: "amber", message: "Lisa flagged Northstar EU GA timing in last 1:1 — wants your call", action: "Review", targetId: "northstar-cloud" }
];

export const orgStats = {
  activeProjects: { value: 12, change: "+1", trend: "↑" as const, sparkline: [10, 10, 11, 11, 11, 12, 11, 12] },
  shippingVelocity: { value: "18 / wk", change: "+12%", trend: "↑" as const, sparkline: [12, 13, 14, 14, 15, 16, 17, 18] },
  avgCycleTime: { value: "3.4d", change: "-0.6d", trend: "↓" as const, sparkline: [4.6, 4.4, 4.2, 4.0, 3.9, 3.7, 3.5, 3.4] },
  blockersOpen: { value: 8, change: "+2", trend: "↑" as const, sparkline: [4, 5, 5, 6, 5, 6, 7, 8] },
  teamCapacity: { value: "94%", change: "+5pp", trend: "↑" as const, sparkline: [82, 84, 86, 88, 89, 91, 92, 94] }
};

export const orgPulse = {
  enps: 42,
  retention30: "98.2%",
  retention60: "95.1%",
  retention90: "92.8%",
  shipping12wk: 198,
  activeProjects: 12,
  headcount: 47
};

export function findPerson(id: string): Person | undefined {
  return people.find((p) => p.id === id);
}

export function findProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
