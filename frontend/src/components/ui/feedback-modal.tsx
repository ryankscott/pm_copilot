import React, { useState } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Label } from "./label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  StarIcon,
  MessageSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeedbackData {
  traceId: string;
  generationId: string;
  score: number;
  comment?: string;
  rating?: number;
  categories?: string[];
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  feedbackData: Omit<
    FeedbackData,
    "score" | "comment" | "rating" | "categories"
  >;
  initialScore?: number;
  title?: string;
  description?: string;
}

const FEEDBACK_CATEGORIES = [
  {
    id: "accuracy",
    label: "Accuracy",
    description: "Information is correct and factual",
  },
  {
    id: "completeness",
    label: "Completeness",
    description: "All necessary information is included",
  },
  {
    id: "clarity",
    label: "Clarity",
    description: "Easy to understand and well-structured",
  },
  {
    id: "relevance",
    label: "Relevance",
    description: "Relevant to the request",
  },
  {
    id: "creativity",
    label: "Creativity",
    description: "Original and innovative approach",
  },
  {
    id: "helpfulness",
    label: "Helpfulness",
    description: "Useful and actionable",
  },
];

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  feedbackData,
  initialScore,
  title = "Provide Feedback",
  description = "Help us improve by sharing your thoughts on this response.",
}: FeedbackModalProps) {
  const [score, setScore] = useState<number>(initialScore || 0);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    // Auto-set rating based on score
    if (newScore === 1) {
      setRating(Math.max(rating, 4)); // Thumbs up suggests good rating
    } else if (newScore === -1) {
      setRating(Math.min(rating || 3, 2)); // Thumbs down suggests lower rating
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    // Auto-set score based on rating
    if (newRating >= 4) {
      setScore(1);
    } else if (newRating <= 2) {
      setScore(-1);
    } else {
      setScore(0);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (score === 0) {
      setErrorMessage("Please select thumbs up or thumbs down");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      await onSubmit({
        ...feedbackData,
        score,
        comment: comment.trim() || undefined,
        rating: rating || undefined,
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
      });

      setSubmitStatus("success");

      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit feedback"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setScore(initialScore || 0);
    setRating(0);
    setComment("");
    setSelectedCategories([]);
    setSubmitStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareIcon className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thumbs Up/Down */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Overall Rating</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={score === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handleScoreChange(1)}
                className={cn(
                  "flex items-center gap-2",
                  score === 1 && "bg-green-600 hover:bg-green-700"
                )}
              >
                <ThumbsUpIcon className="w-4 h-4" />
                Helpful
              </Button>
              <Button
                variant={score === -1 ? "default" : "outline"}
                size="sm"
                onClick={() => handleScoreChange(-1)}
                className={cn(
                  "flex items-center gap-2",
                  score === -1 && "bg-red-600 hover:bg-red-700"
                )}
              >
                <ThumbsDownIcon className="w-4 h-4" />
                Not Helpful
              </Button>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Detailed Rating (Optional)
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    "hover:bg-muted",
                    rating >= star ? "text-yellow-500" : "text-muted-foreground"
                  )}
                >
                  <StarIcon className="w-5 h-5 fill-current" />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Feedback Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              What worked well? (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "p-2 text-left rounded-lg border text-sm transition-colors",
                    selectedCategories.includes(category.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                  title={category.description}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="feedback-comment" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="feedback-comment"
              placeholder="Share any specific feedback, suggestions, or issues you encountered..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <XCircleIcon className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {submitStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm">Thank you for your feedback!</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || score === 0}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
