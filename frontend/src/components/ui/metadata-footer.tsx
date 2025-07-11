import { useState } from "react";
import {
  TimerIcon,
  Puzzle,
  CircleDollarSign,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react";
import AIAvatar from "./AIAvatar";
import { FeedbackModal, type FeedbackData } from "./feedback-modal";
import { feedbackApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "./button";

interface MetadataFooterProps {
  inputTokens?: number;
  outputTokens?: number;
  generationTime?: number;
  cost?: number;
  showFeedback?: boolean;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  className?: string;
  provider?: string; // Optional provider name
  model?: string; // Optional model name
  // New props for enhanced feedback
  langfuseData?: {
    traceId: string;
    generationId: string;
  };
}

export function MetadataFooter({
  inputTokens,
  outputTokens,
  generationTime,
  cost,
  showFeedback = true,
  onThumbsUp,
  onThumbsDown,
  className = "",
  provider = "", // Default to empty string if not provided
  model = "", // Default to empty string if not provided
  langfuseData,
}: MetadataFooterProps) {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const formatTime = (seconds: number) => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(2)}k`;
    }
    return `$${cost.toFixed(4)}`;
  };

  const handleFeedbackClick = (score: number) => {
    if (langfuseData) {
      // Convert thumbs up/down to star rating
      // Thumbs up = 5 stars, thumbs down = 1 star
      setFeedbackModalOpen(true);
    } else {
      // Fallback to simple callback
      if (score === 1) {
        onThumbsUp?.();
      } else {
        onThumbsDown?.();
      }
    }
  };

  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    try {
      await feedbackApi.submit({
        traceId: feedback.traceId,
        generationId: feedback.generationId,
        rating: feedback.rating,
        comment: feedback.comment,
      });

      // Show success toast
      toast.success("Thank you for your feedback!", {
        description: "Your feedback helps us improve the AI responses.",
      });

      // Call legacy callbacks if provided
      if (feedback.rating === 1) {
        onThumbsUp?.();
      } else {
        onThumbsDown?.();
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback", {
        description: "Please try again later.",
      });
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  return (
    <>
      <div className={`mt-3 pt-3 border-t border-border ${className}`}>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground justify-center">
          {/* AI model icon */}
          <AIAvatar provider={provider} model={model} />

          {/* Token usage */}
          {(inputTokens || outputTokens) && (
            <div className="flex items-center gap-1">
              <Puzzle className="w-4 h-4" />
              {inputTokens || 0} in + {outputTokens || 0} out
            </div>
          )}

          {/* Generation time */}
          {generationTime && (
            <div className="flex items-center gap-1">
              <TimerIcon className="w-4 h-4" />
              {formatTime(generationTime)}
            </div>
          )}

          {/* Cost */}
          {cost !== undefined && cost > 0 && (
            <div className="flex items-center gap-1">
              <CircleDollarSign className="w-4 h-4" />
              {formatCost(cost)}
            </div>
          )}

          {/* Enhanced Feedback buttons */}
          {showFeedback && (
            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant={"ghost"}
                onClick={() => handleFeedbackClick(1)}
                aria-label="Thumbs up"
                className="p-1 m-0"
                title={langfuseData ? "Provide detailed feedback" : "Thumbs up"}
              >
                <ThumbsUpIcon className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => handleFeedbackClick(-1)}
                variant={"ghost"}
                aria-label="Thumbs down"
                className="p-1 m-0"
                title={
                  langfuseData ? "Provide detailed feedback" : "Thumbs down"
                }
              >
                <ThumbsDownIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Feedback Modal */}
      {langfuseData && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          feedbackData={{
            traceId: langfuseData.traceId,
            generationId: langfuseData.generationId,
          }}
          title="How was this response?"
          description="Your feedback helps us improve the AI responses and provide better results."
        />
      )}
    </>
  );
}
