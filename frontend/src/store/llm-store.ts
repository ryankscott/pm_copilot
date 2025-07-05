import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LLMSettings,
  LLMProviderConfig,
  ProviderType,
  LLMModel,
} from "@/types";

// Default model configurations for each provider
const DEFAULT_MODELS: Record<ProviderType, LLMModel[]> = {
  openai: [
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      description: "Smartest model for complex tasks",
      maxTokens: 128000,
      supportsStreaming: true,
      costPer1MTokens: { input: 2.0, output: 8.0 },
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      description: "Affordable model balancing speed and intelligence",
      maxTokens: 128000,
      supportsStreaming: true,
      costPer1MTokens: { input: 0.4, output: 1.6 },
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      description: "Fastest, most cost-effective model for low-latency tasks",
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1MTokens: { input: 0.1, output: 0.4 },
    },
  ],
  anthropic: [
    {
      id: "claude-3.5-haiku",
      name: "Claude 3.5 Haiku",
      description: "Fastest, most cost-effective model",
      maxTokens: 200000,
      supportsStreaming: true,
      costPer1MTokens: { input: 0.8, output: 4.0 },
    },
  ],
  google: [
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      description:
        "Most capable and versatile model for complex reasoning, coding, and creative tasks.",
      maxTokens: 8192000,
      supportsStreaming: true,
      costPer1MTokens: {
        input: 3.5,
        output: 10.5,
      },
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      description:
        "Fast and cost-effective model optimized for high-volume, low-latency tasks.",
      maxTokens: 1048576,
      supportsStreaming: true,
      costPer1MTokens: {
        input: 0.35,
        output: 1.05,
      },
    },
    {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash-Lite",
      description:
        "Lightest and most efficient model for on-device or highly constrained environments.",
      maxTokens: 1048576,
      supportsStreaming: true,
      costPer1MTokens: {
        input: 0.18,
        output: 0.53,
      },
    },
  ],
  ollama: [
    {
      id: "llama3.2:latest",
      name: "Llama 3.2",
      description: "Local model from Meta",
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1kTokens: { input: 0, output: 0 },
    },
    {
      id: "gemma3:latest",
      name: "Gemma 3",
      description: "Local model, no API costs",
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1kTokens: { input: 0, output: 0 },
    },
  ],
};

// Default provider configurations
const createDefaultProviderConfig = (
  type: ProviderType
): LLMProviderConfig => ({
  type,
  name: type.charAt(0).toUpperCase() + type.slice(1),
  apiKey: "",
  baseURL: type === "ollama" ? "http://localhost:11434" : undefined,
  models: DEFAULT_MODELS[type],
  isConfigured: type === "ollama", // Ollama doesn't need API key
  lastTested: undefined,
});

const DEFAULT_SETTINGS: LLMSettings = {
  selectedProvider: "ollama",
  selectedModel: "llama3.2:latest",
  providers: {
    openai: createDefaultProviderConfig("openai"),
    anthropic: createDefaultProviderConfig("anthropic"),
    google: createDefaultProviderConfig("google"),
    ollama: createDefaultProviderConfig("ollama"),
  },
  defaultSettings: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
  },
};

interface LLMStore {
  settings: LLMSettings;

  // Provider management
  updateProvider: (
    type: ProviderType,
    config: Partial<LLMProviderConfig>
  ) => void;
  setSelectedProvider: (type: ProviderType) => void;
  setSelectedModel: (modelId: string) => void;

  // API key management
  setApiKey: (type: ProviderType, apiKey: string) => void;
  clearApiKey: (type: ProviderType) => void;

  // Model management
  addCustomModel: (type: ProviderType, model: LLMModel) => void;
  removeCustomModel: (type: ProviderType, modelId: string) => void;

  // Settings
  updateDefaultSettings: (
    settings: Partial<LLMSettings["defaultSettings"]>
  ) => void;

  // Utility functions
  getCurrentProvider: () => LLMProviderConfig;
  getCurrentModel: () => LLMModel | undefined;
  isProviderConfigured: (type: ProviderType) => boolean;

  // Reset
  resetToDefaults: () => void;
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateProvider: (type, config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [type]: { ...state.settings.providers[type], ...config },
            },
          },
        })),

      setSelectedProvider: (type) =>
        set((state) => {
          const provider = state.settings.providers[type];
          const defaultModel = provider.models[0]?.id || "";
          return {
            settings: {
              ...state.settings,
              selectedProvider: type,
              selectedModel: defaultModel,
            },
          };
        }),

      setSelectedModel: (modelId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            selectedModel: modelId,
          },
        })),

      setApiKey: (type, apiKey) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [type]: {
                ...state.settings.providers[type],
                apiKey,
                isConfigured: type === "ollama" || !!apiKey,
              },
            },
          },
        })),

      clearApiKey: (type) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [type]: {
                ...state.settings.providers[type],
                apiKey: "",
                isConfigured: type === "ollama",
              },
            },
          },
        })),

      addCustomModel: (type, model) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [type]: {
                ...state.settings.providers[type],
                models: [...state.settings.providers[type].models, model],
              },
            },
          },
        })),

      removeCustomModel: (type, modelId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [type]: {
                ...state.settings.providers[type],
                models: state.settings.providers[type].models.filter(
                  (m) => m.id !== modelId
                ),
              },
            },
          },
        })),

      updateDefaultSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            defaultSettings: {
              ...state.settings.defaultSettings,
              ...newSettings,
            },
          },
        })),

      getCurrentProvider: () => {
        const state = get();
        return state.settings.providers[state.settings.selectedProvider];
      },

      getCurrentModel: () => {
        const state = get();
        const provider = state.getCurrentProvider();
        return provider.models.find(
          (m) => m.id === state.settings.selectedModel
        );
      },

      isProviderConfigured: (type) => {
        const state = get();
        return state.settings.providers[type].isConfigured;
      },

      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "llm-settings",
      // Only persist essential settings, not sensitive data like API keys in production
      partialize: (state) => ({
        settings: {
          ...state.settings,
          providers: Object.fromEntries(
            Object.entries(state.settings.providers).map(([key, provider]) => [
              key,
              {
                ...provider,
                // In production, you might want to encrypt API keys or store them more securely
                apiKey: provider.apiKey,
              },
            ])
          ) as Record<ProviderType, LLMProviderConfig>,
        },
      }),
    }
  )
);

// Export default models for easy access
export { DEFAULT_MODELS };
