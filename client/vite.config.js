import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BrowserRouter basename — must match the repo segment in:
// https://<user>.github.io/<REPO>/
// If your repo name/path differs, change this (and your GitHub repo name).
const GH_PAGES_PATH_SEGMENT = "/WebDev-assignment-Part-2";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  return {
    // Relative URLs in production so JS/CSS load even when the host path differs
    // slightly (casing, redirects). Pair with __ROUTER_BASENAME__ in main.jsx.
    base: isBuild ? "./" : "/",
    define: {
      __ROUTER_BASENAME__: JSON.stringify(
        isBuild ? GH_PAGES_PATH_SEGMENT : ""
      ),
    },
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
  };
});
