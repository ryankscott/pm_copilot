import { describe, it, expect } from "vitest";
import { calculateCost } from "./cost";
import type { LLMProviderConfig, LLMModel } from "@/types";

const mockProvider = (models: LLMModel[]): LLMProviderConfig => ({
  type: "openai",
  name: "OpenAI",
  apiKey: "test",
  models,
  isConfigured: true,
});

describe("calculateCost", () => {
  it("returns 0 when modelId missing", () => {
    const cost = calculateCost(1000, 2000, undefined, mockProvider([]));
    expect(cost).toBe(0);
  });

  it("returns 0 when provider missing models", () => {
    const provider = { ...mockProvider([]), models: [] };
    const cost = calculateCost(1000, 2000, "model-x", provider);
    expect(cost).toBe(0);
  });

  it("returns 0 when pricing absent", () => {
    const provider = mockProvider([{ id: "m1", name: "M1" }]);
    const cost = calculateCost(1000, 500, "m1", provider);
    expect(cost).toBe(0);
  });

  it("computes correct cost", () => {
    const provider = mockProvider([
      {
        id: "m1",
        name: "M1",
        costPer1MTokens: { input: 2, output: 8 },
      },
    ]);
    // 1000 input tokens => 1000/1e6 * 2 = 0.002
    // 500 output tokens => 500/1e6 * 8 = 0.004
    const cost = calculateCost(1000, 500, "m1", provider);
    expect(cost).toBeCloseTo(0.006, 10);
  });
});
