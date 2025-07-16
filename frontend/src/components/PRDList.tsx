import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { Card, CardHeader } from "./ui/card";
import { Plus, Loader2, Trash2 } from "lucide-react";
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
        content:
          "<h1>New PRD</h1><p>Start writing your requirements here...</p>",
      });

      // Navigate to the new PRD
      router.navigate({
        to: "/prd/$prdId",
        params: { prdId: newPrd.id! },
      });

      success("PRD Created", "Successfully created PRD");
    } catch (error: unknown) {
      console.error("Failed to create PRD:", error);
      errorToast(
        "Failed to create PRD",
        (error as Error)?.message || "Please try again later."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-2 gap-1 px-4">
        <Button disabled variant="outline" className="mb-2 h-8 text-sm">
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
          New PRD
        </Button>
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1 px-4">
      <Button
        onClick={handleCreatePrd}
        disabled={createPrd.isPending}
        variant="outline"
        className="mb-4 h-8 text-sm"
      >
        {createPrd.isPending ? (
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
        ) : (
          <Plus className="w-3 h-3 mr-2" />
        )}
        New PRD
      </Button>
      {prds &&
        prds.map((prd) => (
          <Link to={"/prd/$prdId"} key={prd.id} params={{ prdId: prd.id }}>
            <Card
              key={prd.id}
              className={`py-2 flex-1 my-0.5 hover:shadow-lg transition-colors group ${
                prd.id === currentPrdId
                  ? "bg-background/10 shadow-lg"
                  : "bg-background"
              }`}
            >
              <CardHeader className="px-4 align-middle">
                <div className="flex flex-row items-center justify-between align-middle">
                  <h4 className="text-sm font-medium leading-tight truncate pr-2">
                    {prd.title}
                  </h4>
                  <Trash2
                    className="w-3 h-3 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePrd(prd.id)}
                  />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
