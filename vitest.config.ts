import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/routes/routes-path": path.resolve(__dirname, "./src/routes/routesPath.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // happy-dom provides document.cookie / sessionStorage / localStorage for
    // the auth-session utilities under test.
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      VITE_BACKEND_URL: "http://test.local/v1",
    },
  },
});
