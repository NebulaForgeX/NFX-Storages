import type { ReactNode } from "react";

import { DataProvider as NfxDataProvider } from "nfx-ui/providers";

import { StorageRepositoriesContext, storageRepositories } from "@/apis/repositories";

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <NfxDataProvider>
      <StorageRepositoriesContext.Provider value={storageRepositories}>{children}</StorageRepositoriesContext.Provider>
    </NfxDataProvider>
  );
}
