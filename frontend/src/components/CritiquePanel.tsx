import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MessageSquare, Loader2 } from "lucide-react";
import type { PRD, CritiqueRequest, CritiqueResponse } from "@/types";
import { prdApi } from "@/lib/api";
import { Textarea } from "./ui/textarea";
import { useLLMStore } from "@/store/llm-store";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { MetadataFooter } from "./ui/metadata-footer";

interface CritiquePanelProps {
  prd: PRD;
}

export function CritiquePanel({ prd }: CritiquePanelProps) {
  const { getCurrentProvider, settings } = useLLMStore();

  // Formal critique functionality
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResponse | null>(
    null
  );
  const [isCritiqueLoading, setIsCritiqueLoading] = useState(false);
  const [critiqueSettings, setCritiqueSettings] = useState<{
    focusAreas: Array<
      | "completeness"
      | "clarity"
      | "structure"
      | "feasibility"
      | "requirements"
      | "user_experience"
      | "technical"
      | "business_value"
    >;
    depth: "surface" | "detailed" | "comprehensive";
    includeSuggestions: boolean;
    customCriteria: string;
  }>({
    focusAreas: ["completeness", "clarity", "structure"],
    depth: "detailed",
    includeSuggestions: true,
    customCriteria: "",
  });

  // Handle formal critique generation
  const handleGenerateCritique = async () => {
    setIsCritiqueLoading(true);
    setCritiqueResult(null);

    try {
      const request: CritiqueRequest = {
        existing_content: prd.content,
        focus_areas: critiqueSettings.focusAreas,
        depth: critiqueSettings.depth,
        include_suggestions: critiqueSettings.includeSuggestions,
        custom_criteria: critiqueSettings.customCriteria || undefined,
        provider: getCurrentProvider(),
        model: settings.selectedModel,
      };

      const result = await prdApi.critique(prd.id, request);
      setCritiqueResult(result);
    } catch (error) {
      console.error("Error generating critique:", error);
      // You could add error state handling here
    } finally {
      setIsCritiqueLoading(false);
    }
  };

  // Helper function to calculate cost based on token usage and model
  const calculateCost = (
    inputTokens: number,
    outputTokens: number,
    modelId: string
  ): number => {
    if (!modelId) return 0;

    const provider = getCurrentProvider();
    if (!provider || !provider.models) return 0;

    const model = provider.models.find((m) => m.id === modelId);
    if (!model || !model.costPer1MTokens) return 0;

    const inputCost = (inputTokens / 1000000) * model.costPer1MTokens.input;
    const outputCost = (outputTokens / 1000000) * model.costPer1MTokens.output;

    return inputCost + outputCost;
  };

  return (
    <div className="flex flex-col h-full">
      {!critiqueResult ? (
        <div className="text-center p-8 space-y-4">
          <div className="py-4 border-b-1">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p>
              Configure your critique settings and click "Generate PRD Critique"
            </p>
            <p className="text-sm mt-1">
              I'll analyze your PRD and provide detailed feedback and
              improvement suggestions.
            </p>
          </div>
          <div className="h-full flex flex-col">
            {/* Critique Settings */}
            <div className="p-4 border-b border-border space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Focus Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "completeness" as const, label: "Completeness" },
                    { value: "clarity" as const, label: "Clarity" },
                    { value: "structure" as const, label: "Structure" },
                    { value: "feasibility" as const, label: "Feasibility" },
                    { value: "requirements" as const, label: "Requirements" },
                    {
                      value: "user_experience" as const,
                      label: "User Experience",
                    },
                    { value: "technical" as const, label: "Technical" },
                    {
                      value: "business_value" as const,
                      label: "Business Value",
                    },
                  ].map((area) => (
                    <label
                      key={area.value}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={critiqueSettings.focusAreas.includes(
                          area.value
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCritiqueSettings((prev) => ({
                              ...prev,
                              focusAreas: [...prev.focusAreas, area.value],
                            }));
                          } else {
                            setCritiqueSettings((prev) => ({
                              ...prev,
                              focusAreas: prev.focusAreas.filter(
                                (fa) => fa !== area.value
                              ),
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span>{area.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Depth</Label>
                  <Select
                    value={critiqueSettings.depth}
                    onValueChange={(
                      value: "surface" | "detailed" | "comprehensive"
                    ) =>
                      setCritiqueSettings((prev) => ({
                        ...prev,
                        depth: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surface">Surface</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="comprehensive">
                        Comprehensive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={critiqueSettings.includeSuggestions}
                      onChange={(e) =>
                        setCritiqueSettings((prev) => ({
                          ...prev,
                          includeSuggestions: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span>Include Suggestions</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Custom Criteria (Optional)
                </Label>
                <Textarea
                  value={critiqueSettings.customCriteria}
                  onChange={(e) =>
                    setCritiqueSettings((prev) => ({
                      ...prev,
                      customCriteria: e.target.value,
                    }))
                  }
                  placeholder="Any specific aspects you'd like me to focus on..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleGenerateCritique}
                disabled={
                  isCritiqueLoading || critiqueSettings.focusAreas.length === 0
                }
                className="w-full"
              >
                {isCritiqueLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating Critique...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate PRD Critique
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {critiqueResult && (
            <div className="space-y-6">
              <div className={`prose prose-sm max-w-none `}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {critiqueResult.summary}
                </ReactMarkdown>
              </div>
              {/* Critique metadata footer */}
              <MetadataFooter
                inputTokens={critiqueResult.input_tokens}
                outputTokens={critiqueResult.output_tokens}
                generationTime={critiqueResult.generation_time}
                cost={
                  critiqueResult.input_tokens &&
                  critiqueResult.output_tokens &&
                  settings.selectedModel
                    ? calculateCost(
                        critiqueResult.input_tokens,
                        critiqueResult.output_tokens,
                        settings.selectedModel
                      )
                    : undefined
                }
                showFeedback={true}
                className="mt-6 pt-4 border-t border-border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
