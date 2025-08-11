import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2 } from "lucide-react";
import { useTemplates } from "@/hooks/use-template-queries";
import type { Template } from "@/types";

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: Template | null) => void;
}

// Category icons removed since templates are shown in a flat list.

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  onTemplateSelect,
}: TemplateSelectionDialogProps) {
  const { data: templates, isLoading } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    onTemplateSelect(selectedTemplate);
    onOpenChange(false);
    setSelectedTemplate(null);
  };

  const handleSkip = () => {
    onTemplateSelect(null);
    onOpenChange(false);
    setSelectedTemplate(null);
  };

  // Flattened list: templates already an array, no grouping by category.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select a template to get started with a structured PRD, or skip to
            create a blank document.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading templates...</span>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {templates?.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {template.title}
                    </CardTitle>
                    {template.isCustom && (
                      <Badge variant="outline" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    {template.sections.length} sections
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.sections.slice(0, 3).map((section) => (
                      <Badge
                        key={section.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {section.name}
                      </Badge>
                    ))}
                    {template.sections.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.sections.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleSkip}>
            Skip Template
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedTemplate}>
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
