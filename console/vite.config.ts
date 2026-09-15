import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT) || 5173;
  const base = (env.VITE_BASE_URL || "/").replace(/\/?$/, "/");

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "lucide-react/icons": path.resolve(__dirname, "./node_modules/lucide-react/dist/esm/icons"),
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query", "zustand"],
    },
    css: {
      modules: {
        localsConvention: "camelCase",
        generateScopedName: "[name]__[local]___[hash:base64:5]",
      },
    },
    server: {
      port,
      host: "0.0.0.0",
      watch: {
        ignored: ["**/node_modules/**"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
    },
  };
});
