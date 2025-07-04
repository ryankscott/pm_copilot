import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Calendar, Plus, Loader2, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { usePrds, useCreatePrd, useDeletePrd } from "@/hooks/use-prd-queries";
import { useToast } from "@/hooks/use-toast";

export function PRDList() {
  const { data: prds, isLoading, refetch } = usePrds();

  const { success, error: errorToast } = useToast();
  const createPrd = useCreatePrd();
  const deletePrd = useDeletePrd();
  const router = useRouter();
  const matchRoute = useMatchRoute();
  // Get the current prdId from the route (if on a PRD page)
  const match = matchRoute({ from: "/prd/$prdId" });
  const currentPrdId = match ? match.prdId : undefined;

  const handleDeletePrd = async (prdId: string) => {
    try {
      await deletePrd.mutateAsync(prdId);
      refetch();
      router.navigate({ to: "/" });
      success("PRD Deleted", "Successfully deleted PRD");
    } catch (error) {
      console.error("Failed to delete PRD:", error);
      errorToast("Failed to delete PRD", "Please try again later.");
    }
  };

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

      success("PRD Created", "Successfully created PRD");
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
              className={`my-1 min-w-0 flex-1 ${
                prd.id === currentPrdId ? "bg-primary-100" : "bg-background"
              }`}
            >
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  {prd.title}
                  <div
                    className="rounded-xl hover:bg-gray-300 p-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeletePrd(prd.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
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
