import type { DataResponse } from "nfx-ui/types";

import { publicClient } from "./httpClients";
import { URL_PATHS } from "./ip";

export const getErrorTranslations = async (lang: string): Promise<Record<string, unknown>> => {
  const { data } = await publicClient.get<Record<string, unknown>>(URL_PATHS.SYSTEM.i18nErrors(lang));
  return data;
};

export const getLatestSystemState = async () => {
  const { data } = await publicClient.get<DataResponse<{ initialized: boolean }>>(URL_PATHS.SYSTEM.latest);
  return data.data;
};

export const initializeSystem = async (version = "1.0.0") => {
  const { data } = await publicClient.post<DataResponse<{ initialized: boolean }>>(URL_PATHS.SYSTEM.initialize, { version });
  return data.data;
};
