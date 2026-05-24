import type {
  AnchorProvenance,
  BrainDetailItem,
  BrainNodeData,
  CalendarDayData,
  ChatMessage,
  CodebaseOverviewPayload,
  ContinuityProfile,
  DeadlineItem,
  Doc,
  DocViewerPayload,
  FlowGraph,
  LiveDocPayload,
  MeetingItem,
  ProjectBrainData,
  ProjectCardItem,
  ProjectDetail,
  RequestItem,
  RoleOption,
  SocratesReplyGroups,
  SocratesSuggestionGroups
} from "./types";

export const mockProjects: ProjectCardItem[] = [
  { id: "1", name: "Northstar Cloud", progress: 34, health: "HEALTHY", color: "rgba(45,74,62,0.10)" },
  { id: "2", name: "Elara Games", progress: 38, health: "AT RISK", color: "rgba(120,113,108,0.10)" },
  { id: "3", name: "API Gateway", progress: 79, health: "Critical", color: "rgba(194,136,64,0.12)" }
];

export const mockProjectDetail: ProjectDetail = {
  id: "1",
  name: "Northstar Cloud",
  health: "HEALTHY",
  progress: 34,
  description: "On-demand usage billing marketplace. Buyer ordering, tenant admin dashboard, billing worker assignment.",
  deadline: "Jun 2026",
  sprint: "2 of 8",
  budget: 85000,
  spent: 28900,
  team: [
    { initials: "SC", name: "Sarah Chen", role: "manager" },
    { initials: "MT", name: "Marcus T", role: "dev" },
    { initials: "PK", name: "Priya K", role: "dev" },
    { initials: "JW", name: "James W", role: "dev" },
    { initials: "AP", name: "Alex P", role: "dev" },
    { initials: "LF", name: "Lisa F", role: "client" }
  ],
  openRoles: 2,
  subscriptions: [
    { id: "s1", name: "AWS (EC2 + RDS)", category: "Infrastructure", cost: 420, billing: "monthly", status: "active" },
    { id: "s2", name: "Supabase Pro", category: "Database", cost: 25, billing: "monthly", status: "active" },
    { id: "s3", name: "Stripe", category: "Payments", cost: 0, billing: "per-transaction", status: "active" },
    { id: "s4", name: "Firebase", category: "Notifications", cost: 15, billing: "monthly", status: "active" },
    { id: "s5", name: "Vercel Pro", category: "Hosting", cost: 20, billing: "monthly", status: "active" },
    { id: "s6", name: "Sentry", category: "Monitoring", cost: 26, billing: "monthly", status: "active" }
  ],
  recentChanges: [
    { id: "rc1", title: "Manager approval required for billing worker assignment", status: "accepted", timeAgo: "2d ago" },
    { id: "rc2", title: "Pro subscription deferred to v2", status: "accepted", timeAgo: "3d ago" },
    { id: "rc3", title: "OAuth removed from v1 scope", status: "accepted", timeAgo: "5d ago" },
    { id: "rc4", title: "Promo code system requested", status: "pending", timeAgo: "2h ago" }
  ],
  brainStatus: "ACTIVE",
  docsCount: 8,
  docsReady: 6
};

export const mockCodebaseOverview: CodebaseOverviewPayload = {
  repos: [
    {
      id: "api",
      name: "northstar/api",
      purpose: "Billing, entitlement, tenant-session, and usage-ingestion API.",
      language: "TypeScript",
      size: "184k loc",
      lastActive: "May 23 · PR #418",
      owners: ["Sarah Kim", "Maya Patel"],
      ownerIds: ["sarah-kim", "maya-patel"],
      detail: "Owns BillingPort, immutable UsageEvent ingestion, ledger projections, invoice preview read models, and EntitlementSnapshot publication.",
      paths: ["services/billing/**", "services/entitlements/**", "prisma/schema.prisma"],
      decisions: ["dec-billingport", "dec-retry-cap"]
    },
    {
      id: "web",
      name: "northstar/web",
      purpose: "Dashboard, billing console, entitlement states, and support trace UI.",
      language: "React",
      size: "96k loc",
      lastActive: "May 22 · tailwind.config.ts",
      owners: ["Nina Ford", "Sarah Kim"],
      ownerIds: ["nina-ford", "sarah-kim"],
      detail: "Renders billing summary, invoice preview, blocked-action affordances, trace lookup, and the captured Northstar design system tokens.",
      paths: ["app/billing/**", "app/usage-events/**", "tailwind.config.ts"],
      decisions: ["dec-preview"]
    },
    {
      id: "infra",
      name: "northstar/infra",
      purpose: "Terraform, deploy pipelines, worker queues, and beta feature flags.",
      language: "HCL + YAML",
      size: "28k loc",
      lastActive: "May 21 · rollout plan",
      owners: ["Maya Patel"],
      ownerIds: ["maya-patel"],
      detail: "Controls billing_ledger_v2, invoice_preview_v2, entitlement_snapshot_reads, webhook retry queues, and rollback order.",
      paths: ["terraform/workers/**", ".github/workflows/deploy.yml", "flags/billing-beta.yml"],
      decisions: ["dec-postgres"]
    },
    {
      id: "mobile",
      name: "northstar/mobile",
      purpose: "React Native beta companion for plan state and usage alerts.",
      language: "React Native",
      size: "41k loc",
      lastActive: "May 18 · beta shell",
      owners: ["Jon Bell"],
      ownerIds: ["jon-bell"],
      detail: "Consumes EntitlementSnapshot and usage alert APIs, but does not initiate invoice preview or Stripe flows.",
      paths: ["src/screens/BillingStatus.tsx", "src/lib/sessionClaims.ts"],
      decisions: ["dec-entitlement-snapshot"]
    }
  ],
  owners: [
    {
      id: "sarah-kim",
      name: "Sarah Kim",
      role: "Staff Engineer",
      area: "Identity/Billing",
      owns: ["BillingPort", "UsageEvent ledger", "tenant session claims"],
      busFactor: "thin",
      profileHref: "/memory/person/sarah-kim"
    },
    {
      id: "maya-patel",
      name: "Maya Patel",
      role: "Platform Engineer",
      area: "Workers/Infra",
      owns: ["webhook retry queues", "rollout flags", "ledger replay jobs"],
      busFactor: "single",
      profileHref: "/memory/person/maya-patel"
    },
    {
      id: "nina-ford",
      name: "Nina Ford",
      role: "Product Engineer",
      area: "Billing UI",
      owns: ["invoice preview UI", "blocked-action states", "design tokens"],
      busFactor: "shared",
      profileHref: "/memory/person/nina-ford"
    },
    {
      id: "jon-bell",
      name: "Jon Bell",
      role: "Mobile Engineer",
      area: "Mobile beta",
      owns: ["mobile plan state", "session claims client", "usage alert shell"],
      busFactor: "thin",
      profileHref: "/memory/person/jon-bell"
    }
  ],
  decisions: [
    {
      id: "dec-billingport",
      title: "Stripe isolated behind BillingPort",
      status: "accepted",
      reference: "PR #418",
      summary: "No route, React loader, invoice preview job, or entitlement check may call Stripe directly.",
      traceHref: "/live-doc#sec-backend-contracts"
    },
    {
      id: "dec-postgres",
      title: "Defer Postgres billing migration",
      status: "accepted",
      reference: "#eng-billing · May 21",
      summary: "Keep the beta ledger on the current schema until replay fixtures and before/after invoice diffs are green.",
      traceHref: "/live-doc#sec-deployment-rollout"
    },
    {
      id: "dec-retry-cap",
      title: "Retry cap at 6 attempts",
      status: "accepted",
      reference: "PR #407",
      summary: "Webhook retries use 1m, 5m, 20m, 2h, 12h, then DLQ; ingestion never waits on retry exhaustion.",
      traceHref: "/live-doc#sec-error-handling-retries"
    },
    {
      id: "dec-preview",
      title: "Allow invoice preview to call Stripe during beta",
      status: "contested",
      reference: "Slack diff · May 23",
      summary: "Contradicts PR #418; under review and must not silently overwrite the accepted BillingPort boundary.",
      traceHref: "/live-doc#sec-backend-contracts"
    }
  ],
  questions: [
    {
      id: "q-preview-stripe",
      title: "Should invoice preview ever call Stripe during beta?",
      source: "Slack #eng-billing · Sarah Kim",
      impact: "Contradicts the accepted BillingPort boundary and could leak adapter state into product truth.",
      ownerId: "sarah-kim",
      traceHref: "/live-doc#sec-backend-contracts"
    },
    {
      id: "q-replay-bypass",
      title: "Who can approve usage replay bypass tokens?",
      source: "Release plan · northstar/billing-beta",
      impact: "Replay bypass is allowed only through signed internal queue tokens; approval owner is thinly documented.",
      ownerId: "maya-patel",
      traceHref: "/live-doc#sec-rate-limiting"
    },
    {
      id: "q-mobile-entitlements",
      title: "Does mobile need stale entitlement copy before beta?",
      source: "GitHub issue #431",
      impact: "Mobile reads EntitlementSnapshot but has no recorded UX decision for stale snapshot states.",
      ownerId: "jon-bell",
      traceHref: "/live-doc#sec-payments-entitlements"
    }
  ]
};

export const mockContinuityProfiles: ContinuityProfile[] = [
  {
    id: "sarah-kim",
    name: "Sarah Kim",
    role: "Staff Engineer",
    area: "Identity/Billing",
    lastActive: "May 23 · PR #418 review",
    systemsAtRisk: 3,
    gapsCount: 2,
    plannedLastDay: "Jun 14, 2026",
    successor: "Maya Patel",
    capturedRationale: [
      {
        id: "cap-sarah-tenant",
        system: "Tenant-scoped session claims",
        rationale:
          "Tenant lookup must precede session hydration because billing signs scoped job tokens against tenant-specific keys; trusting tenant IDs from request bodies would let a denied tenant boundary leak plan state.",
        source: "Slack #eng-billing · Sarah Kim · May 21",
        traceHref: "/live-doc#sec-auth-tenancy",
        status: "captured"
      },
      {
        id: "cap-sarah-billingport",
        system: "BillingPort boundary",
        rationale:
          "Stripe IDs are adapter references only; product truth becomes ledger_snapshot_id after reconciliation so invoice preview, entitlement checks, and UI loaders cannot couple to Stripe subscription state.",
        source: "GitHub PR #418 · northstar/api",
        traceHref: "/live-doc#sec-backend-contracts",
        status: "captured"
      },
      {
        id: "cap-sarah-immutability",
        system: "UsageEvent immutability",
        rationale:
          "Corrections append reversal events rather than mutate accepted usage rows so support can trace a disputed line item from event_id to ledger entry to invoice_preview_id.",
        source: "northstar/api · prisma/schema.prisma review",
        traceHref: "/live-doc#sec-data-model",
        status: "captured"
      }
    ],
    gaps: [
      {
        id: "gap-sarah-impersonation",
        system: "Admin impersonation audit semantics",
        coverage: "thin",
        filePaths: ["services/auth/impersonation.ts", "services/audit/audit-log.ts"],
        ownership: "29 commits · sole reviewer on last 6 changes",
        askPrompt: "No complete recorded why for reason_code taxonomy — ask Sarah before departure."
      },
      {
        id: "gap-sarah-reconciliation",
        system: "Reconciliation mismatch triage",
        coverage: "none",
        filePaths: ["services/billing/reconciliation-worker.ts", "services/billing/review-exception.ts"],
        ownership: "37 commits · sole author",
        askPrompt: "No recorded why for manual review thresholds — ask Sarah before departure."
      }
    ],
    scope: [
      {
        id: "scope-sarah-api",
        system: "Billing API",
        repo: "northstar/api",
        filePaths: ["services/billing/**", "services/entitlements/**"],
        ownership: "68 commits · primary reviewer"
      },
      {
        id: "scope-sarah-auth",
        system: "Identity boundary",
        repo: "northstar/api",
        filePaths: ["services/auth/session-claims.ts", "services/auth/tenant-boundary.ts"],
        ownership: "41 commits · primary author"
      }
    ]
  },
  {
    id: "maya-patel",
    name: "Maya Patel",
    role: "Platform Engineer",
    area: "Workers/Infra",
    lastActive: "May 22 · webhook queue deploy",
    systemsAtRisk: 2,
    gapsCount: 1,
    plannedLastDay: "Jun 21, 2026",
    successor: "Jon Bell",
    capturedRationale: [
      {
        id: "cap-maya-retry",
        system: "Webhook retry caps",
        rationale:
          "Retries stop after the sixth attempt because dead-letter visibility is safer than silent queue growth; ingestion and ledger workers must stay available even if Stripe webhooks degrade.",
        source: "PR #407 · northstar/infra",
        traceHref: "/live-doc#sec-error-handling-retries",
        status: "captured"
      },
      {
        id: "cap-maya-rollout",
        system: "Billing rollout flags",
        rationale:
          "Rollback disables entitlement_snapshot_reads before invoice_preview_v2 so product gates stop reading new state while accepted UsageEvent rows remain intact for replay.",
        source: "Release plan · Notion northstar/billing-beta",
        traceHref: "/live-doc#sec-deployment-rollout",
        status: "captured"
      }
    ],
    gaps: [
      {
        id: "gap-maya-replay-token",
        system: "Usage replay bypass approval",
        coverage: "thin",
        filePaths: ["workers/replay/queue-token.ts", "flags/billing-beta.yml"],
        ownership: "22 commits · only deploy owner",
        askPrompt: "Approval path for signed replay bypass tokens is thin — capture Maya's rule before handoff."
      }
    ],
    scope: [
      {
        id: "scope-maya-infra",
        system: "Worker infrastructure",
        repo: "northstar/infra",
        filePaths: ["terraform/workers/**", ".github/workflows/deploy.yml"],
        ownership: "54 commits · sole release owner"
      }
    ]
  },
  {
    id: "nina-ford",
    name: "Nina Ford",
    role: "Product Engineer",
    area: "Billing UI",
    lastActive: "May 22 · invoice preview states",
    systemsAtRisk: 1,
    gapsCount: 1,
    plannedLastDay: "Jun 28, 2026",
    successor: "Sarah Kim",
    capturedRationale: [
      {
        id: "cap-nina-design",
        system: "Northstar design tokens",
        rationale:
          "Billing UI uses Inter and the cooler Northstar palette so generated agent work stays visually distinct from Orchestra's warm editorial chrome.",
        source: "northstar/web · tailwind.config.ts + Figma comment",
        traceHref: "/live-doc#sec-design-system",
        status: "captured"
      },
      {
        id: "cap-nina-blocked",
        system: "Blocked action states",
        rationale:
          "Blocked actions are plan limits, not errors; the UI must link each blocked state to entitlement_snapshot_id so support can trace the exact gate.",
        source: "GitHub issue #431 · northstar/web",
        traceHref: "/live-doc#sec-payments-entitlements",
        status: "captured"
      }
    ],
    gaps: [
      {
        id: "gap-nina-stale-copy",
        system: "Stale invoice preview copy",
        coverage: "thin",
        filePaths: ["app/billing/InvoicePreview.tsx", "app/billing/PreviewFreshness.tsx"],
        ownership: "18 commits · primary author",
        askPrompt: "No final recorded wording for stale preview states — ask Nina before beta copy freeze."
      }
    ],
    scope: [
      {
        id: "scope-nina-web",
        system: "Billing console",
        repo: "northstar/web",
        filePaths: ["app/billing/**", "app/usage-events/**"],
        ownership: "46 commits · primary UI owner"
      }
    ]
  },
  {
    id: "jon-bell",
    name: "Jon Bell",
    role: "Mobile Engineer",
    area: "Mobile beta",
    lastActive: "May 18 · beta shell",
    systemsAtRisk: 2,
    gapsCount: 2,
    plannedLastDay: "Jul 5, 2026",
    successor: "Nina Ford",
    capturedRationale: [
      {
        id: "cap-jon-session",
        system: "Mobile session claims",
        rationale:
          "Mobile reads account_id, workspace_id, actor_id, and role from the app-shell session context and never lets local workspace selection override signed claims.",
        source: "northstar/mobile · src/lib/sessionClaims.ts review",
        traceHref: "/live-doc#sec-auth-tenancy",
        status: "captured"
      }
    ],
    gaps: [
      {
        id: "gap-jon-stale-entitlements",
        system: "Stale entitlement mobile state",
        coverage: "none",
        filePaths: ["src/screens/BillingStatus.tsx", "src/components/PlanLimitBanner.tsx"],
        ownership: "24 commits · sole author",
        askPrompt: "No recorded why for mobile stale entitlement copy — ask Jon before the beta handoff."
      },
      {
        id: "gap-jon-alert-routing",
        system: "Usage alert routing",
        coverage: "thin",
        filePaths: ["src/screens/UsageAlerts.tsx", "src/lib/pushRouting.ts"],
        ownership: "16 commits · primary author",
        askPrompt: "Thin rationale on which alerts should wake users — generate Jon's ask-list now."
      }
    ],
    scope: [
      {
        id: "scope-jon-mobile",
        system: "Mobile beta app",
        repo: "northstar/mobile",
        filePaths: ["src/screens/**", "src/lib/sessionClaims.ts"],
        ownership: "39 commits · effective owner"
      }
    ]
  }
];

export const mockDocs: Doc[] = [
  {
    id: "1",
    name: "Northstar Cloud PRD v2",
    type: "prd",
    size: "2.4 MB",
    pages: 24,
    status: "ready",
    uploadedBy: "SC",
    uploadedAt: "Apr 18, 2026",
    excerpt:
      "Northstar Cloud is an on-demand usage billing marketplace connecting buyers to local tenant admins. Client wants an MVP with buyer-facing ordering, tenant admin-facing order management, and billing worker assignment."
  },
  {
    id: "2",
    name: "SRS Document",
    type: "srs",
    size: "1.8 MB",
    pages: 18,
    status: "ready",
    uploadedBy: "MT",
    uploadedAt: "Apr 17, 2026",
    excerpt:
      "System requirements for Northstar Cloud. Covers authentication, order flow, payment integration, and billing worker assignment module specifications."
  },
  {
    id: "3",
    name: "Tech Architecture Spec",
    type: "spec",
    size: "980 KB",
    pages: 12,
    status: "ready",
    uploadedBy: "SC",
    uploadedAt: "Apr 16, 2026",
    excerpt:
      "Working end-to-end order flow for buyers and tenant admins. No Pro subscription in MVP. Manager approval required before billing worker assignment."
  },
  {
    id: "4",
    name: "Client Kickoff Call",
    type: "transcript",
    size: "340 KB",
    pages: 8,
    status: "ready",
    uploadedBy: "SC",
    uploadedAt: "Apr 15, 2026",
    excerpt:
      "Hey Sarah - one thing we forgot to mention. We need manager approval before any billing worker gets assigned to an order. The tenant admin manager has to sign off first."
  },
  {
    id: "5",
    name: "Design Mockups v3",
    type: "image",
    size: "14.2 MB",
    pages: 1,
    status: "ready",
    uploadedBy: "JW",
    uploadedAt: "Apr 14, 2026",
    excerpt: "Design mockups v3 · buyer ordering flow, tenant admin dashboard, and billing worker assignment screens."
  },
  {
    id: "6",
    name: "Sprint 2 Recording",
    type: "audio",
    size: "48 MB",
    pages: 1,
    status: "processing",
    uploadedBy: "MT",
    uploadedAt: "Apr 21, 2026",
    excerpt: "Sprint 2 standup recording. Processing in progress."
  },
  {
    id: "7",
    name: "Payment Flow Diagram",
    type: "image",
    size: "3.1 MB",
    pages: 1,
    status: "ready",
    uploadedBy: "PK",
    uploadedAt: "Apr 13, 2026",
    excerpt:
      "Can we add a Pro subscription for tenant admins with better revenue share? Like 85% instead of 70%? I think it really helps retention."
  },
  {
    id: "8",
    name: "Stakeholder Email Thread",
    type: "transcript",
    size: "120 KB",
    pages: 3,
    status: "ready",
    uploadedBy: "SC",
    uploadedAt: "Apr 12, 2026",
    excerpt: "Stakeholder alignment on scope. OAuth removed from v1. Payment flow confirmed with Stripe."
  }
];

export const mockFlowGraph: FlowGraph = {
  nodes: [
    {
      id: "n01",
      label: "Buyer Ordering Flow",
      type: "flow",
      status: "critical",
      description:
        "End-to-end buyer journey from product browse to checkout. Includes cart, address selection, payment, and order confirmation.",
      docRefs: ["PRD v2 · Section 3.1", "SRS · Section 5"],
      position: { x: 340, y: 180 }
    },
    {
      id: "n02",
      label: "Tenant Admin Dashboard",
      type: "module",
      status: "critical",
      description:
        "Tenant Admin-facing order management interface. Shows incoming orders, fulfillment status, and inventory management.",
      docRefs: ["PRD v2 · Section 3.2"],
      position: { x: 580, y: 180 }
    },
    {
      id: "n03",
      label: "Billing Worker Assignment",
      type: "flow",
      status: "at-risk",
      description:
        "Automated and manual billing worker assignment logic. Manager approval required before any billing worker is assigned to an order.",
      docRefs: ["SRS · Section 7", "Client Kickoff Transcript"],
      position: { x: 820, y: 300 }
    },
    {
      id: "n04",
      label: "Payment Integration",
      type: "integration",
      status: "critical",
      description: "Stripe payment integration. Covers buyer checkout, tenant admin payouts, and revenue share model.",
      docRefs: ["Tech Spec · Section 4"],
      position: { x: 120, y: 300 }
    },
    {
      id: "n05",
      label: "Subscription Model",
      type: "module",
      status: "unresolved",
      description: "Pro subscription for tenant admins. Revenue share percentages still under discussion. Not in MVP v1 scope.",
      docRefs: ["Stakeholder Email Thread"],
      position: { x: 580, y: 420 }
    },
    {
      id: "n06",
      label: "Admin Panel",
      type: "approval",
      status: "stable",
      description: "Internal admin dashboard for order oversight, dispute resolution, and manager approval workflows.",
      docRefs: ["PRD v2 · Section 6"],
      position: { x: 1020, y: 180 }
    },
    {
      id: "n07",
      label: "Notifications",
      type: "integration",
      status: "stable",
      description: "Push and email notifications for buyers and tenant admins. Order status updates, billing confirmations.",
      docRefs: ["SRS · Section 8"],
      position: { x: 340, y: 420 }
    },
    {
      id: "n08",
      label: "Third-party Billing Worker API",
      type: "integration",
      status: "unresolved",
      description: "External billing worker network API integration. Provider not confirmed. Availability and pricing TBD.",
      docRefs: ["Tech Spec · Section 9"],
      position: { x: 820, y: 480 }
    }
  ],
  edges: [
    { id: "e1", from: "n01", to: "n02", label: "creates order", style: "dashed" },
    { id: "e2", from: "n02", to: "n03", label: "confirms", style: "dashed" },
    { id: "e3", from: "n03", to: "n06", label: "exceptions", style: "solid" },
    { id: "e4", from: "n01", to: "n04", label: "checkout", style: "solid" },
    { id: "e5", from: "n02", to: "n07", label: "alerts tenant admin", style: "solid" },
    { id: "e6", from: "n07", to: "n05", label: "", style: "solid" },
    { id: "e7", from: "n03", to: "n08", label: "availability", style: "dashed" }
  ]
};

export const mockDocViewer: DocViewerPayload = {
  id: "1",
  title: "Northstar Cloud PRD v2",
  version: "v2.1",
  uploadedBy: "Sarah Chen",
  uploadedAt: "Apr 18, 2026",
  totalPages: 24,
  sections: [
    {
      id: "s1",
      anchorId: "overview",
      type: "heading",
      level: 1,
      content: "Northstar Cloud · Product Requirements Document",
      hasChange: false
    },
    {
      id: "s2",
      anchorId: "summary",
      type: "paragraph",
      content:
        "Northstar Cloud is an on-demand usage billing marketplace connecting buyers to local tenant admins. The platform enables buyer-facing ordering, tenant admin-facing order management, and billing worker assignment with real-time tracking.",
      hasChange: false
    },
    {
      id: "s3",
      anchorId: "scope",
      type: "heading",
      level: 2,
      content: "1. Product Scope",
      hasChange: false
    },
    {
      id: "s4",
      anchorId: "scope-detail",
      type: "paragraph",
      content:
        "The MVP covers three primary user flows: buyer ordering, tenant admin dashboard, and billing worker assignment. Payment processing via Stripe. No Pro subscription in v1.",
      hasChange: true,
      changeId: "c1",
      citationIds: ["cite-1"]
    },
    {
      id: "s5",
      anchorId: "auth",
      type: "heading",
      level: 2,
      content: "2. Authentication",
      hasChange: false
    },
    {
      id: "s6",
      anchorId: "auth-detail",
      type: "paragraph",
      content: "OAuth 2.0 with Google SSO for buyers. Email/password for tenant admins and billing workers. JWT tokens with 24hr expiry.",
      hasChange: true,
      changeId: "c2",
      citationIds: ["cite-2"]
    },
    {
      id: "s7",
      anchorId: "billing worker",
      type: "heading",
      level: 2,
      content: "3. Billing Worker Assignment",
      hasChange: false
    },
    {
      id: "s8",
      anchorId: "billing worker-detail",
      type: "paragraph",
      content:
        "Billing Workers are assigned automatically based on proximity and availability. Manager approval required before assignment is confirmed. Tenant Admin manager must sign off on each order.",
      hasChange: true,
      changeId: "c3",
      citationIds: ["cite-3"]
    },
    {
      id: "s9",
      anchorId: "payments",
      type: "heading",
      level: 2,
      content: "4. Payment Integration",
      hasChange: false
    },
    {
      id: "s10",
      anchorId: "payments-detail",
      type: "paragraph",
      content: "Stripe Connect for buyer payments and tenant admin payouts. Revenue share: 70% tenant admin, 30% platform. Payout batching weekly.",
      hasChange: false
    },
    {
      id: "s11",
      anchorId: "notifications",
      type: "heading",
      level: 2,
      content: "5. Notifications",
      hasChange: false
    },
    {
      id: "s12",
      anchorId: "notifications-detail",
      type: "paragraph",
      content:
        "SMS notifications for order status updates. Email confirmations for buyers. Push notifications for tenant admins and billing workers via Firebase.",
      hasChange: false
    }
  ]
};

export const mockProvenance: Record<string, AnchorProvenance> = {
  "scope-detail": {
    anchorId: "scope-detail",
    sourceDoc: "Northstar Cloud PRD v2 · Section 1",
    excerpt: "No Pro subscription in v1.",
    linkedMessages: [
      {
        id: "m1",
        from: "Jack (Northstar Cloud)",
        platform: "slack",
        content: "Confirmed · no Pro subscription for MVP. Keep it simple for launch.",
        sentAt: "Apr 14, 2026"
      }
    ],
    acceptedChanges: [
      {
        id: "c1",
        summary: "Pro subscription deferred to v2",
        acceptedAt: "Apr 15, 2026",
        acceptedBy: "Sarah Chen"
      }
    ]
  },
  "auth-detail": {
    anchorId: "auth-detail",
    sourceDoc: "Northstar Cloud PRD v2 · Section 2",
    excerpt: "OAuth removed from v1 scope.",
    linkedMessages: [
      {
        id: "m2",
        from: "Mike (API Gateway)",
        platform: "email",
        content: "Confirmed: remove OAuth from v1 scope. Email/password is sufficient for launch.",
        sentAt: "Apr 16, 2026"
      }
    ],
    acceptedChanges: [
      {
        id: "c2",
        summary: "OAuth removed from MVP, email/password only",
        acceptedAt: "Apr 16, 2026",
        acceptedBy: "Sarah Chen"
      }
    ]
  },
  "billing worker-detail": {
    anchorId: "billing worker-detail",
    sourceDoc: "Client Kickoff Transcript",
    excerpt: "Manager approval before billing worker assignment.",
    linkedMessages: [
      {
        id: "m3",
        from: "Jack (Northstar Cloud)",
        platform: "whatsapp",
        content:
          "Hey Sarah - one thing we forgot to mention. We need manager approval before any billing worker gets assigned. The tenant admin manager has to sign off first.",
        sentAt: "Apr 14, 2026"
      }
    ],
    acceptedChanges: [
      {
        id: "c3",
        summary: "Manager approval required before billing worker assignment",
        acceptedAt: "Apr 15, 2026",
        acceptedBy: "Sarah Chen"
      }
    ]
  }
};

export const mockLiveDoc: LiveDocPayload = {
  projectName: "Northstar Cloud",
  docType: "CONTEXT LAYER",
  version: "CTX-2026.05.23",
  status: "ACCEPTED",
  sections: [
    {
      id: "sec-title",
      anchorId: "title",
      sectionLabel: "",
      type: "title",
      content: "Current truth -> export as anything",
      sourceIds: []
    },
    {
      id: "sec-overview",
      anchorId: "overview",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Northstar Cloud is a multi-tenant developer platform for usage-based billing, entitlement checks, and account-scoped analytics. The current build is the billing confidence slice: SDK usage events, ingestion hardening, ledger reconciliation, invoice preview, entitlement reads, and partner-facing billing UI. The context layer keeps only decisions that still affect implementation, rollout, or agent handoff.",
      highlight: {
        text: "billing confidence slice",
        start: 140,
        end: 164
      },
      sourceIds: ["c1"],
      exportTags: ["agent", "backend", "frontend"]
    },
    {
      id: "sec-goals-label",
      anchorId: "goals",
      sectionLabel: "GOALS",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-goals",
      anchorId: "goals-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "The launch goal is billing confidence, not feature breadth: every billable usage event must be traceable from SDK emit -> ingestion -> ledger row -> invoice preview before beta expansion. A design partner must be able to dispute a line item by giving support an event_id, workspace_id, and invoice_preview_id, and support must trace that path without asking engineering to query Stripe. Beta is blocked until replay, preview, webhook retry, and entitlement-read dashboards all agree on the same ledger snapshot.",
      highlight: {
        text: "SDK emit -> ingestion -> ledger row -> invoice preview",
        start: 90,
        end: 146
      },
      sourceIds: ["c2"],
      exportTags: ["agent", "backend", "payments"]
    },
    {
      id: "sec-catalog-label",
      anchorId: "catalog",
      sectionLabel: "BACKEND CONTRACTS",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-catalog",
      anchorId: "catalog-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Stripe remains isolated behind BillingPort; no route, React loader, or invoice preview job may call Stripe directly. Ingestion writes immutable UsageEvent rows with idempotency_key, workspace_id, sdk_key_id, occurred_at, received_at, and raw_payload_hash; correction happens by appending reversal events, never by mutation. The ledger consumes only accepted events, invoice preview reads ledger state without calling Stripe directly, and reconciliation publishes entitlement_snapshot_id only after the ledger and Stripe adapter agree on period, plan, and customer mapping.",
      highlight: {
        text: "Stripe remains isolated behind BillingPort",
        start: 0,
        end: 42
      },
      sourceIds: ["c3"],
      exportTags: ["agent", "backend", "payments"]
    },
    {
      id: "sec-auth-label",
      anchorId: "auth",
      sectionLabel: "AUTH + TENANCY",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-auth",
      anchorId: "auth-body",
      sectionLabel: "",
      type: "highlighted",
      content: "All API requests must carry account_id, workspace_id, actor_id, and role from signed session claims; clients never send tenant IDs as trusted body fields. Row-level checks happen before entitlement checks so a denied tenant boundary cannot leak plan state. Admin impersonation must stamp impersonated_by and reason_code on audit rows, and service-to-service jobs use workspace-scoped tokens with explicit job_type claims rather than global admin bypass.",
      highlight: {
        text: "Row-level checks happen before entitlement checks",
        start: 145,
        end: 191
      },
      sourceIds: ["c4"],
      exportTags: ["agent", "backend", "frontend"]
    },
    {
      id: "sec-payments-label",
      anchorId: "payments",
      sectionLabel: "PAYMENTS + ENTITLEMENTS",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-payments",
      anchorId: "payments-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Entitlements are evaluated from the ledger snapshot, not directly from Stripe webhooks. A payment webhook can unlock a plan only after ledger reconciliation succeeds, because a Stripe subscription state alone cannot prove usage period completeness. Failed payments freeze upgrades but do not disable already-granted beta access until the current entitlement_snapshot expires; downgrade effects are queued as pending_entitlement_change rows and applied at the next snapshot boundary.",
      highlight: {
        text: "only after ledger reconciliation succeeds",
        start: 111,
        end: 151
      },
      sourceIds: ["c5"],
      exportTags: ["agent", "backend", "payments"]
    },
    {
      id: "sec-data-label",
      anchorId: "data-model",
      sectionLabel: "DATA MODEL",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-data",
      anchorId: "data-model-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "UsageEvent is the immutable ingestion fact table; LedgerEntry is the accounting projection; InvoicePreview is a read model keyed by ledger_snapshot_id; EntitlementSnapshot is the only source read by product gates. UsageEvent.raw_payload_hash and idempotency_key are unique per workspace and sdk_key_id, while LedgerEntry stores derived debit, credit, plan_code, unit_price_cents, and reversal_of_entry_id. Stripe customer/subscription IDs are adapter references, not product truth; the ledger snapshot is product truth after reconciliation.",
      highlight: {
        text: "UsageEvent is the immutable ingestion fact table",
        start: 0,
        end: 46
      },
      sourceIds: ["c11"],
      exportTags: ["agent", "backend", "payments"]
    },
    {
      id: "sec-errors-label",
      anchorId: "error-handling",
      sectionLabel: "ERROR HANDLING + RETRIES",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-errors",
      anchorId: "error-handling-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Ingestion accepts valid events before downstream billing jobs run; invoice preview, reconciliation, and webhook retries must never block event capture. Webhook retries use capped exponential backoff at 1m, 5m, 20m, 2h, and 12h with a dead-letter record after the fifth failure. Idempotency conflicts return the original accepted event_id when the payload hash matches and raise a review exception when the key matches but the hash differs.",
      highlight: {
        text: "must never block event capture",
        start: 109,
        end: 139
      },
      sourceIds: ["c12"],
      exportTags: ["agent", "backend", "payments"]
    },
    {
      id: "sec-observability-label",
      anchorId: "observability",
      sectionLabel: "OBSERVABILITY",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-observability",
      anchorId: "observability-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Every billing trace carries trace_id, workspace_id, sdk_key_id, event_id, ledger_snapshot_id, and invoice_preview_id from ingestion through preview render. Alert when accepted_usage_events minus ledger_entries is greater than 25 for ten minutes, webhook_dlq_count is non-zero for a design partner, or entitlement_snapshot_age exceeds fifteen minutes. Logs must redact raw payload properties by default and allow debug reveal only for internal workspaces.",
      highlight: {
        text: "accepted_usage_events minus ledger_entries",
        start: 142,
        end: 184
      },
      sourceIds: ["c13"],
      exportTags: ["agent", "backend"]
    },
    {
      id: "sec-rate-label",
      anchorId: "rate-limiting",
      sectionLabel: "RATE LIMITING",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-rate",
      anchorId: "rate-limiting-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Rate limits protect ingestion and ledger freshness, not invoice preview. Public SDK ingestion allows 600 events per workspace per minute with a 2x burst bucket; replay jobs bypass public limits only through a signed internal queue token with job_type usage_replay. When a workspace is throttled, the API returns retry_after_ms and preserves idempotency keys so clients can safely retry without duplicate ledger entries.",
      highlight: {
        text: "600 events per workspace per minute",
        start: 74,
        end: 109
      },
      sourceIds: ["c10"],
      exportTags: ["agent", "backend"]
    },
    {
      id: "sec-deployment-label",
      anchorId: "deployment-rollout",
      sectionLabel: "DEPLOYMENT + ROLLOUT",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-deployment",
      anchorId: "deployment-rollout-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Rollout is feature-flagged by workspace: billing_ledger_v2, invoice_preview_v2, entitlement_snapshot_reads, and webhook_retry_dashboard. Three design partners remain pinned to beta until replay, preview, retry, and entitlement dashboards pass the May 29 gate; rollback disables entitlement_snapshot_reads first, then preview_v2, but never deletes accepted UsageEvent rows. Any migration that touches ledger math must ship with a replay fixture and a before/after invoice diff.",
      highlight: {
        text: "rollback disables entitlement_snapshot_reads first",
        start: 223,
        end: 269
      },
      sourceIds: ["c14"],
      exportTags: ["agent", "backend", "frontend"]
    },
    {
      id: "sec-frontend-label",
      anchorId: "frontend",
      sectionLabel: "FRONTEND SURFACES",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-frontend",
      anchorId: "frontend-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "The customer admin must show plan state, current usage, invoice preview, blocked actions, and the source event trail in one billing surface. The UI labels blocked features as plan limits, not errors, and every blocked action links to the entitlement_snapshot_id that caused it. Client state comes from /billing/summary and /invoice-preview, never from Stripe client SDK calls; optimistic UI is allowed for filter changes but not for plan unlocks.",
      highlight: {
        text: "blocked features as plan limits, not errors",
        start: 119,
        end: 161
      },
      sourceIds: ["c6"],
      exportTags: ["agent", "frontend", "payments"]
    },
    {
      id: "sec-notifications-label",
      anchorId: "notifications",
      sectionLabel: "ROLL OUT",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-notifications",
      anchorId: "notifications-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Beta remains limited to three design partners until usage replay, invoice preview, and webhook retry dashboards all pass the May 29 release gate.",
      highlight: {
        text: "May 29 release gate",
        start: 114,
        end: 133
      },
      sourceIds: ["c7"],
      exportTags: ["agent", "backend", "frontend"]
    },
    {
      id: "sec-design-label",
      anchorId: "design-system",
      sectionLabel: "DESIGN SYSTEM",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-design",
      anchorId: "design-system-body",
      sectionLabel: "",
      type: "highlighted",
      content:
        "Northstar web uses a cool graphite-and-cyan system: canvas #F4F7FB, surface #FFFFFF, text #111827, muted #64748B, accent #2563EB, with Inter for product UI and JetBrains Mono for event IDs.",
      highlight: {
        text: "Inter for product UI and JetBrains Mono for event IDs",
        start: 128,
        end: 181
      },
      sourceIds: ["c9"],
      exportTags: ["agent", "frontend"]
    },
    {
      id: "sec-scope-label",
      anchorId: "scope",
      sectionLabel: "DROPPED AS STALE",
      type: "section-heading",
      content: "",
      sourceIds: []
    },
    {
      id: "sec-scope",
      anchorId: "scope-body",
      sectionLabel: "",
      type: "body",
      content:
        "The old direct-Stripe entitlement path, CSV-only invoice review, and per-service billing widgets are explicitly superseded. They stay in sources for audit, not in exports.",
      sourceIds: ["c8"],
      exportTags: ["agent"],
      stalePolicy: "Superseded content is linked for audit but excluded from generated exports."
    },
    {
      id: "sec-diagrams-label",
      anchorId: "diagrams",
      sectionLabel: "EXPORTABLE DIAGRAM",
      type: "section-heading",
      content: "",
      sourceIds: []
    }
  ],
  comments: [
    {
      id: "c1",
      authorInitials: "SK",
      authorName: "Sarah Kim",
      time: "10:12 AM",
      date: "18 May 2026",
      content:
        "Do not turn this into another wiki. Keep the few decisions that determine what an agent should build next.",
      source: 'Slack #eng-billing · thread "context layer"',
      linkedSectionId: "sec-overview"
    },
    {
      id: "c2",
      authorInitials: "AK",
      authorName: "Arun Kapoor",
      time: "3:41 PM",
      date: "18 May 2026",
      content: "The beta proof is traceability end to end: SDK emit, ingestion, ledger row, invoice preview.",
      source: "Zoom transcript · Northstar billing beta review",
      linkedSectionId: "sec-goals"
    },
    {
      id: "c3",
      authorInitials: "MT",
      authorName: "Marcus Thompson",
      time: "4:18 PM",
      date: "19 May 2026",
      content:
        "Merged BillingPort adapter. Stripe must not be called from invoice preview or entitlement checks.",
      source: "GitHub PR #418 · northstar-cloud/api",
      linkedSectionId: "sec-catalog"
    },
    {
      id: "c4",
      authorInitials: "PK",
      authorName: "Priya Kaur",
      time: "9:05 AM",
      date: "20 May 2026",
      content:
        "Tenant boundary check has to run before entitlement evaluation. Otherwise a forbidden workspace can reveal plan state.",
      source: "Security review · Linear SEC-117",
      linkedSectionId: "sec-auth"
    },
    {
      id: "c5",
      authorInitials: "SC",
      authorName: "Sarah Chen",
      time: "11:27 AM",
      date: "20 May 2026",
      content: "No webhook should directly unlock a feature. Reconcile ledger first, then entitlements read the snapshot.",
      source: 'Slack #eng-billing · thread "webhook ordering"',
      linkedSectionId: "sec-payments"
    },
    {
      id: "c6",
      authorInitials: "JW",
      authorName: "Jess Wong",
      time: "2:16 PM",
      date: "21 May 2026",
      content: "The billing page needs plan state, usage, invoice preview, and blocked actions together. Blocked feature copy should say plan limit.",
      source: "Figma comment · Billing surface v3",
      linkedSectionId: "sec-frontend"
    },
    {
      id: "c7",
      authorInitials: "SK",
      authorName: "Sarah Kim",
      time: "5:44 PM",
      date: "21 May 2026",
      content: "Three design partners only until replay, preview, and webhook retry dashboards pass the May 29 gate.",
      source: "Release plan · Notion northstar/billing-beta",
      linkedSectionId: "sec-notifications"
    },
    {
      id: "c8",
      authorInitials: "MT",
      authorName: "Marcus Thompson",
      time: "1:03 PM",
      date: "22 May 2026",
      content: "Deleting old per-service widget notes from context export. Sources stay searchable for audit only.",
      source: 'Slack #eng-billing · thread "stale billing notes"',
      linkedSectionId: "sec-scope"
    },
    {
      id: "c9",
      authorInitials: "JW",
      authorName: "Jess Wong",
      time: "4:22 PM",
      date: "22 May 2026",
      content: "Northstar billing UI should use the product token set from the web repo: cool canvas, blue accent, Inter, and JetBrains Mono for usage/event IDs.",
      source: "northstar-cloud/web · tailwind.config.ts + Figma comment",
      linkedSectionId: "sec-design"
    },
    {
      id: "c10",
      authorInitials: "MT",
      authorName: "Marcus Thompson",
      time: "10:36 AM",
      date: "23 May 2026",
      content: "Rate limits should protect ingestion from noisy SDK clients, but replay jobs need an internal signed queue bypass.",
      source: "GitHub issue #431 · northstar-cloud/api",
      linkedSectionId: "sec-rate-limit-authored"
    },
    {
      id: "c11",
      authorInitials: "MT",
      authorName: "Marcus Thompson",
      time: "1:18 PM",
      date: "23 May 2026",
      content: "UsageEvent is immutable. LedgerEntry is derived. InvoicePreview reads a ledger snapshot. Stripe IDs are adapter references, not product truth.",
      source: "northstar-cloud/api · prisma/schema.prisma review",
      linkedSectionId: "sec-data"
    },
    {
      id: "c12",
      authorInitials: "SC",
      authorName: "Sarah Chen",
      time: "2:04 PM",
      date: "23 May 2026",
      content: "Capture valid usage first. Retry billing jobs separately. A webhook outage should not stop SDK event ingestion.",
      source: 'Slack #eng-billing · thread "retry boundaries"',
      linkedSectionId: "sec-errors"
    },
    {
      id: "c13",
      authorInitials: "PK",
      authorName: "Priya Kaur",
      time: "3:22 PM",
      date: "23 May 2026",
      content: "Dashboard needs drift alerts: accepted usage minus ledger rows, webhook DLQ, and stale entitlement snapshots. Redact raw payload fields by default.",
      source: "Datadog monitor draft · BILL-OBS-7",
      linkedSectionId: "sec-observability"
    },
    {
      id: "c14",
      authorInitials: "SK",
      authorName: "Sarah Kim",
      time: "4:10 PM",
      date: "23 May 2026",
      content: "Rollout is flag-first. Roll back entitlement snapshot reads before preview, and never delete accepted UsageEvent rows.",
      source: "Release plan · Notion northstar/billing-beta",
      linkedSectionId: "sec-deployment"
    }
  ],
  exports: [
    {
      id: "agent",
      label: "Agent context",
      extension: ".md",
      lens: "Cursor / Claude Code handoff",
      updatedAt: "23 May 2026 · 10:42",
      regeneratedByEventIds: ["evt-pr-418"],
      copy: "Copy agent.md",
      preview:
        "# Northstar Cloud agent context\n\n## Product slice\n- Build the billing confidence slice, not a broad billing redesign.\n- Required trace: SDK emit -> ingestion -> UsageEvent -> LedgerEntry -> ledger_snapshot_id -> InvoicePreview -> EntitlementSnapshot.\n- A support user must be able to trace a disputed line item from event_id, workspace_id, and invoice_preview_id without querying Stripe.\n\n## Backend contracts\n- Stripe is isolated behind BillingPort. Do not call Stripe from React loaders, invoice preview jobs, entitlement checks, or product routes.\n- UsageEvent is immutable and keyed by workspace_id, sdk_key_id, idempotency_key, occurred_at, received_at, and raw_payload_hash.\n- Corrections append reversal events and reversal ledger entries. Never mutate accepted usage rows.\n- LedgerEntry is the accounting projection. InvoicePreview reads ledger snapshots. EntitlementSnapshot is the only object product gates read.\n- Reconciliation publishes entitlement_snapshot_id only after ledger and Stripe adapter agree on period, plan, customer, and subscription mapping.\n\n## Auth + tenancy\n- All API requests use signed session claims for account_id, workspace_id, actor_id, and role.\n- Tenant body fields are never trusted. Row-level checks happen before entitlement checks.\n- Admin impersonation must write impersonated_by and reason_code to audit rows.\n- Service jobs use workspace-scoped job tokens with job_type claims, not global admin bypass.\n\n## Error handling + retries\n- Valid ingestion is accepted before downstream billing jobs run.\n- Invoice preview, reconciliation, and webhook retries must not block SDK event capture.\n- Webhook backoff: 1m, 5m, 20m, 2h, 12h, then dead-letter.\n- Idempotency conflicts return the original event when the payload hash matches; mismatch creates a review exception.\n\n## Observability\n- Trace fields: trace_id, workspace_id, sdk_key_id, event_id, ledger_snapshot_id, invoice_preview_id.\n- Alert if accepted_usage_events - ledger_entries > 25 for 10 minutes.\n- Alert if webhook_dlq_count is non-zero for any design partner.\n- Alert if entitlement_snapshot_age > 15 minutes.\n- Redact raw payload properties by default.\n\n## Rate limits\n- Public SDK ingestion: 600 events per workspace per minute with 2x burst.\n- Usage replay bypasses public limits only via signed internal queue token with job_type=usage_replay.\n- Throttled responses include retry_after_ms and preserve idempotency keys.\n\n## Rollout\n- Feature flags: billing_ledger_v2, invoice_preview_v2, entitlement_snapshot_reads, webhook_retry_dashboard.\n- Rollback order: disable entitlement_snapshot_reads first, then invoice_preview_v2. Never delete accepted UsageEvent rows.\n- Ledger math migrations require replay fixtures and before/after invoice diffs.\n\n## Design System\n- Canvas: #F4F7FB\n- Surface: #FFFFFF\n- Text: #111827\n- Muted: #64748B\n- Accent: #2563EB\n- Font: Inter for product UI; JetBrains Mono for event IDs and paths.\n- Radius: 10px cards, 999px pills; spacing: 4/8/12/16/24."
    },
    {
      id: "backend",
      label: "Backend",
      extension: ".md",
      lens: "API, workers, ledger contracts",
      updatedAt: "23 May 2026 · 10:42",
      regeneratedByEventIds: ["evt-pr-418"],
      copy: "Copy backend.md",
      preview:
        "# Backend context\n\n## Boundaries\n- BillingPort owns all Stripe interaction. Product routes and invoice preview jobs must not import Stripe clients.\n- Stripe customer/subscription IDs are adapter references. The ledger snapshot is product truth after reconciliation.\n- Entitlement reads happen from EntitlementSnapshot, not from webhook payloads or subscription state.\n\n## Data model\n- UsageEvent: immutable ingestion fact. Required fields: workspace_id, sdk_key_id, idempotency_key, occurred_at, received_at, raw_payload_hash, event_id.\n- LedgerEntry: accounting projection from accepted usage. Stores debit, credit, plan_code, unit_price_cents, reversal_of_entry_id.\n- InvoicePreview: read model keyed by ledger_snapshot_id and invoice_preview_id.\n- EntitlementSnapshot: derived gate state for product features.\n- Correction pattern: append reversal UsageEvent/LedgerEntry, never update accepted rows in place.\n\n## Workers\n- ingestion-worker validates payload shape and writes UsageEvent.\n- ledger-worker consumes accepted events only and creates LedgerEntry rows.\n- preview-worker renders InvoicePreview from ledger snapshots only.\n- reconciliation-worker compares ledger period/customer/plan mapping to BillingPort results, then publishes EntitlementSnapshot.\n\n## Error handling\n- Ingestion availability is higher priority than preview freshness.\n- Webhook retry schedule: 1m, 5m, 20m, 2h, 12h, then DLQ.\n- Idempotency: matching key + matching hash returns original event_id; matching key + different hash creates review_exception.\n- Failed payments freeze upgrades but do not revoke current beta access until snapshot expiry.\n\n## Observability\n- Emit trace_id through ingestion, ledger, preview, reconciliation, and entitlement read.\n- Metrics: accepted_usage_events, ledger_entries_created, ledger_drift_count, webhook_dlq_count, entitlement_snapshot_age, preview_render_ms.\n- Alerts: drift > 25 for 10m, DLQ > 0 for design partners, snapshot age > 15m.\n\n## Rate limits\n- SDK ingestion limit: 600 events/workspace/minute, 2x burst bucket.\n- Replay jobs require signed internal queue token with job_type=usage_replay.\n- Throttled responses return retry_after_ms and preserve idempotency semantics."
    },
    {
      id: "frontend",
      label: "Frontend",
      extension: ".md",
      lens: "Billing UI and product copy",
      updatedAt: "23 May 2026 · 09:58",
      regeneratedByEventIds: [],
      copy: "Copy frontend.md",
      preview:
        "# Frontend context\n\n## Billing surface\n- Show plan state, current usage, invoice preview, blocked actions, and source event trail in one billing surface.\n- Blocked actions are plan limits, not error states.\n- Every blocked action links to entitlement_snapshot_id.\n- Do not call Stripe client SDKs for plan unlock or invoice preview state.\n\n## Client data contracts\n- /billing/summary provides plan, entitlement_snapshot_id, usage totals, and blocked action metadata.\n- /invoice-preview provides invoice_preview_id, ledger_snapshot_id, line items, period, and stale/fresh status.\n- /usage-events supports trace lookup by event_id and workspace_id.\n- Optimistic UI is allowed for filters and row expansion, not for plan unlocks.\n\n## Auth/session handling\n- Client should read account_id, workspace_id, actor_id, and role from session context returned by the app shell.\n- Never let UI-provided tenant IDs override session claims.\n- For denied states, copy should say plan limit or unavailable for this workspace, not generic error.\n\n## States\n- Empty: no accepted usage for period.\n- Pending: usage accepted but ledger snapshot not yet current.\n- Review: idempotency hash mismatch or webhook DLQ affects preview freshness.\n- Blocked: entitlement_snapshot denies feature; show source snapshot ID.\n\n## Design System\n- Canvas: #F4F7FB\n- Surface: #FFFFFF\n- Text: #111827\n- Muted: #64748B\n- Accent: #2563EB\n- Font: Inter for product UI; JetBrains Mono for metadata, event IDs, and paths.\n- Radius: 10px cards, 999px pills.\n- Spacing scale: 4, 8, 12, 16, 24."
    },
    {
      id: "payments",
      label: "Payments relevant",
      extension: ".md",
      lens: "Custom lens for billing/payment work",
      updatedAt: "23 May 2026 · 10:42",
      regeneratedByEventIds: ["evt-pr-418"],
      copy: "Copy payments.md",
      preview:
        "# Payments-relevant context\n\n## Stripe boundary\n- Stripe is behind BillingPort. No invoice preview, entitlement check, React loader, or product API route may call Stripe directly.\n- Stripe IDs are adapter references only. Product truth is ledger_snapshot_id after reconciliation.\n- Direct-Stripe entitlement paths are superseded and should stay out of generated code.\n\n## Reconciliation flow\n- Payment webhook enters BillingPort adapter.\n- Adapter writes reconciliation input, not entitlement state.\n- Reconciliation compares Stripe period, customer, subscription, and plan mapping to ledger snapshot.\n- EntitlementSnapshot is published only after ledger and BillingPort agree.\n- A webhook can unlock a plan only after ledger reconciliation succeeds.\n\n## Entitlement behavior\n- Entitlements are evaluated from EntitlementSnapshot.\n- Failed payments freeze upgrades but do not disable current beta access until snapshot expiry.\n- Downgrades become pending_entitlement_change rows and apply at the next snapshot boundary.\n- Blocked UI actions should link back to entitlement_snapshot_id.\n\n## Invoice preview\n- Reads ledger state only.\n- Must show invoice_preview_id and ledger_snapshot_id for support traceability.\n- Must expose stale/fresh status if ledger_snapshot_age is above threshold.\n- Must not render values directly from Stripe subscription state.\n\n## Failure handling\n- Webhook retries use 1m, 5m, 20m, 2h, 12h backoff, then DLQ.\n- Reconciliation failure must not block ingestion.\n- Idempotency mismatch creates review_exception and does not create ledger rows.\n\n## Observability\n- Metrics: ledger_drift_count, webhook_dlq_count, entitlement_snapshot_age, preview_render_ms.\n- Alerts: design partner DLQ > 0, snapshot age > 15 minutes, ledger drift > 25 for 10 minutes."
    },
    {
      id: "diagram",
      label: "Diagram",
      extension: ".mmd",
      lens: "Mermaid architecture export",
      updatedAt: "23 May 2026 · 10:42",
      regeneratedByEventIds: ["evt-pr-418"],
      copy: "Copy diagram.mmd",
      preview:
        "flowchart LR\n  SDK[SDK emit\\nworkspace + sdk key] --> ING[Ingestion API\\nvalidate + idempotency]\n  ING --> UE[UsageEvent\\nimmutable fact]\n  UE --> LEDGER[Ledger worker\\naccepted events only]\n  LEDGER --> SNAP[LedgerSnapshot\\nperiod + customer + plan]\n  SNAP --> PREVIEW[Invoice preview\\nread model]\n  SNAP --> RECON[Reconciliation worker]\n  STRIPE[Stripe webhooks] --> PORT[BillingPort adapter]\n  PORT --> RECON\n  RECON --> ENT[EntitlementSnapshot\\nproduct gates]\n  ENT --> UI[Billing UI\\nplan limits + blocked actions]\n  UE --> OBS[Observability\\ntrace + drift alerts]\n  RECON --> OBS\n  PREVIEW --> OBS"
    }
  ],
  designSystem: {
    sourceSectionId: "sec-design",
    sourceIds: ["c9"],
    palette: [
      { label: "Canvas", token: "bg.canvas", hex: "#F4F7FB" },
      { label: "Surface", token: "surface.base", hex: "#FFFFFF" },
      { label: "Text", token: "text.primary", hex: "#111827" },
      { label: "Muted", token: "text.muted", hex: "#64748B" },
      { label: "Accent", token: "brand.accent", hex: "#2563EB" }
    ],
    font: {
      family: "Inter",
      monoFamily: "JetBrains Mono",
      sample: "Usage replay verified before entitlement unlock.",
      meta: "FREE · GOOGLE FONTS + JETBRAINS"
    },
    tokens: [
      { label: "radius.card", value: "10px" },
      { label: "radius.pill", value: "999px" },
      { label: "space", value: "4/8/12/16/24" }
    ]
  },
  updateEvent: {
    id: "evt-pr-418",
    label: "PR #418 merged",
    source: "GitHub · northstar-cloud/api",
    timestamp: "10:42 AM",
    targetSectionId: "sec-catalog",
    previousText: "Invoice preview may read Stripe subscription state during beta.",
    nextText: "Invoice preview reads ledger state without calling Stripe directly.",
    regeneratedExportIds: ["agent", "backend", "payments", "diagram"]
  },
  contradictionDiff: {
    id: "diff-slack-direct-stripe",
    source: 'Slack #eng-billing · Sarah Kim · "let preview call Stripe for beta?"',
    timestamp: "11:08 AM",
    decisionSectionId: "sec-catalog",
    existingDecision: "Stripe remains isolated behind BillingPort; invoice preview reads ledger state without calling Stripe directly.",
    incomingClaim: "Allow invoice preview to call Stripe subscription state directly during beta.",
    reason: "Contradicts the accepted BillingPort boundary from PR #418, so it requires confirm even in Auto mode."
  }
};

function createDetailItems(
  prefix: string,
  items: Array<{ label: string; description: string; action: BrainDetailItem["action"] }>
) {
  return items.map((item, index) => ({
    id: `${prefix}-${index + 1}`,
    label: item.label,
    description: item.description,
    action: item.action
  }));
}

function createCategoryNode({
  id,
  label,
  x,
  y,
  icon,
  accentColor,
  tooltip,
  countLabel,
  detailItems
}: {
  id: BrainNodeData["id"];
  label: BrainNodeData["label"];
  x: number;
  y: number;
  icon: NonNullable<BrainNodeData["icon"]>;
  accentColor: string;
  tooltip: string;
  countLabel: string;
  detailItems: BrainDetailItem[];
}): BrainNodeData {
  return {
    id,
    kind: "category",
    label,
    x,
    y,
    size: 52,
    category: id as BrainNodeData["category"],
    icon,
    background: "#ffffff",
    borderColor: "rgba(26,22,18,0.08)",
    textColor: "#78716C",
    accentColor,
    shadow: "0 4px 16px rgba(0,0,0,0.08)",
    tooltip,
    countLabel,
    detailItems
  };
}

function createSubNode({
  id,
  parentId,
  category,
  label,
  x,
  y,
  background,
  borderColor,
  accentColor,
  tooltip,
  countLabel
}: {
  id: string;
  parentId: string;
  category: NonNullable<BrainNodeData["category"]>;
  label: string;
  x: number;
  y: number;
  background: string;
  borderColor: string;
  accentColor: string;
  tooltip: string;
  countLabel: string;
}): BrainNodeData {
  return {
    id,
    kind: "sub",
    label,
    x,
    y,
    size: 36,
    parentId,
    category,
    background,
    borderColor,
    textColor: "#1A1612",
    accentColor,
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    tooltip,
    countLabel
  };
}

function createProjectBrainData({
  projectId,
  projectName,
  docs,
  comms,
  team,
  changes,
  decisions
}: {
  projectId: string;
  projectName: string;
  docs: Array<{ label: string; description: string }>;
  comms: Array<{ label: string; description: string }>;
  team: Array<{ label: string; description: string }>;
  changes: Array<{ label: string; description: string; borderColor: string; accentColor: string }>;
  decisions: Array<{ label: string; description: string }>;
}): ProjectBrainData {
  const docsItems = createDetailItems("docs", docs.map((item) => ({ ...item, action: "navigate-docs" as const })));
  const commsItems = createDetailItems("comms", comms.map((item) => ({ ...item, action: "navigate-requests" as const })));
  const teamItems = createDetailItems("team", team.map((item) => ({ ...item, action: "detail" as const })));
  const changeItems = createDetailItems("changes", changes.map((item) => ({ ...item, action: "detail" as const })));
  const decisionItems = createDetailItems("decisions", decisions.map((item) => ({ ...item, action: "detail" as const })));

  return {
    projectId,
    projectName,
    nodes: [
      {
        id: "brain-core",
        kind: "core",
        label: "BRAIN",
        x: 50,
        y: 50,
        size: 80,
        background: "#FAF8F5",
        borderColor: "#ffffff",
        textColor: "#ffffff",
        accentColor: "#B8543D",
        shadow: "0 0 40px rgba(184,84,61,0.4), 0 8px 32px rgba(0,0,0,0.12)",
        tooltip: `${projectName} brain core`,
        countLabel: "5 active domains"
      },
      createCategoryNode({
        id: "docs",
        label: "DOCS",
        x: 50,
        y: 22,
        icon: "file-text",
        accentColor: "#B8543D",
        tooltip: `${projectName} docs`,
        countLabel: `${docsItems.length} linked docs`,
        detailItems: docsItems
      }),
      createCategoryNode({
        id: "comms",
        label: "COMMS",
        x: 72,
        y: 36,
        icon: "message-square",
        accentColor: "#5A5450",
        tooltip: `${projectName} comms`,
        countLabel: `${commsItems.length} active channels`,
        detailItems: commsItems
      }),
      createCategoryNode({
        id: "team",
        label: "TEAM",
        x: 65,
        y: 68,
        icon: "users",
        accentColor: "#B8543D",
        tooltip: `${projectName} team`,
        countLabel: `${teamItems.length} active members`,
        detailItems: teamItems
      }),
      createCategoryNode({
        id: "changes",
        label: "Changes",
        x: 35,
        y: 68,
        icon: "git-branch",
        accentColor: "#9E3B2E",
        tooltip: `${projectName} changes`,
        countLabel: `${changeItems.length} open updates`,
        detailItems: changeItems
      }),
      createCategoryNode({
        id: "decisions",
        label: "DECISIONS",
        x: 28,
        y: 36,
        icon: "check-square",
        accentColor: "#B8543D",
        tooltip: `${projectName} decisions`,
        countLabel: `${decisionItems.length} locked calls`,
        detailItems: decisionItems
      }),
      createSubNode({
        id: "docs-1",
        parentId: "docs",
        category: "docs",
        label: docs[0].label,
        x: 48,
        y: 8,
        background: "rgba(45,74,62,0.10)",
        borderColor: "rgba(45,74,62,0.10)",
        accentColor: "#B8543D",
        tooltip: docs[0].label,
        countLabel: "1 doc node"
      }),
      createSubNode({
        id: "docs-2",
        parentId: "docs",
        category: "docs",
        label: docs[1].label,
        x: 54,
        y: 8,
        background: "rgba(45,74,62,0.10)",
        borderColor: "rgba(45,74,62,0.10)",
        accentColor: "#B8543D",
        tooltip: docs[1].label,
        countLabel: "1 doc node"
      }),
      createSubNode({
        id: "docs-3",
        parentId: "docs",
        category: "docs",
        label: docs[2].label,
        x: 42,
        y: 12,
        background: "rgba(45,74,62,0.10)",
        borderColor: "rgba(45,74,62,0.10)",
        accentColor: "#B8543D",
        tooltip: docs[2].label,
        countLabel: "1 doc node"
      }),
      createSubNode({
        id: "comms-1",
        parentId: "comms",
        category: "comms",
        label: comms[0].label,
        x: 82,
        y: 28,
        background: "rgba(120,113,108,0.10)",
        borderColor: "rgba(120,113,108,0.10)",
        accentColor: "#5A5450",
        tooltip: comms[0].label,
        countLabel: "1 channel node"
      }),
      createSubNode({
        id: "comms-2",
        parentId: "comms",
        category: "comms",
        label: comms[1].label,
        x: 84,
        y: 42,
        background: "rgba(120,113,108,0.10)",
        borderColor: "rgba(120,113,108,0.10)",
        accentColor: "#5A5450",
        tooltip: comms[1].label,
        countLabel: "1 channel node"
      }),
      createSubNode({
        id: "comms-3",
        parentId: "comms",
        category: "comms",
        label: comms[2].label,
        x: 76,
        y: 26,
        background: "rgba(120,113,108,0.10)",
        borderColor: "rgba(120,113,108,0.10)",
        accentColor: "#5A5450",
        tooltip: comms[2].label,
        countLabel: "1 channel node"
      }),
      createSubNode({
        id: "team-1",
        parentId: "team",
        category: "team",
        label: team[0].label,
        x: 72,
        y: 76,
        background: "rgba(194,136,64,0.12)",
        borderColor: "rgba(194,136,64,0.12)",
        accentColor: "#B8543D",
        tooltip: team[0].label,
        countLabel: "1 team node"
      }),
      createSubNode({
        id: "team-2",
        parentId: "team",
        category: "team",
        label: team[1].label,
        x: 64,
        y: 82,
        background: "rgba(194,136,64,0.12)",
        borderColor: "rgba(194,136,64,0.12)",
        accentColor: "#B8543D",
        tooltip: team[1].label,
        countLabel: "1 team node"
      }),
      createSubNode({
        id: "team-3",
        parentId: "team",
        category: "team",
        label: team[2].label,
        x: 56,
        y: 74,
        background: "rgba(194,136,64,0.12)",
        borderColor: "rgba(194,136,64,0.12)",
        accentColor: "#B8543D",
        tooltip: team[2].label,
        countLabel: "1 team node"
      }),
      createSubNode({
        id: "changes-1",
        parentId: "changes",
        category: "changes",
        label: changes[0].label,
        x: 28,
        y: 78,
        background: "rgba(158,59,46,0.10)",
        borderColor: changes[0].borderColor,
        accentColor: changes[0].accentColor,
        tooltip: changes[0].label,
        countLabel: "1 change node"
      }),
      createSubNode({
        id: "changes-2",
        parentId: "changes",
        category: "changes",
        label: changes[1].label,
        x: 20,
        y: 68,
        background: "rgba(158,59,46,0.10)",
        borderColor: changes[1].borderColor,
        accentColor: changes[1].accentColor,
        tooltip: changes[1].label,
        countLabel: "1 change node"
      }),
      createSubNode({
        id: "decisions-1",
        parentId: "decisions",
        category: "decisions",
        label: decisions[0].label,
        x: 16,
        y: 28,
        background: "rgba(45,74,62,0.10)",
        borderColor: "rgba(45,74,62,0.10)",
        accentColor: "#B8543D",
        tooltip: decisions[0].label,
        countLabel: "1 decision node"
      }),
      createSubNode({
        id: "decisions-2",
        parentId: "decisions",
        category: "decisions",
        label: decisions[1].label,
        x: 22,
        y: 22,
        background: "rgba(45,74,62,0.10)",
        borderColor: "rgba(45,74,62,0.10)",
        accentColor: "#B8543D",
        tooltip: decisions[1].label,
        countLabel: "1 decision node"
      })
    ]
  };
}

export const mockProjectBrains: Record<string, ProjectBrainData> = {
  "1": createProjectBrainData({
    projectId: "1",
    projectName: "Northstar Cloud",
    docs: [
      { label: "PRD v2", description: "Product scope, milestones, and launch priorities." },
      { label: "SRS", description: "Functional requirements and billing constraints." },
      { label: "Tech Spec", description: "Architecture notes for checkout and onboarding." }
    ],
    comms: [
      { label: "Slack", description: "Daily team threads and sprint planning updates." },
      { label: "Gmail", description: "Client approvals and release notes." },
      { label: "WhatsApp", description: "Fast-turn client feedback on launch blockers." }
    ],
    team: [
      { label: "SC", description: "Sarah Chen coordinating billing and client approvals." },
      { label: "MT", description: "Marcus T owns backend integrations and QA handoff." },
      { label: "PK", description: "Priya K drives dashboard and onboarding UI." }
    ],
    changes: [
      { label: "Promo code", description: "Requested checkout discount support for launch week.", borderColor: "#9E3B2E", accentColor: "#9E3B2E" },
      { label: "Dark mode", description: "Low-priority UI refresh queued after v1 lock.", borderColor: "#B8543D", accentColor: "#B8543D" }
    ],
    decisions: [
      { label: "OAuth removed", description: "OAuth is out of v1 to reduce auth complexity." },
      { label: "v1 scope locked", description: "No new launch-critical features after QA freeze." }
    ]
  }),
  "2": createProjectBrainData({
    projectId: "2",
    projectName: "Elara Games",
    docs: [
      { label: "Game Loop", description: "Core progression systems and player loop notes." },
      { label: "SRS", description: "Technical requirements for gameplay APIs and UI." },
      { label: "Launch Plan", description: "Soft launch checklist and platform dependencies." }
    ],
    comms: [
      { label: "Slack", description: "Internal build reviews and bug triage." },
      { label: "Gmail", description: "Publisher approvals and art handoff notes." },
      { label: "WhatsApp", description: "Urgent launch-day coordination with stakeholders." }
    ],
    team: [
      { label: "SC", description: "Sarah Chen aligning roadmap and stakeholder feedback." },
      { label: "JW", description: "James W handling frontend systems and release prep." },
      { label: "PK", description: "Priya K leading product flows and UI polish." }
    ],
    changes: [
      { label: "HUD polish", description: "Late-stage UI cleanup before external testing.", borderColor: "#9E3B2E", accentColor: "#9E3B2E" },
      { label: "Dark mode", description: "Experimental theme work parked behind release tasks.", borderColor: "#B8543D", accentColor: "#B8543D" }
    ],
    decisions: [
      { label: "PvP deferred", description: "Competitive mode moves to the post-launch roadmap." },
      { label: "v1 scope locked", description: "Content freeze is active for first release." }
    ]
  }),
  "3": createProjectBrainData({
    projectId: "3",
    projectName: "API Gateway",
    docs: [
      { label: "Auth RFC", description: "Gateway auth model and service ownership." },
      { label: "SRS", description: "Throughput, uptime, and observability requirements." },
      { label: "Tech Spec", description: "Webhook retries and rate-limit design notes." }
    ],
    comms: [
      { label: "Slack", description: "Infra reviews and daily incident notes." },
      { label: "Gmail", description: "Enterprise integration threads and approvals." },
      { label: "WhatsApp", description: "Fast escalation path for client-side outages." }
    ],
    team: [
      { label: "SC", description: "Sarah Chen coordinating launch dependencies." },
      { label: "MT", description: "Marcus T leading backend rollout and auth migration." },
      { label: "AP", description: "Alex P supporting API testing and billing QA." }
    ],
    changes: [
      { label: "OAuth removed", description: "Scope trimmed to ship the core auth module.", borderColor: "#9E3B2E", accentColor: "#9E3B2E" },
      { label: "Retry queues", description: "Resilience update for webhook billing failures.", borderColor: "#B8543D", accentColor: "#B8543D" }
    ],
    decisions: [
      { label: "Spec frozen", description: "Gateway contract is frozen until partner review clears." },
      { label: "v1 scope locked", description: "Only reliability fixes can land before release." }
    ]
  })
};

export const mockDeadlines: DeadlineItem[] = [
  { id: "1", project: "Northstar Cloud", task: "Payment integration", dueDate: "Apr 24", daysLeft: 3, status: "on-track" },
  { id: "2", project: "API Gateway", task: "Auth module handoff", dueDate: "Apr 26", daysLeft: 5, status: "at-risk" },
  { id: "3", project: "Elara Games", task: "Dashboard v2 billing", dueDate: "May 2", daysLeft: 11, status: "on-track" }
];

export const mockRequests: RequestItem[] = [
  {
    id: "1",
    from: "Jack · Northstar Cloud",
    message: "Can we add a billing export review to checkout?",
    time: "2h ago",
    status: "pending",
    platform: "slack"
  },
  {
    id: "2",
    from: "Elena · Elara Games",
    message: "Need dark mode support across dashboard",
    time: "5h ago",
    status: "pending",
    platform: "email"
  },
  {
    id: "3",
    from: "Mike · API Gateway",
    message: "Confirmed: remove OAuth from v1 scope",
    time: "1d ago",
    status: "accepted",
    platform: "slack"
  },
  {
    id: "4",
    from: "Jack · Northstar Cloud",
    message: "Tenant Admin onboarding flow needs a tutorial step",
    time: "2d ago",
    status: "accepted",
    platform: "whatsapp"
  }
];

export const mockMeetings: MeetingItem[] = [
  { id: "1", title: "Northstar Cloud Standup", time: "9:00 AM", duration: "15 min", type: "standup", project: "Northstar Cloud" },
  { id: "2", title: "API Gateway Review", time: "11:30 AM", duration: "45 min", type: "review", project: "API Gateway" },
  { id: "3", title: "Client Sync · Elara", time: "2:00 PM", duration: "30 min", type: "client", project: "Elara Games" }
];

export const mockCalendarEvents: Record<string, CalendarDayData> = {
  "2026-04-21": {
    meetings: [
      { id: "1", title: "Northstar Cloud Standup", time: "9:00 AM", duration: "15 min", type: "standup", project: "Northstar Cloud" },
      { id: "2", title: "API Gateway Review", time: "11:30 AM", duration: "45 min", type: "review", project: "API Gateway" },
      { id: "3", title: "Client Sync · Elara", time: "2:00 PM", duration: "30 min", type: "client", project: "Elara Games" }
    ],
    deadlines: []
  },
  "2026-04-22": {
    meetings: [
      { id: "4", title: "Sprint Planning", time: "10:00 AM", duration: "60 min", type: "meeting", project: "Northstar Cloud" }
    ],
    deadlines: []
  },
  "2026-04-24": {
    meetings: [
      { id: "5", title: "Elara Design Review", time: "3:00 PM", duration: "30 min", type: "review", project: "Elara Games" }
    ],
    deadlines: [mockDeadlines[0]]
  },
  "2026-04-26": {
    meetings: [],
    deadlines: [mockDeadlines[1]]
  },
  "2026-05-02": {
    meetings: [],
    deadlines: [mockDeadlines[2]]
  }
};

export const mockRoles: RoleOption[] = [
  { key: "manager", label: "Manager", icon: "briefcase" },
  { key: "dev", label: "Dev", icon: "code" },
  { key: "client", label: "Client", icon: "eye" }
];

export const mockSocratesSuggestions: SocratesSuggestionGroups = {
  dashboard: [
    "What's due soon?",
    "Any pending requests?",
    "Today's meetings?"
  ],
  project: [
    "What's due soon?",
    "Any pending requests?",
    "Today's meetings?"
  ]
};

export const mockSocratesReplies: SocratesReplyGroups = {
  dashboard: "I can summarize your deadlines, outstanding requests, and today's meetings from the current product state once the backend is connected.",
  project: "I can summarize your deadlines, outstanding requests, and today's meetings from the current product state once the backend is connected."
};

export const mockSocratesMessages: ChatMessage[] = [];
