import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Target, TrendingUp } from "lucide-react";
import type { OKRs, OKRObjective, OKRKeyResult } from "@/types";

interface OKRInputProps {
  value: OKRs | undefined;
  onChange: (okrs: OKRs) => void;
  label: string;
  placeholder?: string;
}

export function OKRInput({
  value,
  onChange,
  label,
  placeholder,
}: OKRInputProps) {
  const okrs = value || { objectives: [] };

  const addObjective = () => {
    const newObjective: OKRObjective = {
      id: Date.now().toString(),
      title: "",
      description: "",
      keyResults: [],
    };

    onChange({
      objectives: [...okrs.objectives, newObjective],
    });
  };

  const updateObjective = (
    objectiveId: string,
    updates: Partial<OKRObjective>
  ) => {
    const updatedObjectives = okrs.objectives.map((obj) =>
      obj.id === objectiveId ? { ...obj, ...updates } : obj
    );

    onChange({ objectives: updatedObjectives });
  };

  const removeObjective = (objectiveId: string) => {
    const updatedObjectives = okrs.objectives.filter(
      (obj) => obj.id !== objectiveId
    );
    onChange({ objectives: updatedObjectives });
  };

  const addKeyResult = (objectiveId: string) => {
    const newKeyResult: OKRKeyResult = {
      id: Date.now().toString(),
      description: "",
      target: "",
      current: "",
    };

    const updatedObjectives = okrs.objectives.map((obj) =>
      obj.id === objectiveId
        ? { ...obj, keyResults: [...obj.keyResults, newKeyResult] }
        : obj
    );

    onChange({ objectives: updatedObjectives });
  };

  const updateKeyResult = (
    objectiveId: string,
    keyResultId: string,
    updates: Partial<OKRKeyResult>
  ) => {
    const updatedObjectives = okrs.objectives.map((obj) =>
      obj.id === objectiveId
        ? {
            ...obj,
            keyResults: obj.keyResults.map((kr) =>
              kr.id === keyResultId ? { ...kr, ...updates } : kr
            ),
          }
        : obj
    );

    onChange({ objectives: updatedObjectives });
  };

  const removeKeyResult = (objectiveId: string, keyResultId: string) => {
    const updatedObjectives = okrs.objectives.map((obj) =>
      obj.id === objectiveId
        ? {
            ...obj,
            keyResults: obj.keyResults.filter((kr) => kr.id !== keyResultId),
          }
        : obj
    );

    onChange({ objectives: updatedObjectives });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addObjective}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Objective
        </Button>
      </div>

      {okrs.objectives.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {placeholder ||
              "No objectives yet. Click 'Add Objective' to get started."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {okrs.objectives.map((objective) => (
          <Card key={objective.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-base">Objective</CardTitle>
                  </div>
                  <Input
                    placeholder="Enter objective title (e.g., Increase user engagement)"
                    value={objective.title}
                    onChange={(e) =>
                      updateObjective(objective.id, { title: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Optional: Describe the objective in more detail"
                    value={objective.description || ""}
                    onChange={(e) =>
                      updateObjective(objective.id, {
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(objective.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <Label className="text-sm font-medium">Key Results</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addKeyResult(objective.id)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add KR
                </Button>
              </div>

              {objective.keyResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground bg-gray-50 rounded-lg">
                  <p className="text-xs">
                    No key results yet. Add measurable outcomes for this
                    objective.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {objective.keyResults.map((keyResult) => (
                  <div
                    key={keyResult.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder="Key result description"
                        value={keyResult.description}
                        onChange={(e) =>
                          updateKeyResult(objective.id, keyResult.id, {
                            description: e.target.value,
                          })
                        }
                        className="md:col-span-2"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          placeholder="Target"
                          value={keyResult.target || ""}
                          onChange={(e) =>
                            updateKeyResult(objective.id, keyResult.id, {
                              target: e.target.value,
                            })
                          }
                          className="text-xs"
                        />
                        <Input
                          placeholder="Current"
                          value={keyResult.current || ""}
                          onChange={(e) =>
                            updateKeyResult(objective.id, keyResult.id, {
                              current: e.target.value,
                            })
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeKeyResult(objective.id, keyResult.id)
                      }
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
