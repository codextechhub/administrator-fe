import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import AppProvider from "./redux/provider.tsx";
import { installStaleChunkReload } from "@/utils/stale-chunk";
// The sidebar mark writes the school's name in this on hover; nothing else
// uses it, and it is one weight of one face.
import "@fontsource/great-vibes/400.css";
// Geist is the app's typeface, the same one the CodeX console uses. Two
// variable files replace the ten static weights of Montserrat and Outfit that
// used to be shipped, so this is fewer bytes as well as one voice across both
// products. Mono carries figures: money and codes line up in a column.
import "@fontsource-variable/geist/index.css";
import "@fontsource-variable/geist-mono/index.css";

// Recover from stale dynamic-import chunks after a redeploy (guarded reload).
installStaleChunkReload();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
