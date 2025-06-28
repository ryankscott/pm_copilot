import type { Opportunity } from "../types";
import EnhancedList from "./EnhancedList";
import { Calendar, Target, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { calculateOpportunityProgress } from "../lib/opportunityUtils";

interface OpportunityListProps {
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onDeleteOpportunity: (id: string) => void;
  onCreateOpportunity: () => void;
}

export function OpportunityList({
  opportunities,
  selectedOpportunity,
  onSelectOpportunity,
  onDeleteOpportunity,
  onCreateOpportunity,
}: OpportunityListProps) {
  const renderOpportunity = (opportunity: Opportunity) => {
    const progress = calculateOpportunityProgress(opportunity);

    return (
      <div className="min-w-0 flex-1">
        {/* Title and Main Content */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {opportunity.title}
            </h3>

            {/* Description */}
            {opportunity.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {opportunity.description.slice(0, 150)}
                {opportunity.description.length > 150 ? "..." : ""}
              </p>
            )}

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {progress}%
              </span>
            </div>

            {/* Linked Items Summary */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{opportunity.okrIds?.length || 0} OKRs</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>Impact: {opportunity.expectedImpact}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated {formatDistanceToNow(new Date(opportunity.updatedAt))}{" "}
                  ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <EnhancedList
      entityType="opportunity"
      entities={opportunities}
      selectedEntity={selectedOpportunity}
      onSelectEntity={onSelectOpportunity}
      onCreateNew={onCreateOpportunity}
      onDelete={onDeleteOpportunity}
      renderEntity={renderOpportunity}
      getEntityId={(opp: Opportunity) => opp.id}
      getEntityTitle={(opp: Opportunity) => opp.title}
    />
  );
}
