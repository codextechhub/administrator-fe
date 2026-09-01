import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // esbuild does not read tsconfig's jsx setting for files under
  // node_modules; without this every package component throws
  // "React is not defined" at render.
  esbuild: { jsx: "automatic" },
  resolve: {
    // See tsconfig: symlinked sibling checkout.
    preserveSymlinks: true,
    alias: [
      { find: "@xvs-host", replacement: path.resolve(__dirname, "./src/xvs-host.tsx") },
      { find: /^@\/components\/finance-ui$/, replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/components/finance-ui/index.ts") },
      { find: "@/components/finance-ui", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/components/finance-ui") },
      { find: "@/redux/services/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/finance") },
      { find: "@/redux/services/procurement", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/procurement") },
      { find: "@/redux/services/payments", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/payments") },
      { find: "@/redux/features/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/features/finance") },
      { find: "@/pages/protected/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/pages/finance") },
      { find: "@/pages/protected/procurement", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/pages/procurement") },
      { find: "@/pages/protected/workflow/components", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/components/workflow") },
      { find: "@xvs/finance", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src") },
      { find: "@/utils/money", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/money.ts") },
      { find: "@/utils/posting-window", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/posting-window.ts") },
      { find: "@/utils/quantity", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/quantity.ts") },
      { find: "@/utils/fls", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/fls.ts") },
      { find: "@/utils/finance-export", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/finance-export.ts") },
      { find: "@/utils/finance-documents", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/finance-documents.ts") },
      { find: "@/utils/chart-of-accounts", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/utils/chart-of-accounts.ts") },
      { find: "@/hooks/use-action-param", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/hooks/use-action-param.ts") },
      { find: "@/lib/source-document-route", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/lib/source-document-route.ts") },
      { find: "@/redux/services/tenants-api", replacement: path.resolve(__dirname, "./node_modules/@xvs/finance/src/redux/services/tenants-api.ts") },
      { find: "@/routes/routes-path", replacement: path.resolve(__dirname, "./src/routes/routesPath.ts") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  test: {
    // happy-dom provides document.cookie / sessionStorage / localStorage for
    // the auth-session utilities under test.
    environment: "happy-dom",
    // Discovery skips node_modules by default; the package lives there now.
    exclude: ["**/dist/**", "**/node_modules/**/node_modules/**"],
    include: [
      "node_modules/@xvs/finance/src/**/*.test.{ts,tsx}","src/**/*.test.{ts,tsx}"],
    env: {
      VITE_BACKEND_URL: "http://test.local/v1",
    },
  },
});
