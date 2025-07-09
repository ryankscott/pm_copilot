import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { FileText, Eye, Edit, Loader2, CheckCircle, Bot } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { PRD } from "../types";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { EditableHeader } from "./EditableHeader";

interface PRDEditorProps {
  prd: PRD;
  onUpdatePrd: (prd: PRD) => Promise<void>;
}

export function PRDEditor({ prd, onUpdatePrd }: PRDEditorProps) {
  const [title, setTitle] = useState(prd.title);
  const [content, setContent] = useState(prd.content);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAISheetOpen, setIsAISheetOpen] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when a new PRD is selected
  useEffect(() => {
    setTitle(prd.title);
    setContent(prd.content);
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, [prd.id, prd.title, prd.content]);

  // Auto-save functionality with debouncing
  const debouncedSave = useCallback(
    async (updatedPrd: PRD) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onUpdatePrd(updatedPrd);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }, 1000); // 1 second delay
    },
    [onUpdatePrd]
  );

  // Trigger auto-save when content changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const updatedPrd = {
        ...prd,
        title: title.trim() || "Untitled PRD",
        content,
      };
      debouncedSave(updatedPrd);
    }
  }, [title, content, hasUnsavedChanges, prd, debouncedSave]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleApplyAIContent = (aiContent: string) => {
    setContent(aiContent);
    setHasUnsavedChanges(true);
    setIsAISheetOpen(false);
  };

  return (
    <div className="flex-1 flex w-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col w-full">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <EditableHeader value={title} onChange={handleTitleChange} />
            </div>
            <div className="flex items-center space-x-2">
              {/* Save Status */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <span>Unsaved changes</span>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 primary" />
                    <span>Saved at {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>

              <Sheet open={isAISheetOpen} onOpenChange={setIsAISheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </SheetTrigger>
                <SheetContent className="min-w-[400px] md:min-w-[500px] p-0">
                  <AIAssistantPanel
                    prd={prd}
                    onApplyContent={handleApplyAIContent}
                  />
                </SheetContent>
              </Sheet>

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
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden w-full">
          <div className="h-full overflow-auto bg-background">
            {viewMode === "edit" ? (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full resize-none border-0 p-4 focus:ring-0 focus:outline-none bg-background text-foreground"
                placeholder="Start writing your Product Requirements Document..."
              />
            ) : (
              <div className="p-4 prose prose-gray dark:prose-invert max-w-none">
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
    </div>
  );
}
