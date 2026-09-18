import type { IdentityRepositories } from "./repositories/context";

let activeIdentityRepositories: Nullable<IdentityRepositories> = null;

export function getIdentityRepositories(): IdentityRepositories {
  if (!activeIdentityRepositories) {
    throw new Error("Identity repositories not initialized. Mount Identity DataProvider.");
  }
  return activeIdentityRepositories;
}

export function setIdentityRepositories(repos: IdentityRepositories): void {
  activeIdentityRepositories = repos;
}
