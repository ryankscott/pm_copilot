import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { PRD } from "../types";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { samplePRDs } from "@/lib/sampleData";

interface PRDListProps {
  onSelectPrd?: (prd: PRD) => void;
  onDeletePrd?: (id: string) => void;
  onCreatePrd?: () => void;
}

export function PRDList({
  onSelectPrd,
  onDeletePrd,
  onCreatePrd,
}: PRDListProps) {
  console.log(onSelectPrd, onDeletePrd, onCreatePrd); // Temporary to avoid unused variable error
  const [prds, setPrds] = useState<PRD[]>([]);
  // Load sample PRDs on first visit
  useEffect(() => {
    if (prds.length === 0) {
      setPrds(samplePRDs);
    }
  }, [prds.length]);

  return (
    <div className="flex flex-col space-y-2 p-4">
      {prds.map((prd) => (
        <Card className="min-w-0 flex-1">
          <CardHeader>{prd.title}</CardHeader>
          <CardContent>
            {/* Content Preview */}
            {prd.content && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {prd.content.slice(0, 150)}
                {prd.content.length > 150 ? "..." : ""}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <p className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(prd.updatedAt))} ago
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
