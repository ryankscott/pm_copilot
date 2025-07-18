import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import {
  FileText,
  Eye,
  Edit,
  Loader2,
  CheckCircle,
  Download,
} from "lucide-react";
import type { PRD } from "../types";
import { EditableHeader } from "./EditableHeader";
import { TiptapEditor } from "./TiptapEditor";
import { exportToMarkdown, sanitizeFilename } from "../lib/utils";

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

  const handleExportToMarkdown = () => {
    const filename = sanitizeFilename(title || "untitled_prd") + ".md";
    exportToMarkdown(content, filename);
  };

  return (
    <div className="flex-1 flex w-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col w-full">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 pl-4">
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToMarkdown}
                title="Export as Markdown"
              >
                <Download className="w-4 h-4 mr-2" />
                Export MD
              </Button>

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
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Start writing your Product Requirements Document... (You can use markdown shortcuts like **bold**, *italic*, # headings, - lists)"
                className="h-full border-0"
              />
            ) : (
              <div className="p-4 prose prose-gray dark:prose-invert max-w-none">
                {content ? (
                  <div
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
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
