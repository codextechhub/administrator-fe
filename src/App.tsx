import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

function App() {
  return (
    <>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <RouterProvider router={router} />
      </TooltipProvider>
    </>
  );
}

export default App;
