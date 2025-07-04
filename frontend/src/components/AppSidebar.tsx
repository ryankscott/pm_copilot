import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { PRDList } from "./PRDList";
import { Settings2, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@tanstack/react-router";

// Menu items.
export function AppSidebar() {
  const { success } = useToast();

  const handleGitHubClick = () => {
    success("Redirecting to GitHub", "Opening issues page in a new tab");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="text-xl font-bold">PM Copilot</SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <h3 className="font-semibold text-md">PRDs</h3>
            <PRDList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild>
          <a
            href="https://github.com/ryankscott/pm_copilot/issues"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGitHubClick}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Issues</span>
          </a>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <Link to="/settings">
            <Settings2 className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
