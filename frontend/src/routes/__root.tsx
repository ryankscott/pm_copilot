import App from "@/App";
import { createRootRoute, Outlet } from "@tanstack/react-router";
//import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function RootComponent() {
  return (
    <App>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </App>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
