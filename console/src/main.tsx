import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@radix-ui/themes/styles.css";
import "nfx-ui/themes/fonts";
import "nfx-ui/themes/styles.css";

import { LanguageEnum } from "nfx-ui/enums";
import { LanguageProvider, ThemeProvider, ModalProvider, DataProvider } from "nfx-ui/providers";
import { LayoutProvider } from "nfx-ui/layouts";

import "./index.css";

import { getBuiltinI18nBundles } from "@/assets/languages/i18nResources";
import { DataProvider as StorageDataProvider, QueryProvider, RouterProvider } from "@/providers";
import { loadSiteConfig } from "@/apis/clients";

import App from "./App.tsx";

void loadSiteConfig();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <LanguageProvider getBuiltinBundles={getBuiltinI18nBundles} fallbackLng={LanguageEnum.ZH}>
        <ThemeProvider>
          <LayoutProvider>
            <DataProvider>
              <StorageDataProvider>
                <RouterProvider>
                  <ModalProvider>
                    <App />
                  </ModalProvider>
                </RouterProvider>
              </StorageDataProvider>
            </DataProvider>
          </LayoutProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryProvider>
  </StrictMode>,
);
