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
  nfxConsoleBase,
  nfxViteDevServer,
  resolveNfxUiRoot,
} from "./vite.nfx-ui.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);
const nfxUiRoot = resolveNfxUiRoot(root);

export default defineConfig(({ mode, command }) => {
  const env = loadNfxConsoleEnv(root, mode);
  const port = Number(env.VITE_PORT) || 5173;
  const apiUrl = (env.VITE_API_URL || "").replace(/\/$/, "");
  const identityUrl = (env.VITE_IDENTITY_API_URL || "").replace(/\/$/, "");
  const apiIsPath = apiUrl.startsWith("/");
  const identityIsPath = identityUrl.startsWith("/");
  const edgeOrigin = (env.VITE_DEV_API_PROXY_TARGET || "http://192.168.1.64").replace(/\/$/, "");

  return {
    plugins: [nfxKillListenPortPlugin(port), nfxUiAtAliasPlugin(root, nfxUiRoot), react()],
    base: nfxConsoleBase(env),
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
      holdUntilCrawlEnd: false,
    },
    server: {
      ...nfxViteDevServer(env, port),
      fs: { allow: [root, nfxUiRoot] },
      ...(command === "serve" && (apiIsPath || identityIsPath)
        ? {
            proxy: {
              ...(apiIsPath ? { [apiUrl]: { target: edgeOrigin, changeOrigin: true } } : {}),
              ...(identityIsPath ? { [identityUrl]: { target: edgeOrigin, changeOrigin: true } } : {}),
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
