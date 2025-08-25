import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChatPage } from "../../components/ChatPage";

const chatSearchSchema = z.object({
  mode: z.enum(["create", "critique", "question"]).optional(),
});

export const Route = createFileRoute("/chat/")({
  validateSearch: chatSearchSchema,
  component: Index,
});

function Index() {
  const { mode } = Route.useSearch();
  return <ChatPage initialMode={mode} />;
}
