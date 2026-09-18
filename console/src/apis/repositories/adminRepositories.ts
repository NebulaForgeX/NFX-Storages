import { createAdminApiClient } from "@/apis/clients";
import * as systemApi from "@/apis/system.api";

export const usersRepository = {
  listUsers: () => createAdminApiClient().get("/list-users"),
  createUser: (data: { accessKey: string; secretKey?: string; status?: string; policy?: string }) => {
    const { accessKey, ...rest } = data;
    return createAdminApiClient().put(`/add-user?accessKey=${encodeURIComponent(accessKey)}`, rest);
  },
  getUser: (name: string) => createAdminApiClient().get(`/user-info?accessKey=${encodeURIComponent(name)}`),
  updateUser: (name: string, data: unknown) => createAdminApiClient().put(`/user/${encodeURIComponent(name)}`, data),
  changeUserStatus: (name: string, data: { status: string }) =>
    createAdminApiClient().put(`/set-user-status?accessKey=${encodeURIComponent(name)}&status=${encodeURIComponent(data.status)}`, data),
  deleteUser: (name: string) => createAdminApiClient().delete(`/remove-user?accessKey=${encodeURIComponent(name)}`),
  updateUserGroups: (name: string, data: unknown) => createAdminApiClient().put(`/user/${encodeURIComponent(name)}/groups`, data),
  getUserPolicy: () => createAdminApiClient().get("/user/policy"),
  getSaUserPolicy: (name: string) => createAdminApiClient().get(`/user/${encodeURIComponent(name)}/policies`),
  setPolicy: (data: unknown) => createAdminApiClient().put("/set-policy", data),
  listAllUserServiceAccounts: (name: string) => createAdminApiClient().get(`/user/${encodeURIComponent(name)}/service-accounts`),
  createAUserServiceAccount: (name: string, data: unknown) =>
    createAdminApiClient().post(`/user/${encodeURIComponent(name)}/service-accounts`, data),
  createServiceAccountCredentials: (name: string, data: unknown) =>
    createAdminApiClient().post(`/user/${encodeURIComponent(name)}/service-account-credentials`, data),
};

export const groupsRepository = {
  listGroup: () => createAdminApiClient().get("/groups"),
  getGroup: (name: string) => createAdminApiClient().get(`/group?group=${encodeURIComponent(name)}`),
  createGroup: (data: unknown) => createAdminApiClient().post("/groups", data),
  removeGroup: (name: string) => createAdminApiClient().delete(`/group/${encodeURIComponent(name)}`),
  updateGroup: (name: string, data: unknown) => createAdminApiClient().put(`/group/${encodeURIComponent(name)}`, data),
  updateGroupStatus: (name: string, data: { status: string }) =>
    createAdminApiClient().put(`/set-group-status?group=${encodeURIComponent(name)}&status=${encodeURIComponent(data.status)}`, data),
  updateGroupMembers: (data: unknown) => createAdminApiClient().put("/update-group-members", data),
};

export const policiesRepository = {
  listPolicies: () => createAdminApiClient().get("/list-canned-policies"),
  addPolicy: (data: unknown) => createAdminApiClient().post("/add-canned-policy", data),
  getPolicy: (policyName: string) => createAdminApiClient().get(`/info-canned-policy?name=${encodeURIComponent(policyName)}`),
  listUsersForPolicy: (policyName: string) => createAdminApiClient().get(`/policy/${encodeURIComponent(policyName)}/users`),
  listGroupsForPolicy: () => createAdminApiClient().get("/groups"),
  removePolicy: (policyName: string) => createAdminApiClient().delete(`/remove-canned-policy?name=${encodeURIComponent(policyName)}`),
  setPolicyMultiple: (data: unknown) => createAdminApiClient().put("/set-policy-multi", data),
  setUserOrGroupPolicy: (data: Record<string, string>) =>
    createAdminApiClient().put("/set-user-or-group-policy", {}, { params: data }),
};

export const accessKeysRepository = {
  listUserServiceAccounts: (params: Record<string, string> = {}) =>
    createAdminApiClient().get("/list-service-accounts", { params }),
  createServiceAccount: (data: unknown) => createAdminApiClient().put("/add-service-accounts", data),
  getServiceAccount: (name: string) => createAdminApiClient().get(`/info-service-account?accessKey=${encodeURIComponent(name)}`),
  updateServiceAccount: (name: string, data: unknown) =>
    createAdminApiClient().post(`/update-service-account?accessKey=${encodeURIComponent(name)}`, data),
  deleteServiceAccount: (name: string) =>
    createAdminApiClient().delete(`/delete-service-accounts?accessKey=${encodeURIComponent(name)}`),
  createServiceAccountCreds: (data: unknown) => createAdminApiClient().post("/service-account-credentials", data),
};

export const systemRepository = {
  getSystemInfo: () => createAdminApiClient().get("/info"),
  getStorageInfo: () => createAdminApiClient().get("/storageinfo"),
  getDataUsageInfo: () => createAdminApiClient().get("/datausageinfo"),
  getSystemMetrics: () => createAdminApiClient().get("/metrics"),
  getLicense: () => createAdminApiClient().get("/license"),
  getErrorTranslations: systemApi.getErrorTranslations,
  getLatestSystemState: systemApi.getLatestSystemState,
  initializeSystem: systemApi.initializeSystem,
};

export const eventsTargetRepository = {
  getEventsTargetList: () => createAdminApiClient().get("/target/list"),
  updateEventTarget: (targetType: string, targetName: string, targetData: unknown) =>
    createAdminApiClient().put(`/target/${encodeURIComponent(targetType)}/${encodeURIComponent(targetName)}`, targetData),
  deleteEventTarget: (targetType: string, targetName: string) =>
    createAdminApiClient().delete(`/target/${encodeURIComponent(targetType)}/${encodeURIComponent(targetName)}/reset`),
  getEventTargetArnList: () => createAdminApiClient().get("/target/arns"),
};

export const tiersRepository = {
  addTiers: (data: unknown) => createAdminApiClient().put("/tier?force=false", data),
  updateTiers: (name: string, data: unknown) => createAdminApiClient().post(`/tier/${encodeURIComponent(name)}`, data),
  listTiers: () => createAdminApiClient().get("/tier"),
  removeTiers: (name: string) => createAdminApiClient().delete(`/tier/${encodeURIComponent(name)}?force=true`),
};

export const sseRepository = {
  getKMSStatus: () => createAdminApiClient().get("/kms/service-status"),
  configureKMS: (data: unknown) => createAdminApiClient().post("/kms/configure", data),
  startKMS: () => createAdminApiClient().post("/kms/start", {}),
  stopKMS: () => createAdminApiClient().post("/kms/stop", {}),
  reconfigureKMS: (data: unknown) => createAdminApiClient().post("/kms/reconfigure", data),
  getConfiguration: () => createAdminApiClient().get("/kms/config"),
  clearCache: () => createAdminApiClient().post("/kms/clear-cache", {}),
  getDetailedStatus: () => createAdminApiClient().get("/kms/status"),
  createKey: (data: unknown) => createAdminApiClient().post("/kms/keys", data),
  getKeyDetails: (keyId: string) => createAdminApiClient().get(`/kms/keys/${encodeURIComponent(keyId)}`),
  getKeyList: (params?: { limit?: number; marker?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.marker) query.append("marker", params.marker);
    const suffix = query.toString() ? `?${query}` : "";
    return createAdminApiClient().get(`/kms/keys${suffix}`);
  },
  deleteKey: (keyId: string, forceImmediate = false) => {
    const query = new URLSearchParams({ keyId });
    if (forceImmediate) query.append("force_immediate", "true");
    return createAdminApiClient().delete(`/kms/keys/delete?${query.toString()}`);
  },
  cancelKeyDeletion: (keyId: string) => createAdminApiClient().post("/kms/keys/cancel-deletion", { key_id: keyId }),
  generateDataKey: (data: unknown) => createAdminApiClient().post("/kms/generate-data-key", data),
};

export const iamExportRepository = {
  async exportIamConfig(): Promise<Blob> {
    const response = await createAdminApiClient().request("/export-iam", { method: "GET", headers: { Accept: "application/zip" } }, false);
    return response.blob();
  },
  importIamConfig: (file: File) =>
    createAdminApiClient().request("/import-iam", { method: "PUT", body: file, headers: { "Content-Type": "application/zip" } }, false),
};

export const poolsRepository = {
  getPoolsList: () => createAdminApiClient().get("/pools/list"),
  getPoolsStatus: () => createAdminApiClient().get("/pools/status"),
  offlinePool: (pool: string) => createAdminApiClient().post("/pools/decommission", { pool }),
  cancelOfflinePool: (pool: string) => createAdminApiClient().post("/pools/cancel", { pool }),
};
