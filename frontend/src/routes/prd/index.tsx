import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/prd/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>PRD List</h3>
      <p>
        Welcome to the PRD section. Here you can manage your Product
        Requirements Documents.
      </p>
    </div>
  );
}
