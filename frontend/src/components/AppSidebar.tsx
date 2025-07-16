import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { PRDList } from "./PRDList";
import { Settings2, Github, FileText, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { usePrds } from "@/hooks/use-prd-queries";

// Menu items.
export function AppSidebar() {
  const { success } = useToast();
  const { state } = useSidebar();
  const [selectedSection, setSelectedSection] = useState<
    "documents" | "templates"
  >("documents");
  const { data: prds } = usePrds();

  const handleGitHubClick = () => {
    success("Redirecting to GitHub", "Opening issues page in a new tab");
  };

  const documentsCount = prds?.length || 0;
  const templatesCount = 0; // Templates don't exist yet

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader className="text-xl font-bold flex flex-row items-center justify-between">
            <span>PM Copilot</span>
            {state === "expanded" && <SidebarTrigger />}
          </SidebarHeader>

          {/* Section Selection */}
          <SidebarGroup>
            <SidebarGroupContent className="px-2">
              <div className="flex flex-col gap-1">
                <SidebarMenuButton
                  onClick={() => setSelectedSection("documents")}
                  className={`flex items-center gap-2 w-full justify-start 
                    hover:text-accent-foreground
                    ${
                      selectedSection === "documents"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                  <span
                    className={`ml-auto text-xs 
                    ${
                      selectedSection === "documents"
                        ? "text-accent-foreground"
                        : "text-muted-foreground hover:text-muted-foreground"
                    }`}
                  >
                    {documentsCount}
                  </span>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={() => setSelectedSection("templates")}
                  className={`flex items-center gap-2 w-full justify-start ${
                    selectedSection === "templates"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Templates</span>
                  <span
                    className={`ml-auto text-xs 
                    ${
                      selectedSection === "templates"
                        ? "text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {templatesCount}
                  </span>
                </SidebarMenuButton>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Content based on selection */}
          <SidebarGroup>
            <SidebarGroupContent>
              {selectedSection === "documents" && (
                <div>
                  <h3 className="font-semibold text-sm px-4 mb-2">PRDs</h3>
                  <PRDList />
                </div>
              )}
              {selectedSection === "templates" && (
                <div className="px-4">
                  <h3 className="font-semibold text-sm mb-2">Templates</h3>
                  <div className="text-sm text-muted-foreground">
                    No templates available yet
                  </div>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex flex-row gap-2 ">
          <SidebarMenuButton
            asChild
            className="max-w-[40px] flex justify-center"
          >
            <a
              href="https://github.com/ryankscott/pm_copilot/issues"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleGitHubClick}
            >
              <Github className="w-4 h-4" />
            </a>
          </SidebarMenuButton>
          <SidebarMenuButton
            asChild
            className="max-w-[40px] flex justify-center"
          >
            <Link to="/settings">
              <Settings2 className="w-4 h-4" />
            </Link>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      {/* Trigger for collapsed state - positioned outside sidebar */}
      {state === "collapsed" && (
        <div className="h-full w-12">
          <SidebarTrigger className="fixed left-2 top-2 z-50" />
        </div>
      )}
    </>
  );
}
