import { useMatch } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { PRD } from "../types";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { samplePRDs } from "@/lib/sampleData";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function PRDList() {
  const [prds, setPrds] = useState<PRD[]>([]);
  // Get the current prdId from the route (if on a PRD page)
  const match = useMatch({ from: "/prd/$prdId" });
  const currentPrdId = match?.params?.prdId;

  // Load sample PRDs on first visit
  useEffect(() => {
    if (prds.length === 0) {
      setPrds(samplePRDs);
    }
  }, [prds.length]);

  return (
    <div className="flex flex-col space-y-2 p-4">
      <Button
        disabled={true} // TODO: Implement PRD creation
        variant="outline"
        className="mb-4"
      >
        New PRD
      </Button>
      {prds.map((prd) => (
        <Link to={"/prd/$prdId"} key={prd.id} params={{ prdId: prd.id }}>
          <Card
            key={prd.id}
            className={`min-w-0 flex-1 ${prd.id === currentPrdId ? "bg-primary-100" : "bg-background"}`}
          >
            <CardHeader>{prd.title}</CardHeader>
            <CardContent>
              {/* Metadata */}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(prd.updatedAt))} ago
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
