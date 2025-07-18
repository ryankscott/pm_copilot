import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "../../components/ChatPage";

export const Route = createFileRoute("/chat/")({
  component: Index,
});

function Index() {
  return <ChatPage />;
}
