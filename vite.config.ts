import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // The framework stack changes only on dependency bumps - splitting it
        // out of the app entry lets browsers keep it cached across deploys.
        manualChunks: {
          "vendor-react": [
            "react",
            "react-dom",
            "react-router",
            "@reduxjs/toolkit",
            "react-redux",
            "redux-persist",
          ],
        },
      },
    },
  },
})
