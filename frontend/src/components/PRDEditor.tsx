import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Save, FileText, Eye, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { PRD } from "../types";

interface PRDEditorProps {
  prd: PRD;
  onUpdatePrd: (prd: PRD) => void;
  onSave: () => void;
}

export function PRDEditor({ prd, onUpdatePrd, onSave }: PRDEditorProps) {
  const [title, setTitle] = useState(prd.title);
  const [content, setContent] = useState(prd.content);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");

  // Update local state when a new PRD is selected
  useEffect(() => {
    setTitle(prd.title);
    setContent(prd.content);
  }, [prd.id, prd.title, prd.content]);

  const handleSave = () => {
    const updatedPrd = {
      ...prd,
      title: title.trim() || "Untitled PRD",
      content,
    };
    onUpdatePrd(updatedPrd);
    onSave();
  };

  return (
    <div className="flex-1 flex">
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
                placeholder="Enter PRD title..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "edit" ? "default" : "outline"}
                onClick={() => setViewMode("edit")}
                size="sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                onClick={() => setViewMode("preview")}
                size="sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === "edit" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full resize-none border-0 p-4 focus:ring-0 focus:outline-none bg-background text-foreground"
              placeholder="Start writing your Product Requirements Document...

Here are some sections you might want to include:
• Problem Statement
• Target Audience
• Goals and Objectives
• User Stories
• Functional Requirements
• Non-functional Requirements
• Success Metrics
• Timeline and Milestones
• Dependencies and Assumptions"
            />
          ) : (
            <div className="h-full overflow-auto p-4 prose prose-gray dark:prose-invert max-w-none bg-background text-foreground">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="text-muted-foreground italic">
                  No content to preview. Switch to Edit mode to start writing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
