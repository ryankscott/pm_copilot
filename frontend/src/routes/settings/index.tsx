import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Settings!</h3>
    </div>
  );
}
