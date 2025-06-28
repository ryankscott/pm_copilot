import type { OKR } from "../types";
import EnhancedList from "./EnhancedList";
import { Target, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OKRListProps {
  okrs: OKR[];
  selectedOkr: OKR | null;
  onSelectOkr: (okr: OKR) => void;
  onDeleteOkr: (id: string) => void;
  onCreateOkr: () => void;
}

export function OKRList({
  okrs,
  selectedOkr,
  onSelectOkr,
  onDeleteOkr,
  onCreateOkr,
}: OKRListProps) {
  const renderOkr = (okr: OKR) => {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {okr.title || "Untitled OKR"}
            </h3>

            {/* Objective */}
            {okr.objective && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {okr.objective.slice(0, 150)}
                {okr.objective.length > 150 ? "..." : ""}
              </p>
            )}

            {/* Key Results Summary */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>
                  {okr.keyResults.length} key result
                  {okr.keyResults.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated {formatDistanceToNow(new Date(okr.updatedAt))} ago
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
      entityType="okr"
      entities={okrs}
      selectedEntity={selectedOkr}
      onSelectEntity={onSelectOkr}
      onCreateNew={onCreateOkr}
      onDelete={onDeleteOkr}
      renderEntity={renderOkr}
      getEntityId={(okr: OKR) => okr.id}
      getEntityTitle={(okr: OKR) => okr.title || "Untitled OKR"}
    />
  );
}
