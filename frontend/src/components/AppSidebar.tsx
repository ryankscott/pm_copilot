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
      <SidebarFooter className="flex flex-row gap-2 ">
        <SidebarMenuButton asChild className="max-w-[40px] flex justify-center">
          <a
            href="https://github.com/ryankscott/pm_copilot/issues"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGitHubClick}
          >
            <Github className="w-4 h-4" />
          </a>
        </SidebarMenuButton>
        <SidebarMenuButton asChild className="max-w-[40px] flex justify-center">
          <Link to="/settings">
            <Settings2 className="w-4 h-4" />
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
