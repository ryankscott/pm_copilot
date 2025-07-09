import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  CalendarIcon,
  MessageSquareIcon,
  BarChart3Icon,
  StarIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedbackEntry {
  id: string;
  traceId: string;
  generationId: string;
  score: number;
  rating?: number;
  comment?: string;
  categories?: string[];
  timestamp: string;
  modelUsed?: string;
  provider?: string;
  responsePreview?: string;
}

interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  averageRating: number;
  topCategories: { category: string; count: number }[];
  recentTrend: "up" | "down" | "stable";
}

interface FeedbackHistoryProps {
  userId?: string;
  limit?: number;
  showStats?: boolean;
}

// Mock data for demonstration - in real implementation, this would come from an API
const mockFeedbackHistory: FeedbackEntry[] = [
  {
    id: "1",
    traceId: "trace_123",
    generationId: "gen_456",
    score: 1,
    rating: 5,
    comment: "Great response! Very comprehensive and well-structured.",
    categories: ["completeness", "clarity", "helpfulness"],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    modelUsed: "gpt-4",
    provider: "OpenAI",
    responsePreview:
      "# PRD for Mobile Water Tracking App\n\n## Overview\nThis document outlines...",
  },
  {
    id: "2",
    traceId: "trace_789",
    generationId: "gen_101",
    score: -1,
    rating: 2,
    comment: "Missing technical details and implementation considerations.",
    categories: ["technical"],
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    modelUsed: "llama3.2",
    provider: "Ollama",
    responsePreview:
      "## Product Requirements\n\nThe app should allow users to...",
  },
  {
    id: "3",
    traceId: "trace_112",
    generationId: "gen_131",
    score: 1,
    rating: 4,
    comment: "Good structure but could use more examples.",
    categories: ["structure", "clarity"],
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    modelUsed: "claude-3-sonnet",
    provider: "Anthropic",
    responsePreview:
      "# Feature Specification\n\n## User Stories\n\nAs a user, I want to...",
  },
];

const mockStats: FeedbackStats = {
  totalFeedback: 15,
  positiveCount: 12,
  negativeCount: 3,
  averageRating: 4.2,
  topCategories: [
    { category: "clarity", count: 8 },
    { category: "completeness", count: 6 },
    { category: "helpfulness", count: 5 },
  ],
  recentTrend: "up",
};

export function FeedbackHistory({
  userId,
  limit = 10,
  showStats = true,
}: FeedbackHistoryProps) {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const loadFeedbackHistory = async () => {
      setLoading(true);
      try {
        // In real implementation, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setFeedbackHistory(mockFeedbackHistory.slice(0, limit));
        if (showStats) {
          setStats(mockStats);
        }
      } catch (error) {
        console.error("Failed to load feedback history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeedbackHistory();
  }, [userId, limit, showStats]);

  const getScoreIcon = (score: number) => {
    return score === 1 ? (
      <ThumbsUpIcon className="w-4 h-4 text-green-600" />
    ) : (
      <ThumbsDownIcon className="w-4 h-4 text-red-600" />
    );
  };

  const getScoreColor = (score: number) => {
    return score === 1
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-3 h-3 ${
              rating >= star ? "text-yellow-500 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="w-5 h-5" />
              Feedback Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalFeedback}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Feedback
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.positiveCount}
                </div>
                <div className="text-sm text-muted-foreground">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.negativeCount}
                </div>
                <div className="text-sm text-muted-foreground">Negative</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Top Categories</h4>
              <div className="flex flex-wrap gap-2">
                {stats.topCategories.map((cat) => (
                  <Badge key={cat.category} variant="secondary">
                    {cat.category} ({cat.count})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareIcon className="w-5 h-5" />
            Recent Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No feedback history yet.</p>
                <p className="text-sm">
                  Start providing feedback to see your history here.
                </p>
              </div>
            ) : (
              feedbackHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getScoreIcon(entry.score)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getScoreColor(entry.score)}>
                            {entry.score === 1 ? "Positive" : "Negative"}
                          </Badge>
                          {entry.rating && (
                            <div className="flex items-center gap-1">
                              {renderStars(entry.rating)}
                              <span className="text-sm text-muted-foreground">
                                ({entry.rating}/5)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDistanceToNow(new Date(entry.timestamp), {
                            addSuffix: true,
                          })}
                          {entry.provider && (
                            <>
                              <span>•</span>
                              <span>{entry.provider}</span>
                            </>
                          )}
                          {entry.modelUsed && (
                            <>
                              <span>•</span>
                              <span>{entry.modelUsed}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedEntry(
                          expandedEntry === entry.id ? null : entry.id
                        )
                      }
                    >
                      {expandedEntry === entry.id ? "Collapse" : "Expand"}
                    </Button>
                  </div>

                  {/* Categories */}
                  {entry.categories && entry.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.categories.map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                          className="text-xs"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  {entry.comment && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      {entry.comment}
                    </div>
                  )}

                  {/* Expanded Content */}
                  {expandedEntry === entry.id && entry.responsePreview && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium mb-2">
                        Response Preview
                      </h5>
                      <div className="bg-muted p-3 rounded text-sm font-mono text-muted-foreground max-h-32 overflow-y-auto">
                        {entry.responsePreview}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
