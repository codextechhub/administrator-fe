import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

// No app-wide <Toaster/> here: toasts are mounted per shell so they can sit
// over the work area. DashboardLayout mounts the sidebar-aware WorkspaceToaster;
// AuthLayout mounts the AuthToaster. See components/ui/sonner.tsx.
function App() {
  return (
    <>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </>
  );
}

export default App;
