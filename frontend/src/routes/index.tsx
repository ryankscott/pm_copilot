import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">How can I help you today?</h1>
          </div>
        </div>

        {/* Action Cards */}
        <div className="max-w-4xl mx-auto space-y-4 mb-16">
          <Card className="group cursor-pointer  transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📝</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Help me write a document
                    </CardTitle>
                    <CardDescription>
                      Create a new PRD or other document
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔄</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Help me improve an existing document
                    </CardTitle>
                    <CardDescription>
                      Get expert feedback on your writing
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4"></div>
      </div>
    </div>
  );
}
