import type { AIProvider } from "../components/Settings";

interface APIKeys {
  openai: string;
  claude: string;
  gemini: string;
  ollama: string;
}

// Helper functions for localStorage
export const getStoredAPIKeys = (): APIKeys => {
  try {
    const stored = localStorage.getItem("pmcopilot-api-keys");
    return stored
      ? JSON.parse(stored)
      : { openai: "", claude: "", gemini: "", ollama: "" };
  } catch {
    return { openai: "", claude: "", gemini: "", ollama: "" };
  }
};

export const storeAPIKeys = (apiKeys: APIKeys) => {
  localStorage.setItem("pmcopilot-api-keys", JSON.stringify(apiKeys));
};

export const getStoredAPIKey = (provider: AIProvider): string => {
  const keys = getStoredAPIKeys();
  return keys[provider] || "";
};

export const clearStoredAPIKeys = () => {
  localStorage.removeItem("pmcopilot-api-keys");
};
