import { PRDEditor } from "@/components/PRDEditor";
import { samplePRDs } from "@/lib/sampleData";
import { createFileRoute } from "@tanstack/react-router";

const fetchPRD = async (prdId: string) => {
  console.log("fetchPRD called with prdId:", prdId);
  return samplePRDs[parseInt(prdId)];
  /*
  const res = await fetch(`/api/posts?page=${pageIndex}`)
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
  */
};
export const Route = createFileRoute("/prd/$prdId")({
  component: RouteComponent,
  loader: ({ params }) => fetchPRD(params.prdId),
});

function RouteComponent() {
  const prd = Route.useLoaderData();
  console.log("RouteComponent prd:", prd);
  console.log("here");
  return (
    <>
      <PRDEditor
        prd={prd}
        onSave={() => console.log("Save clicked")}
        onUpdatePrd={(updatedPrd) => console.log("Updated PRD:", updatedPrd)}
      />
    </>
  );
}
