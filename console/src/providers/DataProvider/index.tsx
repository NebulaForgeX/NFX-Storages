import type { ReactNode } from "react";

import { StorageRepositoriesContext, storageRepositories } from "@/apis/repositories";

export interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  return <StorageRepositoriesContext.Provider value={storageRepositories}>{children}</StorageRepositoriesContext.Provider>;
}

export default DataProvider;
