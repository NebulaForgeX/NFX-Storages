import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import {
  loadNfxConsoleEnv,
  nfxKillListenPortPlugin,
  nfxUiAtAliasPlugin,
  nfxUiDedupe,
  nfxUiOptimizeDepsExclude,
  nfxUiViteAliases,
  nfxViteDefine,
  resolveNfxUiRoot,
} from "./vite.nfx-ui.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);
const nfxUiRoot = resolveNfxUiRoot(root);

export default defineConfig(({ mode, command }) => {
  const env = loadNfxConsoleEnv(root, mode);
  const port = Number(env.VITE_PORT) || 5173;
  const base = (env.VITE_BASE_URL || "/").replace(/\/?$/, "/");
  const hasApiUrl = Boolean(env.VITE_API_URL);
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || "http://192.168.1.64";
  const identityTarget = env.VITE_IDENTITY_API_URL || "http://192.168.1.64/nfx-identity";

  return {
    plugins: [nfxKillListenPortPlugin(port), nfxUiAtAliasPlugin(root, nfxUiRoot), react()],
    base,
    define: nfxViteDefine(env),
    resolve: {
      alias: nfxUiViteAliases(root, nfxUiRoot),
      dedupe: nfxUiDedupe,
    },
    css: {
      modules: {
        localsConvention: "camelCase",
        generateScopedName: "[name]__[local]___[hash:base64:5]",
      },
    },
    optimizeDeps: {
      exclude: nfxUiOptimizeDepsExclude,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      fs: { allow: [root, nfxUiRoot] },
      ...(command === "serve" && !hasApiUrl
        ? {
            proxy: {
              "/nfx-storages": { target: proxyTarget, changeOrigin: true },
              "/system": { target: proxyTarget, changeOrigin: true },
              "/auth": { target: identityTarget, changeOrigin: true },
              "/asset": { target: identityTarget, changeOrigin: true },
            },
          }
        : {}),
    },
    preview: {
      port,
      strictPort: true,
      host: "0.0.0.0",
    },
  };
});
