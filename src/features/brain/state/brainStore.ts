import { create } from "zustand";
import type { BrainCategory, BrainNode } from "../brain.types";

type BrainState = {
  selectedNode: BrainNode | null;
  hoveredNode: BrainNode | null;
  activeFilter: BrainCategory | null;
  searchQuery: string;
  activeTab: "detail" | "socrates";
  chatHistory: BrainMessage[];
  isRotationPaused: boolean;
  savedNodeIds: string[];
  selectNode: (node: BrainNode) => void;
  clearSelection: () => void;
  saveSelectedNode: () => void;
  setHovered: (node: BrainNode | null) => void;
  setFilter: (category: BrainCategory | null) => void;
  setSearchQuery: (query: string) => void;
  setTab: (tab: "detail" | "socrates") => void;
  addMessage: (message: BrainMessage) => void;
  setRotationPaused: (paused: boolean) => void;
  matchesFilter: (node: BrainNode) => boolean;
  matchesSearch: (node: BrainNode) => boolean;
};

export type BrainMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export const useBrainStore = create<BrainState>((set, get) => ({
  selectedNode: null,
  hoveredNode: null,
  activeFilter: null,
  searchQuery: "",
  activeTab: "detail",
  chatHistory: [],
  isRotationPaused: false,
  savedNodeIds: [],
  selectNode: (node) => set({ selectedNode: node, isRotationPaused: true, activeTab: "detail", chatHistory: [] }),
  clearSelection: () => {
    set({ selectedNode: null, activeTab: "detail", chatHistory: [] });
    window.setTimeout(() => {
      if (!get().selectedNode && !get().hoveredNode) {
        set({ isRotationPaused: false });
      }
    }, 2000);
  },
  saveSelectedNode: () =>
    set((state) => {
      if (!state.selectedNode || state.savedNodeIds.includes(state.selectedNode.id)) {
        return state;
      }
      return { savedNodeIds: [...state.savedNodeIds, state.selectedNode.id] };
    }),
  setHovered: (node) => set({ hoveredNode: node, isRotationPaused: Boolean(node) || Boolean(get().selectedNode) }),
  setFilter: (category) => set((state) => ({ activeFilter: state.activeFilter === category ? null : category })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTab: (tab) => set({ activeTab: tab }),
  addMessage: (message) => set((state) => ({ chatHistory: [...state.chatHistory, message] })),
  setRotationPaused: (paused) => set({ isRotationPaused: paused || Boolean(get().selectedNode) }),
  matchesFilter: (node) => {
    const { activeFilter, selectedNode } = get();
    if (selectedNode && selectedNode.id !== node.id) {
      return false;
    }
    if (activeFilter && node.category !== activeFilter) {
      return false;
    }
    return get().matchesSearch(node);
  },
  matchesSearch: (node) => {
    const { searchQuery } = get();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${node.title} ${node.description} ${node.source ?? ""} ${node.author ?? ""}`.toLowerCase().includes(query);
  }
}));
