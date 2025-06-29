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

// Menu items.
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>PMCopilot</SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <h3 className="font-semibold text-md">PRDs</h3>
            <PRDList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild>
          <a href="https://github.com/ryankscott/pm_copilot/issues" target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4" />
            <span>GitHub Issues</span>
          </a>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <a href={"/settings"}>
            <Settings2 className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
