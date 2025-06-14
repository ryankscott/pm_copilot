import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  X,
  Settings2,
  Check,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
} from "lucide-react";
import {
  getStoredAPIKeys,
  storeAPIKeys,
  clearStoredAPIKeys,
} from "../lib/apiKeys";

export type AIProvider = "openai" | "claude" | "gemini" | "ollama";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

interface APIKeys {
  openai: string;
  claude: string;
  gemini: string;
  ollama: string;
}

const providers = [
  {
    id: "openai" as AIProvider,
    name: "OpenAI",
    description: "OpenAI models (GPT-4, GPT-3.5)",
    apiKeyLabel: "OpenAI API Key",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
  },
  {
    id: "claude" as AIProvider,
    name: "Anthropic Claude",
    description: "Claude models",
    apiKeyLabel: "Anthropic API Key",
    placeholder: "sk-ant-...",
    url: "https://console.anthropic.com/",
  },
  {
    id: "gemini" as AIProvider,
    name: "Google Gemini",
    description: "Gemini Pro and Flash models",
    apiKeyLabel: "Google AI API Key",
    placeholder: "AI...",
    url: "https://makersuite.google.com/app/apikey",
  },
  {
    id: "ollama" as AIProvider,
    name: "Ollama",
    description: "Local AI models (requires Ollama installation)",
    apiKeyLabel: "Ollama Base URL",
    placeholder: "http://localhost:11434",
    url: "https://ollama.ai/",
  },
];

export function Settings({
  isOpen,
  onClose,
  provider,
  onProviderChange,
}: SettingsProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>(provider);
  const [apiKeys, setApiKeys] = useState<APIKeys>(getStoredAPIKeys);
  const [showApiKeys, setShowApiKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    claude: false,
    gemini: false,
    ollama: false,
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [testingKeys, setTestingKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    claude: false,
    gemini: false,
    ollama: false,
  });
  const [testResults, setTestResults] = useState<
    Record<AIProvider, "success" | "error" | null>
  >({
    openai: null,
    claude: null,
    gemini: null,
    ollama: null,
  });

  useEffect(() => {
    setSelectedProvider(provider);
  }, [provider]);

  useEffect(() => {
    if (isOpen) {
      setApiKeys(getStoredAPIKeys());
    }
  }, [isOpen]);

  const handleSave = () => {
    // Validate all API keys before saving
    const invalidKeys: string[] = [];
    providers.forEach((providerOption) => {
      const key = apiKeys[providerOption.id];
      if (
        key &&
        key.trim().length > 0 &&
        !validateAPIKey(providerOption.id, key)
      ) {
        invalidKeys.push(providerOption.name);
      }
    });

    if (invalidKeys.length > 0) {
      // Don't save if there are invalid keys
      return;
    }

    // Store API keys
    storeAPIKeys(apiKeys);

    // Update provider
    onProviderChange(selectedProvider);

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      onClose();
    }, 1500);
  };

  const handleClearAllKeys = () => {
    if (confirm("Are you sure you want to clear all stored API keys?")) {
      clearStoredAPIKeys();
      setApiKeys({ openai: "", claude: "", gemini: "", ollama: "" });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const toggleShowApiKey = (provider: AIProvider) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const isProviderConfigured = (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (provider === "ollama") {
      return true; // Ollama can work without API key (local)
    }
    return key && key.trim().length > 0 && validateAPIKey(provider, key);
  };

  const validateAPIKey = (provider: AIProvider, key: string): boolean => {
    if (!key || key.trim().length === 0) return false;

    switch (provider) {
      case "openai":
        return key.startsWith("sk-");
      case "claude":
        return key.startsWith("sk-ant-");
      case "gemini":
        return key.length > 10; // Basic length check for Google AI keys
      case "ollama":
        return (
          key.startsWith("http://") || key.startsWith("https://") || key === ""
        );
      default:
        return true;
    }
  };

  const getKeyValidationMessage = (
    provider: AIProvider,
    key: string
  ): string | null => {
    if (!key || key.trim().length === 0) {
      if (provider === "ollama") return null;
      return `${
        providers.find((p) => p.id === provider)?.apiKeyLabel
      } is required`;
    }

    if (!validateAPIKey(provider, key)) {
      switch (provider) {
        case "openai":
          return "OpenAI API keys should start with 'sk-'";
        case "claude":
          return "Anthropic API keys should start with 'sk-ant-'";
        case "gemini":
          return "Please enter a valid Google AI API key";
        case "ollama":
          return "Please enter a valid URL (e.g., http://localhost:11434)";
        default:
          return "Invalid API key format";
      }
    }

    return null;
  };

  const hasInvalidKeys = (): boolean => {
    return providers.some((providerOption) => {
      const key = apiKeys[providerOption.id];
      return (
        key && key.trim().length > 0 && !validateAPIKey(providerOption.id, key)
      );
    });
  };

  const getInvalidKeysList = (): string[] => {
    return providers
      .filter((providerOption) => {
        const key = apiKeys[providerOption.id];
        return (
          key &&
          key.trim().length > 0 &&
          !validateAPIKey(providerOption.id, key)
        );
      })
      .map((p) => p.name);
  };

  const testAPIKey = async (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (!key || !validateAPIKey(provider, key)) {
      return;
    }

    setTestingKeys((prev) => ({ ...prev, [provider]: true }));
    setTestResults((prev) => ({ ...prev, [provider]: null }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: key,
          messages: [
            { role: "user", content: 'Test connection - respond with "OK"' },
          ],
          test: true,
        }),
      });

      if (response.ok) {
        setTestResults((prev) => ({ ...prev, [provider]: "success" }));
        setTimeout(
          () => setTestResults((prev) => ({ ...prev, [provider]: null })),
          3000
        );
      } else {
        setTestResults((prev) => ({ ...prev, [provider]: "error" }));
        setTimeout(
          () => setTestResults((prev) => ({ ...prev, [provider]: null })),
          3000
        );
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [provider]: "error" }));
      setTimeout(
        () => setTestResults((prev) => ({ ...prev, [provider]: null })),
        3000
      );
    } finally {
      setTestingKeys((prev) => ({ ...prev, [provider]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50  flex items-center justify-center z-50">
      <div className="bg-background rounded-lg bg-white shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            {showSuccessMessage && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Settings saved!</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">
              AI Provider
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which AI provider to use and configure your API keys.
            </p>
          </div>

          <div className="space-y-6">
            {providers.map((providerOption) => (
              <div
                key={providerOption.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedProvider === providerOption.id
                    ? "border-primary bg-blue-100"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setSelectedProvider(providerOption.id)}
                    >
                      <h4 className="font-medium text-foreground">
                        {providerOption.name}
                      </h4>

                      {isProviderConfigured(providerOption.id) && (
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full"
                          title="Configured"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {providerOption.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {providerOption.apiKeyLabel}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={
                          showApiKeys[providerOption.id] ? "text" : "password"
                        }
                        value={apiKeys[providerOption.id] || ""}
                        onChange={(e) =>
                          handleApiKeyChange(providerOption.id, e.target.value)
                        }
                        placeholder={providerOption.placeholder}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowApiKey(providerOption.id)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKeys[providerOption.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {/* Test button for API keys */}
                    {apiKeys[providerOption.id] &&
                      validateAPIKey(
                        providerOption.id,
                        apiKeys[providerOption.id]
                      ) &&
                      providerOption.id !== "ollama" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testAPIKey(providerOption.id)}
                          disabled={testingKeys[providerOption.id]}
                          className="px-3 whitespace-nowrap"
                        >
                          {testingKeys[providerOption.id] ? (
                            "Testing..."
                          ) : testResults[providerOption.id] === "success" ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Valid
                            </span>
                          ) : testResults[providerOption.id] === "error" ? (
                            <span className="flex items-center gap-1 text-red-600">
                              <X className="w-3 h-3" />
                              Failed
                            </span>
                          ) : (
                            "Test"
                          )}
                        </Button>
                      )}
                  </div>
                  {/* Validation message */}
                  {apiKeys[providerOption.id] &&
                    getKeyValidationMessage(
                      providerOption.id,
                      apiKeys[providerOption.id]
                    ) && (
                      <p className="text-xs text-destructive mt-1">
                        {getKeyValidationMessage(
                          providerOption.id,
                          apiKeys[providerOption.id]
                        )}
                      </p>
                    )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {providerOption.id === "ollama"
                        ? "Leave empty for default (http://localhost:11434)"
                        : "Required for this provider"}
                    </p>
                    <a
                      href={providerOption.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Get API Key
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">💡 Setup Tips</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • API keys are stored securely in your browser's local storage
              </p>
              <p>
                • Keys are never sent to our servers - only to the respective AI
                providers
              </p>
              <p>
                • For Ollama, make sure you have it installed and running
                locally
              </p>
              <p>• You can change providers and API keys anytime in settings</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllKeys}
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Keys
            </Button>
            {hasInvalidKeys() && (
              <p className="text-xs text-destructive">
                Please fix invalid API keys: {getInvalidKeysList().join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={hasInvalidKeys()}
              className={
                hasInvalidKeys() ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
