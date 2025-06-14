import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { AIProvider } from "./Settings";
import { Button } from "./ui/button";
import { X, Send, Sparkles, MessageSquare, CheckCircle } from "lucide-react";
import { getStoredAPIKey } from "../lib/apiKeys";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface AIAssistantProps {
  currentContent: string;
  onImprovement: (content: string) => void;
  onClose: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  aiProvider: AIProvider;
}

type AssistantMode = "improve" | "critique" | "chat";

export function AIAssistant({
  currentContent,
  onImprovement,
  onClose,
  isLoading,
  setIsLoading,
  aiProvider,
}: AIAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>("improve");
  const [response, setResponse] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleAIRequest = async () => {
    if (!currentContent.trim() && mode !== "chat") {
      alert("Please add some content to your PRD first");
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const messages = [
        ...(mode === "chat" ? chatHistory : []),
        {
          role: "user" as const,
          content: mode === "chat" ? customPrompt : getPromptForMode(mode),
        },
      ];

      const apiKey = getStoredAPIKey(aiProvider);

      // Check if API key is available for non-ollama providers
      if (aiProvider !== "ollama" && !apiKey) {
        alert(
          `Please configure your ${aiProvider.toUpperCase()} API key in Settings first.`
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          mode,
          currentContent,
          provider: aiProvider,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let aiResponse = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith('0:"')) {
            const content = line.slice(3, -1);
            aiResponse += content;
            setResponse(aiResponse);
          }
        }
      }

      if (mode === "chat") {
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: customPrompt },
          { role: "assistant", content: aiResponse },
        ]);
        setCustomPrompt("");
      }
    } catch (error) {
      console.error("AI request failed:", error);
      // Fallback to mock responses if API fails
      handleMockResponse();
    } finally {
      setIsLoading(false);
    }
  };

  const getPromptForMode = (mode: AssistantMode): string => {
    switch (mode) {
      case "improve":
        return "Please improve this PRD by making it more comprehensive, clear, and professional.";
      case "critique":
        return "Please provide a detailed critique of this PRD, highlighting strengths and areas for improvement.";
      case "chat":
        return customPrompt;
      default:
        return "Please help me with this PRD.";
    }
  };

  const handleMockResponse = () => {
    // Fallback mock implementation
    setTimeout(() => {
      let mockResponse = "";

      switch (mode) {
        case "improve":
          mockResponse = `# Improved Product Requirements Document

## Executive Summary
This PRD outlines the development of [Product Name], addressing key user needs and business objectives.

## Problem Statement
${
  currentContent.includes("Problem")
    ? "Enhanced problem definition based on your existing content..."
    : "Define the core problem this product solves for users and the business."
}

## Target Audience
### Primary Users
- User Segment 1: [Define characteristics and needs]
- User Segment 2: [Define characteristics and needs]

## Goals and Objectives
### Business Objectives
- Increase user engagement by X%
- Drive revenue growth within timeframe
- Reduce operational costs

### User Objectives
- Improve task completion efficiency
- Enhance user satisfaction
- Reduce friction in workflows

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Functional Requirements
### Core Features
1. **Feature 1**: Description and acceptance criteria
2. **Feature 2**: Description and acceptance criteria

## Non-functional Requirements
- Performance: Response time < 2 seconds
- Security: Data encryption and authentication
- Scalability: Support for concurrent users

## Success Metrics
- User adoption rate: Target X% within Y months
- Task completion rate improvement
- User satisfaction score

## Timeline
- Phase 1: Foundation (Weeks 1-4)
- Phase 2: Core features (Weeks 5-8)
- Phase 3: Launch (Weeks 9-12)

---
Original Content:
${currentContent}`;
          break;

        case "critique":
          mockResponse = `## PRD Critique

### Strengths ✅
- Clear structure and organization
- Good use of sections and formatting

### Areas for Improvement 📋
1. **Success Metrics**: Add measurable KPIs and success criteria
2. **User Stories**: Include detailed user stories with acceptance criteria
3. **Technical Requirements**: Define performance, security, and scalability needs
4. **Risk Assessment**: Identify potential risks and mitigation strategies
5. **Dependencies**: List technical and business dependencies

### Missing Elements ⚠️
- Target audience definition
- Competitive analysis
- Resource requirements
- Detailed timeline with milestones

### Recommendations 💡
1. Start with a clear problem statement
2. Define specific user personas
3. Add quantifiable success metrics
4. Include technical architecture considerations
5. Create detailed acceptance criteria for each feature

### Overall Assessment
Good foundation but needs enhancement in key areas to meet professional PRD standards.`;
          break;

        case "chat":
          mockResponse = `Great question! Here are some suggestions for your PRD:

**For your current document:**
- Consider adding specific user personas and their pain points
- Define measurable success metrics (e.g., "increase user engagement by 25%")
- Include technical constraints and dependencies
- Add risk assessment with mitigation strategies

**Best Practices:**
- Start with the problem you're solving, not the solution
- Use the MoSCoW method for prioritization
- Include both happy path and edge case scenarios
- Define what success looks like quantitatively

Would you like me to help you elaborate on any of these areas?`;

          setChatHistory((prev) => [
            ...prev,
            { role: "user", content: customPrompt },
            { role: "assistant", content: mockResponse },
          ]);
          setCustomPrompt("");
          break;
      }

      setResponse(mockResponse);
      setIsLoading(false);
    }, 2000);
  };

  const applyImprovement = () => {
    if (mode === "improve" && response) {
      onImprovement(response);
      setResponse("");
    }
  };

  return (
    <div className="w-96 border-l border-gray-100 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection */}
        <Tabs
          defaultValue={mode}
          onValueChange={(value) => setMode(value as AssistantMode)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="improve">
              <Sparkles className="w-3 h-3 mr-2" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="critique">
              <CheckCircle className="w-3 h-3 mr-2" />
              Critique
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-3 h-3 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>
          {/* Content */}
          <TabsContent
            value="improve"
            className="flex-1 flex flex-col space-y-4"
          >
            <Button
              onClick={handleAIRequest}
              disabled={isLoading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Improve PRD
            </Button>

            {/* Response */}
            {(response || isLoading) && (
              <div className="flex-1 border border-gray-200 rounded-lg p-3 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Processing...
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      AI Response:
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {response}
                      </ReactMarkdown>
                    </div>
                    {response && (
                      <Button
                        onClick={applyImprovement}
                        size="sm"
                        className="mt-3"
                      >
                        Apply Changes
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="critique"
            className="flex-1 flex flex-col space-y-4"
          >
            <Button
              onClick={handleAIRequest}
              disabled={isLoading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Get Critique
            </Button>

            {/* Response */}
            {(response || isLoading) && (
              <div className="flex-1 border border-gray-200 rounded-lg p-3 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Processing...
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      AI Response:
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {response}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col space-y-4">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-100 text-blue-900 ml-4"
                        : "bg-gray-100 text-gray-900 mr-4"
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="text-sm prose prose-sm max-w-none">
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask me anything about your PRD..."
                className="w-full h-20 p-2 border border-gray-300 rounded resize-none text-sm"
              />
              <Button
                onClick={handleAIRequest}
                disabled={isLoading || !customPrompt.trim()}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
