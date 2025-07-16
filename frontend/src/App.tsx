import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="border-l-1 w-full">{children}</div>
      <Toaster />
    </SidebarProvider>
  );
}

export default App;
