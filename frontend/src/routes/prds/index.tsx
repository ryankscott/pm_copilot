// Example usage in a route component
import { createFileRoute } from "@tanstack/react-router";
import { PRDManager } from "@/components/PRDManager";

export const Route = createFileRoute("/prds/")({
  component: PRDsPage,
});

function PRDsPage() {
  return (
    <div className="container mx-auto p-6 h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Requirements Documents</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage your PRDs with real-time updates
        </p>
      </div>
      <PRDManager />
    </div>
  );
}
