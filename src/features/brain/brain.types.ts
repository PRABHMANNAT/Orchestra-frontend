export type BrainCategory = "doc" | "decision" | "comms" | "team" | "change";

export interface BrainNode {
  id: string;
  category: BrainCategory;
  title: string;
  description: string;
  source?: string;
  author?: string;
  updatedAt: string;
  thumbnail?: string;
  featured?: boolean;
  position?: { lat: number; lng: number };
  connections?: string[];
}

export interface BrainData {
  projectId: string;
  projectName: string;
  nodes: BrainNode[];
  syncedAt: string;
}
