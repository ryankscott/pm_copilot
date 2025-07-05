import type { LLMProvider } from "@/types";
import { create } from "zustand";

// Legacy store for backwards compatibility
// New code should use useLLMStore from store/llm-store.ts
interface AppState {
  llmProvider: LLMProvider;
  setLLMProvider: (provider: LLMProvider) => void;
}

export const useAppStore = create<AppState>((set) => ({
  llmProvider: { name: "ollama" },
  setLLMProvider: (provider: LLMProvider) => set({ llmProvider: provider }),
}));
