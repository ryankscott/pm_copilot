import { PRDEditor } from "@/components/PRDEditor";
import { usePrd, useUpdatePrd } from "@/hooks/use-prd-queries";
import type { PRD } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/prd/$prdId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { prdId } = Route.useParams();
  const { data: prd, isLoading, error } = usePrd(prdId);
  const updatePrd = useUpdatePrd();

  const handleUpdatePrd = async (updatedPrd: PRD) => {
    if (!prd) return;

    try {
      await updatePrd.mutateAsync({
        id: prd.id,
        data: {
          title: updatedPrd.title,
          content: updatedPrd.content,
        },
      });
    } catch (error) {
      console.error("Failed to update PRD:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading PRD: {error.message}</p>
      </div>
    );
  }

  if (!prd) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">PRD not found</p>
      </div>
    );
  }

  return <PRDEditor prd={prd} onUpdatePrd={handleUpdatePrd} />;
}
