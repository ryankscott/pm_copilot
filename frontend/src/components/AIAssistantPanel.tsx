import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Bot, Wand2, MessageSquare } from "lucide-react";
import type { PRD } from "@/types";
import { InteractivePRDPanel } from "./InteractivePRDPanel";
import { CritiquePanel } from "./CritiquePanel";

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
            <InteractivePRDPanel prd={prd} onApplyContent={onApplyContent} />
          </TabsContent>

          <TabsContent value="critique" className="h-full mt-0">
            <CritiquePanel prd={prd} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
