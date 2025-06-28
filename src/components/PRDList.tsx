import type { PRD } from "../types";
import EnhancedList from "./EnhancedList";
import { FileText, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PRDListProps {
  prds: PRD[];
  selectedPrd: PRD | null;
  onSelectPrd: (prd: PRD) => void;
  onDeletePrd: (id: string) => void;
  onCreatePrd: () => void;
}

export function PRDList({
  prds,
  selectedPrd,
  onSelectPrd,
  onDeletePrd,
  onCreatePrd,
}: PRDListProps) {
  const renderPrd = (prd: PRD) => {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {prd.title}
            </h3>

            {/* Content Preview */}
            {prd.content && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {prd.content.slice(0, 150)}
                {prd.content.length > 150 ? "..." : ""}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>PRD</span>
              </div>
              {prd.opportunityId && (
                <div className="flex items-center gap-1">
                  <span>Linked to Opportunity</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated {formatDistanceToNow(new Date(prd.updatedAt))} ago
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
      entityType="prd"
      entities={prds}
      selectedEntity={selectedPrd}
      onSelectEntity={onSelectPrd}
      onCreateNew={onCreatePrd}
      onDelete={onDeletePrd}
      renderEntity={renderPrd}
      getEntityId={(prd: PRD) => prd.id}
      getEntityTitle={(prd: PRD) => prd.title}
    />
  );
}
