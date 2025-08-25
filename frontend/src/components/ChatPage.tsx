import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Bot,
  X,
  FileText,
  MessageSquare,
  Wand2,
  Paperclip,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePrds } from "@/hooks/use-prd-queries";
import { useTemplates } from "@/hooks/use-template-queries";
import { useLLMStore } from "@/store/llm-store";
// runtime handles metadata and API calls now

// Assistant UI imports
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { usePrdRuntime, type PRDContext, type ChatMode } from "@/app/runtime";

import type { PRD, Template } from "@/types";

// ChatMode and PRDContext are now imported from runtime

interface ChatPageProps {
  initialMode?: ChatMode;
}

export function ChatPage({ initialMode }: ChatPageProps) {
  const { data: prds } = usePrds();
  const { data: templates } = useTemplates();
  useLLMStore(); // ensure provider settings are initialized elsewhere if needed

  // Chat state
  const [chatMode, setChatMode] = useState<ChatMode>(initialMode || "create");
  const [prdContexts, setPrdContexts] = useState<PRDContext[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Handle mode change
  const handleModeChange = (value: ChatMode) => {
    setChatMode(value);
    // Clear template selection when switching away from create mode
    if (value !== "create") {
      setSelectedTemplateId("");
    }
  };

  // Add PRD to context
  const addPrdContext = (prdId: string) => {
    const prd = prds?.find((p: PRD) => p.id === prdId);
    if (prd && !prdContexts.find((ctx: PRDContext) => ctx.prd.id === prdId)) {
      setPrdContexts((prev) => [...prev, { prd, addedAt: new Date() }]);
    }
  };

  // Remove PRD from context
  const removePrdContext = (prdId: string) => {
    setPrdContexts((prev) =>
      prev.filter((ctx: PRDContext) => ctx.prd.id !== prdId)
    );
  };

  // Create runtime with shared hook
  const runtime = usePrdRuntime({ chatMode, prdContexts, selectedTemplateId });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Controls */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">AI Assistant</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runtime.switchToNewThread()}
            >
              New Chat
            </Button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="px-4 pb-4">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-4">
              <Select value={chatMode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Create PRD
                    </div>
                  </SelectItem>
                  <SelectItem value="critique">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Critique PRD
                    </div>
                  </SelectItem>
                  <SelectItem value="question">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ask Questions
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Template Selection - Only show in create mode */}
              {chatMode === "create" && (
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: Template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{template.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* PRD Context Selector for critique/question modes */}
              {chatMode !== "create" && (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      onClick={(e) => e.preventDefault()}
                      variant="outline"
                      size="sm"
                      disabled={prdContexts.length > 0}
                    >
                      Add PRD
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {prds && prds.length > 0 ? (
                      prds.map((prd: PRD) => (
                        <DropdownMenuItem
                          key={prd.id}
                          onClick={() => addPrdContext(prd.id)}
                          disabled={prdContexts.some(
                            (ctx: PRDContext) => ctx.prd.id === prd.id
                          )}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          {prd.title}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem
                        disabled
                        className="text-muted-foreground"
                      >
                        No PRDs available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {chatMode === "create" && !selectedTemplateId && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select a template to get started.
                  </AlertDescription>
                </Alert>
              )}
              {(chatMode === "critique" || chatMode === "question") &&
                prdContexts.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Add a PRD to get started.
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          </div>
        </div>

        {/* PRD Context Display */}
        {prdContexts.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Context:</span>
              <div className="flex flex-wrap gap-2">
                {prdContexts.map((ctx: PRDContext) => (
                  <Badge
                    key={ctx.prd.id}
                    className="flex rounded-none items-center gap-1 p-0 m-0 pl-2 font-thin"
                  >
                    <FileText className="w-3 h-3" />
                    {ctx.prd.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrdContext(ctx.prd.id)}
                      className="p-0 m-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assistant UI Thread */}
      <div className="flex-1 overflow-hidden">
        <AssistantRuntimeProvider runtime={runtime}>
          <Thread
            canSend={!(chatMode === "create" && !selectedTemplateId)}
            cannotSendMessage="Select a template to get started."
          />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}
