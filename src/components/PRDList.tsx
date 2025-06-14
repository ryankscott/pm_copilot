import type { PRD } from "../App";
import { Button } from "./ui/button";
import { Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PRDListProps {
  prds: PRD[];
  selectedPrd: PRD | null;
  onSelectPrd: (prd: PRD) => void;
  onDeletePrd: (id: string) => void;
}

export function PRDList({
  prds,
  selectedPrd,
  onSelectPrd,
  onDeletePrd,
}: PRDListProps) {
  if (prds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No PRDs yet</p>
          <p className="text-sm">Create your first PRD to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {prds.map((prd) => (
        <div
          key={prd.id}
          className={`p-4 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent group ${
            selectedPrd?.id === prd.id
              ? "bg-sidebar-primary/10 border-sidebar-primary/20"
              : ""
          }`}
          onClick={() => onSelectPrd(prd)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sidebar-foreground truncate">
                {prd.title}
              </h3>
              <p className="text-sm text-sidebar-foreground/70 mt-1">
                Updated{" "}
                {formatDistanceToNow(prd.updatedAt, { addSuffix: true })}
              </p>
              {prd.content && (
                <p className="text-xs text-sidebar-foreground/50 mt-1 line-clamp-2">
                  {prd.content.slice(0, 100)}...
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 shrink-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePrd(prd.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
