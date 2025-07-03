import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Bot, Wand2, MessageSquare, Loader2 } from "lucide-react";
import type { PRD, GenerateContentRequest } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { prdApi } from "@/lib/api";

interface AIAssistantPanelProps {
  prd: PRD;
  onApplyContent: (content: string) => void;
}

export function AIAssistantPanel({
  prd,
  onApplyContent,
}: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"create" | "critique">("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");

  // Form state for PRD generation
  const [formData, setFormData] = useState<GenerateContentRequest>({
    prompt: "",
    context: "",
    tone: "professional",
    length: "standard",
    existing_content: prd.content,
  });

  // Chat functionality for critique mode - temporarily using a simple approach
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleGenerateContent = async () => {
    if (!formData.prompt.trim()) return;

    setIsGenerating(true);
    try {
      const result = await prdApi.generateContent(prd.id, formData);
      setGeneratedContent(result.generated_content);
    } catch (error) {
      console.error("Error generating content:", error);
      // You could add toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGenerated = () => {
    if (generatedContent) {
      onApplyContent(generatedContent);
      setGeneratedContent("");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: chatInput,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // For now, we'll use the same generate endpoint for chat
      const result = await prdApi.generateContent(prd.id, {
        prompt: `As a product management expert, please answer this question about the PRD titled "${prd.title}": ${chatInput}`,
        context: `PRD Content: ${prd.content}`,
        tone: "professional",
        length: "standard",
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: result.generated_content,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Sorry, I encountered an error. Please try again.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

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
            setActiveTab(value as "create" | "critique")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="critique" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Critique
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="create" className="h-full mt-0">
            <div className="h-full flex flex-col">
              {/* Generation Form */}
              <div className="p-4 space-y-4 border-b border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt *</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) =>
                      setFormData({ ...formData, prompt: e.target.value })
                    }
                    placeholder="Describe what you want to generate (e.g., 'Create user stories for a mobile login feature')"
                    className="w-full h-20 px-3 py-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Context (Optional)
                  </label>
                  <Input
                    value={formData.context}
                    onChange={(e) =>
                      setFormData({ ...formData, context: e.target.value })
                    }
                    placeholder="Additional context about your product or feature"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <select
                      value={formData.tone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tone: e.target.value as
                            | "professional"
                            | "casual"
                            | "technical"
                            | "executive",
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="technical">Technical</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length</label>
                    <select
                      value={formData.length}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          length: e.target.value as
                            | "brief"
                            | "standard"
                            | "detailed"
                            | "comprehensive",
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="brief">Brief</option>
                      <option value="standard">Standard</option>
                      <option value="detailed">Detailed</option>
                      <option value="comprehensive">Comprehensive</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={!formData.prompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Content */}
              {generatedContent && (
                <div className="flex-1 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Generated Content</h3>
                    <Button onClick={handleApplyGenerated} size="sm">
                      Apply to PRD
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {generatedContent}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="critique" className="h-full mt-0">
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                {chatMessages.length === 0 && (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Bot className="w-8 h-8 mx-auto mb-2" />
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
                  <Input
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
                      <MessageSquare className="w-4 h-4" />
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
