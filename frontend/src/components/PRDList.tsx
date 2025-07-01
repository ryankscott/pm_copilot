import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { usePrds, useCreatePrd } from "@/hooks/use-prd-queries";

export function PRDList() {
  const { data: prds, isLoading } = usePrds();
  const createPrd = useCreatePrd();
  const router = useRouter();
  const matchRoute = useMatchRoute();
  // Get the current prdId from the route (if on a PRD page)
  const match = matchRoute({ from: "/prd/$prdId" });
  const currentPrdId = match ? match.prdId : undefined;

  const handleCreatePrd = async () => {
    try {
      const newPrd = await createPrd.mutateAsync({
        title: "New PRD",
        content: "# New PRD\n\nStart writing your requirements here...",
      });

      // Navigate to the new PRD
      router.navigate({
        to: "/prd/$prdId",
        params: { prdId: newPrd.id! },
      });
    } catch (error) {
      console.error("Failed to create PRD:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-2 gap-1 p-4">
        <Button disabled variant="outline" className="mb-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          New PRD
        </Button>
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 gap-1 p-4">
      <Button
        onClick={handleCreatePrd}
        disabled={createPrd.isPending}
        variant="outline"
        className="mb-4"
      >
        {createPrd.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        New PRD
      </Button>
      {prds &&
        prds.map((prd) => (
          <Link to={"/prd/$prdId"} key={prd.id} params={{ prdId: prd.id }}>
            <Card
              key={prd.id}
              className={`my-1 min-w-0 flex-1 ${prd.id === currentPrdId ? "bg-primary-100" : "bg-background"}`}
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
