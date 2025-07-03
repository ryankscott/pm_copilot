import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Bot, Wand2, MessageSquare, Loader2, Send, Plus } from "lucide-react";
import type { PRD, GenerateContentRequest, ConversationMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { prdApi, sessionApi } from "@/lib/api";
import { Textarea } from "./ui/textarea";

interface AIAssistantPanelProps {
  prd: PRD;
  onApplyContent: (content: string) => void;
}

export function AIAssistantPanel({
  prd,
  onApplyContent,
}: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"interactive" | "critique">(
    "interactive"
  );

  // Interactive PRD Creation state
  const [interactiveMessages, setInteractiveMessages] = useState<
    ConversationMessage[]
  >([]);
  const [interactiveInput, setInteractiveInput] = useState("");
  const [isInteractiveLoading, setIsInteractiveLoading] = useState(false);
  const [interactiveSettings, setInteractiveSettings] = useState<{
    tone: "professional" | "casual" | "technical" | "executive";
    length: "brief" | "standard" | "detailed" | "comprehensive";
  }>({
    tone: "professional",
    length: "standard",
  });

  // Chat functionality for critique mode
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Reset interactive session when PRD changes
  useEffect(() => {
    setInteractiveMessages([]);

    // Load existing session for this PRD
    const loadSession = async () => {
      try {
        const session = await sessionApi.get(prd.id);
        if (session && session.conversation_history.length > 0) {
          setInteractiveMessages(session.conversation_history);
          if (session.settings) {
            setInteractiveSettings(
              session.settings as typeof interactiveSettings
            );
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    };

    loadSession();
  }, [prd.id]);

  // Save session whenever messages change
  useEffect(() => {
    if (interactiveMessages.length > 0) {
      const saveSession = async () => {
        try {
          await sessionApi.save(prd.id, {
            conversation_history: interactiveMessages,
            settings: interactiveSettings,
          });
        } catch (error) {
          console.error("Failed to save session:", error);
        }
      };

      // Debounce session saving
      const timeout = setTimeout(saveSession, 1000);
      return () => clearTimeout(timeout);
    }
  }, [interactiveMessages, interactiveSettings, prd.id]);

  const handleStartInteractiveSession = async () => {
    if (!interactiveInput.trim()) return;

    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`=== Starting initial request ${requestId} ===`);

    const userMessage: ConversationMessage = {
      role: "user",
      content: interactiveInput,
      timestamp: new Date().toISOString(),
    };

    setInteractiveMessages([userMessage]);
    setInteractiveInput("");
    setIsInteractiveLoading(true);

    try {
      const request: GenerateContentRequest = {
        prompt: userMessage.content,
        tone: interactiveSettings.tone,
        length: interactiveSettings.length,
        existing_content: prd.content,
        conversation_history: [],
      };

      const result = await prdApi.generateContent(prd.id, request);

      console.log(`=== AI Response Received (Start) for ${requestId} ===`);
      console.log("Result:", result);
      console.log("Generated content:", result.generated_content);
      console.log("Content length:", result.generated_content?.length || 0);

      if (!result.generated_content || result.generated_content.trim() === "") {
        console.error(
          `Empty response received from AI (start session) for request ${requestId}`
        );
        throw new Error("Empty response received from AI");
      }

      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: result.generated_content,
        timestamp: new Date().toISOString(),
      };

      setInteractiveMessages([userMessage, assistantMessage]);
      console.log(
        `=== Successfully completed initial request ${requestId} ===`
      );
    } catch (error) {
      console.error(
        `Error starting interactive session for request ${requestId}:`,
        error
      );
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error starting our PRD creation session. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setInteractiveMessages([userMessage, errorMessage]);
    } finally {
      setIsInteractiveLoading(false);
    }
  };

  const handleContinueInteractiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactiveInput.trim() || isInteractiveLoading) return;

    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`=== Starting request ${requestId} ===`);

    const userMessage: ConversationMessage = {
      role: "user",
      content: interactiveInput,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...interactiveMessages, userMessage];
    setInteractiveMessages(updatedMessages);
    setInteractiveInput("");
    setIsInteractiveLoading(true);

    try {
      const request: GenerateContentRequest = {
        prompt: userMessage.content,
        tone: interactiveSettings.tone,
        length: interactiveSettings.length,
        existing_content: prd.content,
        conversation_history: interactiveMessages, // This should be the old messages, not including the current user message
      };

      const result = await prdApi.generateContent(prd.id, request);

      console.log(`=== AI Response Received for ${requestId} ===`);
      console.log("Result:", result);
      console.log("Generated content:", result.generated_content);
      console.log("Content length:", result.generated_content?.length || 0);

      if (!result.generated_content || result.generated_content.trim() === "") {
        console.error(
          `Empty response received from AI for request ${requestId}`
        );
        throw new Error("Empty response received from AI");
      }

      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: result.generated_content,
        timestamp: new Date().toISOString(),
      };

      setInteractiveMessages([...updatedMessages, assistantMessage]);
      console.log(`=== Successfully completed request ${requestId} ===`);
    } catch (error) {
      console.error(
        `Error in interactive session for request ${requestId}:`,
        error
      );
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setInteractiveMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsInteractiveLoading(false);
    }
  };

  const handleApplyInteractiveContent = (content: string) => {
    onApplyContent(content);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ConversationMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const result = await prdApi.generateContent(prd.id, {
        prompt: `As a product management expert, please answer this question about the PRD titled "${prd.title}": ${chatInput}`,
        context: `PRD Content: ${prd.content}`,
        tone: "professional",
        length: "standard",
      });

      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: result.generated_content,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderMessage = (
    message: ConversationMessage,
    showApplyButton = false
  ) => (
    <div
      key={message.timestamp}
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted border"
        }`}
      >
        <div
          className={`prose prose-sm max-w-none ${
            message.role === "user"
              ? "prose-invert [&>*]:text-primary-foreground"
              : "dark:prose-invert"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {showApplyButton &&
          message.role === "assistant" &&
          !isInteractiveLoading &&
          message === interactiveMessages[interactiveMessages.length - 1] && (
            <div className="mt-3 pt-3 border-t border-border flex gap-2">
              <Button
                size="sm"
                onClick={() => handleApplyInteractiveContent(message.content)}
              >
                Apply to PRD
              </Button>
            </div>
          )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "interactive" | "critique")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="interactive"
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Interactive PRD
            </TabsTrigger>
            <TabsTrigger value="critique" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat & Critique
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="interactive" className="h-full mt-0">
            <div className="h-full flex flex-col">
              {/* Settings and New Chat Button */}
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-row gap-6">
                    {interactiveMessages.length === 0 ? (
                      <>
                        <div className="">
                          <Label className="text-sm font-medium">Tone</Label>
                          <Select
                            value={interactiveSettings.tone}
                            onValueChange={(
                              value:
                                | "professional"
                                | "casual"
                                | "technical"
                                | "executive"
                            ) =>
                              setInteractiveSettings((prev) => ({
                                ...prev,
                                tone: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">
                                Professional
                              </SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="technical">
                                Technical
                              </SelectItem>
                              <SelectItem value="executive">
                                Executive
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="">
                          <Label className="text-sm font-medium">
                            Detail Level
                          </Label>
                          <Select
                            value={interactiveSettings.length}
                            onValueChange={(
                              value:
                                | "brief"
                                | "standard"
                                | "detailed"
                                | "comprehensive"
                            ) =>
                              setInteractiveSettings((prev) => ({
                                ...prev,
                                length: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brief">Brief</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="detailed">Detailed</SelectItem>
                              <SelectItem value="comprehensive">
                                Comprehensive
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {interactiveMessages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInteractiveMessages([]);
                        setInteractiveInput("");
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Conversation */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {interactiveMessages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-muted-foreground max-w-md">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-lg font-medium mb-2 text-foreground">
                        Interactive PRD Creation
                      </h3>
                      <p className="mb-4">
                        I'll guide you through creating a comprehensive PRD step
                        by step. Tell me what you want to build and I'll help
                        you structure it properly.
                      </p>
                    </div>
                  </div>
                ) : (
                  interactiveMessages.map((message) =>
                    renderMessage(message, true)
                  )
                )}
                {isInteractiveLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 border">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={
                    interactiveMessages.length === 0
                      ? (e) => {
                          e.preventDefault();
                          handleStartInteractiveSession();
                        }
                      : handleContinueInteractiveSession
                  }
                  className="flex gap-2"
                >
                  <Textarea
                    value={interactiveInput}
                    onChange={(e) => setInteractiveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        e.shiftKey &&
                        !isInteractiveLoading &&
                        interactiveInput.trim()
                      ) {
                        e.preventDefault();
                        if (interactiveMessages.length === 0) {
                          handleStartInteractiveSession();
                        } else {
                          handleContinueInteractiveSession(e);
                        }
                      }
                    }}
                    placeholder={
                      interactiveMessages.length === 0
                        ? "Describe the product or feature you want to create a PRD for... (Shift+Enter to send)"
                        : "Continue the conversation... (Shift+Enter to send)"
                    }
                    disabled={isInteractiveLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isInteractiveLoading || !interactiveInput.trim()}
                  >
                    {isInteractiveLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="critique" className="h-full mt-0">
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatMessages.map((message) => renderMessage(message))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
                {chatMessages.length === 0 && (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                      <p>
                        Ask me questions about your PRD or request feedback!
                      </p>
                      <p className="text-sm mt-1">
                        I can help you improve structure, add missing sections,
                        and more.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask questions about your PRD or request feedback..."
                    disabled={isChatLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                  >
                    {isChatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
