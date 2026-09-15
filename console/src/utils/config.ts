import type { SiteConfig } from "@/types/config";

import { handleConfigError } from "./error-handler";
import { logger } from "./logger";
import {
  createDefaultConfig,
  fetchConfigFromServer,
  getCurrentBrowserConfig,
  getServerDefaultConfig,
  getStoredHostConfig,
} from "./config-helpers";

let configCache: SiteConfig | null = null;
let configCacheTime = 0;
const CACHE_DURATION = 60000;

function loadRuntimeConfig(): SiteConfig | null {
  try {
    const serverHost = import.meta.env.VITE_SERVER_HOST || import.meta.env.VITE_API_BASE_URL?.replace(/\/nfxstorages\/admin\/v3$/, "") || import.meta.env.VITE_API_BASE_URL?.replace(/\/nebulafx\/admin\/v3$/, "");
    if (!serverHost) return null;
    return {
      serverHost,
      api: {
        baseURL: import.meta.env.VITE_API_BASE_URL || `${serverHost}/nfxstorages/admin/v3`,
      },
      s3: {
        endpoint: import.meta.env.VITE_S3_ENDPOINT || serverHost,
        region: import.meta.env.VITE_S3_REGION || "us-east-1",
        accessKeyId: "",
        secretAccessKey: "",
      },
      session: {
        durationSeconds: Number(import.meta.env.VITE_SESSION_DURATION_SECONDS) || 3600 * 12,
      },
    };
  } catch (error) {
    const configError = handleConfigError(error, "runtime config loading");
    logger.warn("Failed to load runtime config:", configError.message);
    return null;
  }
}

export const configManager = {
  getCurrentHostConfig(): SiteConfig {
    const storedResult = getStoredHostConfig();
    if (storedResult.config) return storedResult.config;
    const browserResult = getCurrentBrowserConfig();
    if (browserResult.config) return browserResult.config;
    return getServerDefaultConfig().config!;
  },

  async loadConfigFromServer(): Promise<SiteConfig | null> {
    try {
      const result = await fetchConfigFromServer();
      return result.config;
    } catch (error) {
      const configError = handleConfigError(error, "server config loading");
      logger.warn("Failed to load config from server:", configError.message);
      return null;
    }
  },

  async loadConfig(): Promise<SiteConfig> {
    const now = Date.now();
    if (configCache && now - configCacheTime < CACHE_DURATION) {
      return configCache;
    }

    let config: SiteConfig;
    const storedResult = getStoredHostConfig();
    if (storedResult.config) {
      config = storedResult.config;
    } else {
      const runtimeConfig = loadRuntimeConfig();
      if (runtimeConfig?.serverHost) {
        config = runtimeConfig;
      } else {
        const serverConfig = await this.loadConfigFromServer();
        if (serverConfig) {
          config = serverConfig;
        } else {
          const browserResult = getCurrentBrowserConfig();
          config = browserResult.config ?? getServerDefaultConfig().config!;
        }
      }
    }

    configCache = config;
    configCacheTime = now;
    return config;
  },

  clearCache() {
    configCache = null;
    configCacheTime = 0;
  },

  async hasValidConfig(): Promise<boolean> {
    const config = await this.loadConfig();
    return !!(config?.serverHost && config?.api?.baseURL);
  },

  async reloadConfigFromServer(): Promise<SiteConfig | null> {
    try {
      this.clearCache();
      const config = await this.loadConfigFromServer();
      if (config) {
        configCache = config;
        configCacheTime = Date.now();
        logger.info("Configuration reloaded from server successfully");
      }
      return config;
    } catch (error) {
      const configError = handleConfigError(error, "reloading config from server");
      logger.error("Failed to reload config from server:", configError.message);
      return null;
    }
  },
};

export { createDefaultConfig };
