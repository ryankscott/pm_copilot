import type { ProviderType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Check, X, Settings as SettingsIcon } from "lucide-react";
import { useLLMStore } from "@/store/llm-store";
import { useState } from "react";
import { providerApi } from "@/lib/api";

const PROVIDER_INFO: Record<
  ProviderType,
  {
    name: string;
    description: string;
    website: string;
    keyLabel: string;
    placeholder: string;
  }
> = {
  openai: {
    name: "OpenAI",
    description: "GPT models including GPT-4.1 and o3",
    website: "https://platform.openai.com/api-keys",
    keyLabel: "API Key",
    placeholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude models for advanced reasoning and writing",
    website: "https://console.anthropic.com/settings/keys",
    keyLabel: "API Key",
    placeholder: "sk-ant-...",
  },
  google: {
    name: "Google AI",
    description: "Gemini models with long context and multimodal capabilities",
    website: "https://aistudio.google.com/app/apikey",
    keyLabel: "API Key",
    placeholder: "AIza...",
  },
  ollama: {
    name: "Ollama",
    description: "Local AI models running on your machine",
    website: "https://ollama.ai",
    keyLabel: "Base URL",
    placeholder: "http://localhost:11434",
  },
};

function ProviderCard({ type }: { type: ProviderType }) {
  const { settings, updateProvider, setApiKey, isProviderConfigured } =
    useLLMStore();
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState<string>("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [apiKey, setApiKeyLocal] = useState(
    settings.providers[type].apiKey || ""
  );

  const provider = settings.providers[type];
  const info = PROVIDER_INFO[type];
  const isConfigured = isProviderConfigured(type);

  const handleApiKeyChange = (value: string) => {
    setApiKeyLocal(value);
    setApiKey(type, value);
    // Reset test status when credentials change
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestError("");
      setResponseTime(null);
    }
  };

  const handleBaseUrlChange = (value: string) => {
    updateProvider(type, { baseURL: value });
    // Reset test status when configuration changes
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestError("");
      setResponseTime(null);
    }
  };

  const isReadyToTest = () => {
    if (type === "ollama") {
      return provider.baseURL && provider.baseURL.trim() !== "";
    }
    return isConfigured;
  };

  const testConnection = async () => {
    setTestStatus("testing");
    setTestError("");
    setResponseTime(null);

    try {
      // Get a default model for the provider
      const defaultModel = provider.models[0]?.id || "default";

      const result = await providerApi.testConnection(provider, defaultModel);

      if (result.success) {
        setTestStatus("success");
        setResponseTime(result.responseTime || null);
        updateProvider(type, {
          lastTested: new Date().toISOString(),
          lastTestSuccess: true,
        });
      } else {
        setTestStatus("error");
        setTestError(result.error || "Connection failed");
        updateProvider(type, {
          lastTested: new Date().toISOString(),
          lastTestSuccess: false,
        });
      }
    } catch (error) {
      console.error("Provider test failed:", error);
      setTestStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setTestError(errorMessage);
      updateProvider(type, {
        lastTested: new Date().toISOString(),
        lastTestSuccess: false,
      });
    }
  };
  return (
    <Card className="flex p-6 max-w-sm w-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConfigured ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <div className="min-h-14">
            <h3 className="font-semibold text-lg">{info.name}</h3>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        {isConfigured && <Check className="text-green-500 w-5 h-5" />}
      </div>

      <div className="space-y-4">
        {type !== "ollama" ? (
          <div className="space-y-2">
            <Label htmlFor={`${type}-key`}>{info.keyLabel}</Label>
            <div className="relative">
              <Input
                id={`${type}-key`}
                type={showKey ? "text" : "password"}
                placeholder={info.placeholder}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href={info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {info.name} Dashboard
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="ollama-url">Base URL</Label>
            <Input
              id="ollama-url"
              placeholder={info.placeholder}
              value={provider.baseURL || ""}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Make sure Ollama is running locally or update the URL
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={testStatus === "testing" || !isReadyToTest()}
            variant="outline"
            size="sm"
          >
            {testStatus === "testing" ? "Testing..." : "Test Connection"}
          </Button>

          {testStatus === "success" && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Connected</span>
              {responseTime && (
                <span className="text-muted-foreground">
                  ({responseTime.toFixed(2)}s)
                </span>
              )}
            </div>
          )}

          {testStatus === "error" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <X className="w-4 h-4" />
                <span>Failed</span>
              </div>
              {testError && (
                <p className="text-xs text-red-600 break-words">{testError}</p>
              )}
            </div>
          )}
        </div>

        {/* Show last test info if available */}
        {provider.lastTested && testStatus === "idle" && (
          <div className="text-xs text-muted-foreground">
            Last tested: {new Date(provider.lastTested!).toLocaleString()}
            {provider.lastTestSuccess !== undefined && (
              <span
                className={
                  provider.lastTestSuccess ? "text-green-600" : "text-red-600"
                }
              >
                {" "}
                ({provider.lastTestSuccess ? "Success" : "Failed"})
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function ModelSelection() {
  const { settings, setSelectedProvider, setSelectedModel } = useLLMStore();
  const currentProvider = settings.providers[settings.selectedProvider];
  const availableProviders = Object.entries(settings.providers)
    .filter(([, provider]) => provider.isConfigured)
    .map(([type]) => ({ type: type as ProviderType }));

  return (
    <Card className="p-6 max-w-md">
      <h3 className="font-semibold text-lg mb-4">Active Model Selection</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select
            value={settings.selectedProvider}
            onValueChange={(value) =>
              setSelectedProvider(value as ProviderType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map(({ type }) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {PROVIDER_INFO[type].name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={settings.selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentProvider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    {model.description && (
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settings.selectedModel && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Model Details</h4>
            {(() => {
              const model = currentProvider.models.find(
                (m) => m.id === settings.selectedModel
              );
              if (!model) return null;

              return (
                <div className="space-y-1 text-sm">
                  <div>Max Tokens: {model.maxTokens?.toLocaleString()}</div>
                  {model.costPer1kTokens && (
                    <div>
                      Cost: ${model.costPer1kTokens.input}/1k input, $
                      {model.costPer1kTokens.output}/1k output
                    </div>
                  )}
                  <div>
                    Streaming:{" "}
                    {model.supportsStreaming ? "Supported" : "Not supported"}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}

export function Settings() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="models">Model Selection</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6 max-4-xl">
          <div className="flex flex-wrap gap-4 w-full">
            {(Object.keys(PROVIDER_INFO) as ProviderType[]).map((type) => (
              <ProviderCard key={type} type={type} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models">
          <ModelSelection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
