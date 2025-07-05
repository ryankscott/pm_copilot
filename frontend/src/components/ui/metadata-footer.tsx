import {
  TimerIcon,
  Puzzle,
  CircleDollarSign,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react";

interface MetadataFooterProps {
  inputTokens?: number;
  outputTokens?: number;
  generationTime?: number;
  cost?: number;
  showFeedback?: boolean;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  className?: string;
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
}: MetadataFooterProps) {
  // Helper function to format cost for display
  const formatCost = (cost: number): string => {
    if (cost === 0) return "Free";
    if (cost < 0.001) return "<$0.001";
    return `$${cost.toFixed(4)}`;
  };

  // Helper function to format time for display
  const formatTime = (timeInSeconds: number): string => {
    if (timeInSeconds < 1) return `${Math.round(timeInSeconds * 1000)}ms`;
    return `${timeInSeconds.toFixed(2)}s`;
  };

  // Don't render if no metadata to show
  if (
    !inputTokens &&
    !outputTokens &&
    !generationTime &&
    !cost &&
    !showFeedback
  ) {
    return null;
  }

  return (
    <div className={`mt-3 pt-3 border-t border-border ${className}`}>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
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

        {/* Feedback buttons */}
        {showFeedback && (
          <div className="flex items-center gap-2">
            <button
              onClick={onThumbsUp}
              className="hover:text-green-500 transition-colors cursor-pointer"
              aria-label="Thumbs up"
            >
              <ThumbsUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onThumbsDown}
              className="hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Thumbs down"
            >
              <ThumbsDownIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
