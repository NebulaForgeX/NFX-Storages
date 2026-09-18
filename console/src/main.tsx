import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@radix-ui/themes/styles.css";
import "nfx-ui/themes/fonts";
import "nfx-ui/themes/index.css";

import { LanguageEnum } from "nfx-ui/enums";
import { LanguageProvider, ThemeProvider } from "nfx-ui/providers";
import { ensureDeviceIdStorage } from "nfx-ui/stores";

import { loadSiteConfig } from "@/apis/clients";
import { storageRepositories } from "@/apis/repositories";
import { getBuiltinI18nBundles } from "@/assets/languages/i18nResources";
import { syncDocumentLogo } from "@/constants";
import { DataProvider, ModalProvider, QueryProvider, RouterProvider } from "@/providers";

import App from "./App";

import "./index.css";

void ensureDeviceIdStorage();
void loadSiteConfig();

async function onLoadExtraBundles(lng: LanguageEnum) {
  try {
    const bundle = await storageRepositories.system.getErrorTranslations(lng);
    return { namespace: "errors", bundle: bundle as Record<string, unknown> };
  } catch {
    return null;
  }
}

function bootstrap() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <LanguageProvider fallbackLng={LanguageEnum.ZH} getBuiltinBundles={getBuiltinI18nBundles} onLoadExtraBundles={onLoadExtraBundles}>
          <ThemeProvider onAppearanceChange={syncDocumentLogo}>
            <DataProvider>
              <RouterProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </RouterProvider>
            </DataProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryProvider>
    </StrictMode>,
  );
}

void bootstrap();
