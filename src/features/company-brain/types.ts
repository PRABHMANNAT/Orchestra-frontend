/* Company Brain — shared types */

export type DocSource = "drive" | "slack" | "notion" | "github" | "manual" | "url" | "loom";
export type DocType = "pdf" | "docx" | "md" | "txt" | "image" | "audio" | "video" | "code" | "url";
export type AccessLevel =
  | "public-team"
  | "project-only"
  | "role-restricted"
  | "private"
  | "human-only";
export type Freshness = "fresh" | "stale-soon" | "stale";

export interface Person {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

export interface BrainDoc {
  id: string;
  title: string;
  summary: string;        // 2-3 line auto-summary
  type: DocType;
  source: DocSource;
  uploaderId: string;
  uploadedAt: string;     // pre-formatted relative
  modifiedAt?: string;
  tags: string[];
  projectId?: string;
  access: AccessLevel;
  freshness: Freshness;
  isSourceOfTruth?: string; // topic if truth
  expiresAt?: string;
  fetchedThisWeek?: { humans: number; agents: number };
  content?: string;         // for the detail page (markdown-ish)
  transcript?: { ts: string; text: string }[];
  versions?: { v: string; ts: string; by: string }[];
  conflictWith?: { docId: string; topic: string };
}

export interface SmartCollection {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

export interface Conflict {
  id: string;
  docA: { id: string; title: string };
  docB: { id: string; title: string };
  topic: string;
  claim: string;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  signal: string;     // e.g. "12 dev questions this week, no canonical doc"
  count: number;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actorId: string;
  actorKind: "human" | "agent";
  action: "viewed" | "fetched" | "edited" | "used-in-agent-response" | "downloaded" | "deleted";
  docId: string;
  docTitle: string;
  context: string;     // prompt or page that triggered
  suspicious?: string; // reason flagged
}

export interface ContextPack {
  id: string;
  name: string;
  description: string;
  docIds: string[];
  triggers: string[];
  status: "active" | "paused";
  usedByAgents: number;
  loadsThisWeek: number;
  successRate: number; // 0..100
  lastUpdated: string;
}

export interface SuggestedPack {
  id: string;
  reason: string;       // "Agents fetched these 4 together 23 times"
  suggestedName: string;
  docIds: string[];
}

export interface AgentFeedback {
  id: string;
  question: string;
  answer: string;
  citedDocId: string;
  citedDocTitle: string;
  correction: string;
  flaggedBy: string;
  ts: string;
  status: "open" | "resolved" | "dismissed";
}

export interface PermissionsMatrixRow {
  id: string;
  kind: "team" | "role" | "person";
  name: string;
  permissions: {
    view: boolean;
    useInAgentContext: boolean;
    editMetadata: boolean;
    delete: boolean;
  };
}
