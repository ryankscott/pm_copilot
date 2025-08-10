import type { LLMModel, LLMProviderConfig } from "@/types";

/**
 * Calculate approximate cost in USD for a model invocation given token counts.
 * Pricing is defined per 1M tokens in each model's costPer1MTokens field.
 * Returns 0 if pricing data is missing.
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string | undefined,
  provider: LLMProviderConfig | undefined
): number {
  if (!modelId || !provider || !provider.models) return 0;
  const model: LLMModel | undefined = provider.models.find(
    (m) => m.id === modelId
  );
  if (!model || !model.costPer1MTokens) return 0;
  const inputCost = (inputTokens / 1_000_000) * model.costPer1MTokens.input;
  const outputCost = (outputTokens / 1_000_000) * model.costPer1MTokens.output;
  return inputCost + outputCost;
}

/** Format a cost number to a user-friendly string with 4 decimal places. */
export function formatCost(cost: number): string {
  if (!cost || Number.isNaN(cost)) return "$0.0000";
  return `$${cost.toFixed(4)}`;
}
