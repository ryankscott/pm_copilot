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
import { PMCopilotIcon } from "./PMCopilotLogo";
import { Settings2, Github, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useRouter } from "@tanstack/react-router";

// Menu items.
export function AppSidebar() {
  const { success } = useToast();
  const { state } = useSidebar();
  const router = useRouter();

  const handleGitHubClick = () => {
    success("Redirecting to GitHub", "Opening issues page in a new tab");
  };

  return (
    <>
      <Sidebar>
        <SidebarContent className="py-2">
          <SidebarHeader
            onClick={async () => {
              await router.navigate({ to: "/" });
            }}
            className="text-xl font-bold flex flex-row items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <PMCopilotIcon size={24} />
              <span>PM Copilot</span>
            </div>
            {state === "expanded" && <SidebarTrigger />}
          </SidebarHeader>
          <SidebarGroup>
            <SidebarGroupContent className="px-2">
              <SidebarMenuButton asChild>
                <Link
                  to="/chat"
                  className="flex items-center gap-2 w-full justify-start"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* PRD List */}
          <SidebarGroup>
            <SidebarGroupContent>
              <div>
                <h3 className="font-semibold text-sm px-4 mb-2">PRDs</h3>
                <PRDList />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Chat Navigation */}
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
        <div className="flex flex-col h-full w-12 justify-center items-center py-4 gap-4">
          <PMCopilotIcon size={24} />
          <SidebarTrigger className="" />
        </div>
      )}
    </>
  );
}
