import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import {
  usePrds,
  usePrd,
  useCreatePrd,
  useUpdatePrd,
  useDeletePrd,
  useOptimisticUpdatePrd,
} from "@/hooks/use-prd-queries";
import type { PRD } from "@/types";

export function PRDManager() {
  const [selectedPrdId, setSelectedPrdId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPrdTitle, setNewPrdTitle] = useState("");

  // Queries
  const { data: prds, isLoading: isLoadingPrds, error: prdsError } = usePrds();
  const {
    data: selectedPrd,
    isLoading: isLoadingPrd,
    error: prdError,
  } = usePrd(selectedPrdId || "");

  // Mutations
  const createPrd = useCreatePrd();
  const updatePrd = useUpdatePrd();
  const deletePrd = useDeletePrd();
  const optimisticUpdatePrd = useOptimisticUpdatePrd();

  const handleCreatePrd = async () => {
    if (!newPrdTitle.trim()) return;

    try {
      const newPrd = await createPrd.mutateAsync({
        title: newPrdTitle.trim(),
        content: "# New PRD\n\nStart writing your requirements here...",
      });
      setSelectedPrdId(newPrd.id);
      setNewPrdTitle("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create PRD:", error);
    }
  };

  const handleUpdatePrd = async (id: string, updates: Partial<PRD>) => {
    try {
      await updatePrd.mutateAsync({ id, data: updates });
    } catch (error) {
      console.error("Failed to update PRD:", error);
    }
  };

  const handleOptimisticUpdate = async (id: string, updates: Partial<PRD>) => {
    try {
      await optimisticUpdatePrd.mutateAsync({ id, data: updates });
    } catch (error) {
      console.error("Failed to update PRD optimistically:", error);
    }
  };

  const handleDeletePrd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this PRD?")) return;

    try {
      await deletePrd.mutateAsync(id);
      if (selectedPrdId === id) {
        setSelectedPrdId(null);
      }
    } catch (error) {
      console.error("Failed to delete PRD:", error);
    }
  };

  if (prdsError) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Error loading PRDs: {prdsError.message}</p>
      </Card>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* PRD List */}
      <div className="w-1/3 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">PRDs</h2>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={createPrd.isPending}
            size="sm"
          >
            {createPrd.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New PRD
          </Button>
        </div>

        {/* Create New PRD Form */}
        {isCreating && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="PRD Title"
                value={newPrdTitle}
                onChange={(e) => setNewPrdTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePrd();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewPrdTitle("");
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePrd}
                  disabled={!newPrdTitle.trim() || createPrd.isPending}
                  size="sm"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewPrdTitle("");
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PRD List */}
        <div className="space-y-2">
          {isLoadingPrds ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            prds?.map((prd) => (
              <Card
                key={prd.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedPrdId === prd.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPrdId(prd.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{prd.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(prd.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrd(prd.id);
                      }}
                      disabled={deletePrd.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* PRD Editor */}
      <div className="flex-1">
        {selectedPrdId ? (
          <PRDEditor
            key={selectedPrdId}
            prdId={selectedPrdId}
            prd={selectedPrd}
            isLoading={isLoadingPrd}
            error={prdError}
            onUpdate={handleUpdatePrd}
            onOptimisticUpdate={handleOptimisticUpdate}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent>
              <p className="text-muted-foreground text-center">
                Select a PRD to start editing
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface PRDEditorProps {
  prdId: string;
  prd?: PRD;
  isLoading: boolean;
  error: Error | null;
  onUpdate: (id: string, updates: Partial<PRD>) => Promise<void>;
  onOptimisticUpdate: (id: string, updates: Partial<PRD>) => Promise<void>;
}

function PRDEditor({
  prdId,
  prd,
  isLoading,
  error,
  onUpdate,
  onOptimisticUpdate,
}: PRDEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  // Update local state when PRD data changes
  useEffect(() => {
    if (prd) {
      setTitle(prd.title);
      setContent(prd.content);
      setHasChanges(false);
    }
  }, [prd]);

  const handleSave = async () => {
    if (!prd || !hasChanges) return;

    await onUpdate(prdId, {
      title: title.trim() || "Untitled PRD",
      content,
    });
    setHasChanges(false);
  };

  const handleOptimisticSave = async () => {
    if (!prd) return;

    await onOptimisticUpdate(prdId, {
      title: title.trim() || "Untitled PRD",
      content,
    });
  };

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-red-500 text-center">
            Error loading PRD: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!prd) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">PRD not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
            placeholder="PRD Title"
          />
          <div className="flex gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "edit" | "preview")}
            >
              <TabsList>
                <TabsTrigger value="edit">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              variant={hasChanges ? "default" : "outline"}
            >
              Save
            </Button>
            <Button onClick={handleOptimisticSave} variant="outline" size="sm">
              Auto-save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={viewMode} className="h-full">
          <TabsContent value="edit" className="h-full mt-0">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasChanges(true);
              }}
              className="w-full h-full resize-none border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Start writing your PRD..."
            />
          </TabsContent>
          <TabsContent value="preview" className="h-full mt-0">
            <div className="h-full overflow-auto border border-border rounded-md p-4 prose prose-sm max-w-none">
              {content ? (
                <pre className="whitespace-pre-wrap font-sans">{content}</pre>
              ) : (
                <p className="text-muted-foreground italic">
                  No content to preview
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
