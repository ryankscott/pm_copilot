import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      {children}
      <Toaster />
    </SidebarProvider>
  );
}

export default App;
