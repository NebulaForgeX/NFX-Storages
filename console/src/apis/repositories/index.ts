import { createContext, useContext } from "react";

import { accessKeysRepository } from "./adminRepositories";
import { authRepository } from "./authRepository";
import { bucketRepository } from "./bucketRepository";
import { adminRepository, eventsTargetRepository, groupsRepository, iamExportRepository, policiesRepository, poolsRepository, sseRepository, systemRepository, tiersRepository, usersRepository } from "./adminRepositories";
import { objectRepository } from "./objectRepository";

export const storageRepositories = {
  auth: authRepository,
  buckets: bucketRepository,
  objects: objectRepository,
  users: usersRepository,
  groups: groupsRepository,
  policies: policiesRepository,
  accessKeys: accessKeysRepository,
  admin: adminRepository,
  system: systemRepository,
  eventsTarget: eventsTargetRepository,
  tiers: tiersRepository,
  sse: sseRepository,
  iamExport: iamExportRepository,
  pools: poolsRepository,
};

export type StorageRepositories = typeof storageRepositories;

export const StorageRepositoriesContext = createContext<StorageRepositories>(storageRepositories);

export function useStorageRepositories() {
  return useContext(StorageRepositoriesContext);
}

export {
  accessKeysRepository,
  adminRepository,
  authRepository,
  bucketRepository,
  eventsTargetRepository,
  groupsRepository,
  iamExportRepository,
  objectRepository,
  policiesRepository,
  poolsRepository,
  sseRepository,
  systemRepository,
  tiersRepository,
  usersRepository,
};
