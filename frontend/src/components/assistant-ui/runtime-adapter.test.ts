import { describe, it, expect, vi } from "vitest";
import { PMCoPilotRuntimeAdapter } from "./runtime-adapter";
import type { LLMProviderConfig } from "@/types";

// Mock prdApi
vi.mock("@/lib/api", () => ({
  prdApi: {
    generateContent: vi.fn().mockResolvedValue({
      generated_content: "Hello world",
      input_tokens: 1000,
      output_tokens: 500,
      generation_time: 1.23,
      langfuse_data: { traceId: "t1", generationId: "g1" },
    }),
    critique: vi.fn().mockResolvedValue({
      summary: "Critique summary",
      input_tokens: 1000,
      output_tokens: 400,
      generation_time: 0.9,
      langfuse_data: { traceId: "t2", generationId: "g2" },
    }),
    question: vi.fn().mockResolvedValue({
      answer: "Answer here",
      input_tokens: 800,
      output_tokens: 300,
      generation_time: 0.5,
      langfuse_data: { traceId: "t3", generationId: "g3" },
    }),
  },
}));

// Mock metadata store
interface StoredMetadata {
  inputTokens?: number;
  outputTokens?: number;
  generationTime?: number;
  cost?: number;
  provider?: string;
  model?: string;
  langfuseData?: { traceId: string; generationId: string };
  timestamp?: Date;
}
const metadata: Record<string, StoredMetadata> = {};
vi.mock("@/store/message-metadata-store", () => ({
  useMessageMetadataStore: {
    getState: () => ({
      setMessageMetadata: (id: string, data: unknown) => {
        const value = data as StoredMetadata;
        metadata[id] = value;
      },
    }),
  },
}));

const provider: LLMProviderConfig = {
  type: "openai",
  name: "OpenAI",
  apiKey: "k",
  models: [
    {
      id: "gpt-test",
      name: "gpt-test",
      costPer1MTokens: { input: 2, output: 8 },
    },
  ],
  isConfigured: true,
};

describe("PMCoPilotRuntimeAdapter", () => {
  it("adds cost metadata for create mode", async () => {
    const adapter = new PMCoPilotRuntimeAdapter(provider, "gpt-test");
    adapter.setMode("create");
    adapter.setTemplateId("tmpl");

    const modelAdapter = adapter.getModelAdapter();
    await modelAdapter.run({
      messages: [
        { id: "1", role: "user", content: "Draft PRD", createdAt: new Date() },
      ],
    });

    const state = adapter.getState();
    const last = state.messages[state.messages.length - 1];
    expect(last?.role).toBe("assistant");
    // Assert cost metadata persisted
    const metaEntries = Object.values(metadata);
    expect(metaEntries.length).toBeGreaterThan(0);
    const meta = metaEntries[0];
    expect(meta.cost).toBeGreaterThan(0);
    expect(meta.inputTokens).toBe(1000);
    expect(meta.outputTokens).toBe(500);
  });
});
