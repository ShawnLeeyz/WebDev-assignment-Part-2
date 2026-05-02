import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production: https://shawnleeyz.github.io/WebDev-assignment-Part-2/
const GH_PAGES_BASE = "/WebDev-assignment-Part-2/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? GH_PAGES_BASE : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
}));
