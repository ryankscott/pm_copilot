import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prd/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>PRD</h3>
    </div>
  );
}
