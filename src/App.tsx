import { useState, useEffect } from "react";
import { PRDEditor } from "./components/PRDEditor";
import { PRDList } from "./components/PRDList";
import { Settings, type AIProvider } from "./components/Settings";
import { Button } from "./components/ui/button";
import { Plus, Settings2 } from "lucide-react";
import { samplePRDs } from "./lib/sampleData";

export interface PRD {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function App() {
  const [prds, setPrds] = useState<PRD[]>([]);
  const [selectedPrd, setSelectedPrd] = useState<PRD | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>("openai");

  // Load sample PRDs on first visit
  useEffect(() => {
    if (prds.length === 0) {
      setPrds(samplePRDs);
    }
  }, [prds.length]);

  // Load saved provider from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-provider");
    if (saved && ["openai", "claude", "gemini", "ollama"].includes(saved)) {
      setAiProvider(saved as AIProvider);
    }
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem("ai-provider", provider);
  };

  const createNewPrd = () => {
    const newPrd: PRD = {
      id: crypto.randomUUID(),
      title: "Untitled PRD",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPrds((prev) => [newPrd, ...prev]);
    setSelectedPrd(newPrd);
  };

  const updatePrd = (updatedPrd: PRD) => {
    setPrds((prev) =>
      prev.map((prd) =>
        prd.id === updatedPrd.id
          ? { ...updatedPrd, updatedAt: new Date() }
          : prd
      )
    );
    setSelectedPrd(updatedPrd);
  };

  const deletePrd = (id: string) => {
    setPrds((prev) => prev.filter((prd) => prd.id !== id));
    if (selectedPrd?.id === id) {
      setSelectedPrd(null);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-sidebar-foreground">
              ChatPRD
            </h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button onClick={createNewPrd} size="sm">
                <Plus className="w-4 h-4" />
                New PRD
              </Button>
            </div>
          </div>
        </div>
        <PRDList
          prds={prds}
          selectedPrd={selectedPrd}
          onSelectPrd={setSelectedPrd}
          onDeletePrd={deletePrd}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedPrd ? (
          <PRDEditor
            prd={selectedPrd}
            onUpdatePrd={updatePrd}
            onSave={() => {}}
            aiProvider={aiProvider}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to ChatPRD
              </h2>
              <p className="text-muted-foreground mb-6">
                Create and manage your Product Requirements Documents with AI
                assistance
              </p>
              <Button onClick={createNewPrd}>
                <Plus className="w-4 h-4" />
                Create Your First PRD
              </Button>
            </div>
          </div>
        )}
      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        provider={aiProvider}
        onProviderChange={handleProviderChange}
      />
    </div>
  );
}

export default App;
