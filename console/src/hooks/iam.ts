import { useMutation, useQuery } from "@tanstack/react-query";

import { STORAGES_QUERY_KEYS } from "@/constants/storages.query.key";
import { AccessKeyStatusEnum } from "@/enums";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { useStorageRepositories } from "@/apis/repositories";

export interface CredentialResult {
  accessKey?: string;
  secretKey?: string;
  name?: string;
  status?: string;
}

export function useUsers() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.users,
    queryFn: async () => {
      const res = (await repos.users.listUsers()) as Record<string, Record<string, unknown>>;
      return Object.entries(res ?? {}).map(([name, info]) => ({
        accessKey: name,
        ...(typeof info === "object" && info ? info : {}),
      })) as Array<{ accessKey: string; status?: string; name?: string; description?: string; policyName?: string }>;
    },
  });
}

export function useCreateUser() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { accessKey: string; secretKey?: string }) =>
      repos.users.createUser({ ...body, status: AccessKeyStatusEnum.ENABLED }) as Promise<CredentialResult>,
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useDeleteUser() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.users.deleteUser(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useGroups() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.groups,
    queryFn: async () => {
      const res = (await repos.groups.listGroup()) as Array<{ name: string; status?: string; members?: string[]; policy?: string }>;
      return res ?? [];
    },
  });
}

export function useCreateGroup() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.groups.createGroup({ group: name, members: [] }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useDeleteGroup() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.groups.removeGroup(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function usePolicies() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.policies,
    queryFn: async () => {
      const res = (await repos.policies.listPolicies()) as Record<string, unknown>;
      return Object.keys(res ?? {})
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ name: key, content: res[key] }));
    },
  });
}

export function useCreatePolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; policy: string }) => repos.policies.addPolicy(body),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POLICIES),
  });
}

export function useDeletePolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.policies.removePolicy(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.POLICIES),
  });
}

export function useAccessKeys() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.accessKeys,
    queryFn: async () => {
      const res = (await repos.accessKeys.listUserServiceAccounts({})) as {
        accounts?: Array<{ accessKey: string; expiration?: string | null; name?: string; description?: string; accountStatus?: string }>;
      };
      return res.accounts ?? [];
    },
  });
}

export function useCreateAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.accessKeys.createServiceAccount({ name }) as Promise<CredentialResult>,
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

export function useDeleteAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (accessKey: string) => repos.accessKeys.deleteServiceAccount(accessKey),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

export function useTiers() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.tiers,
    queryFn: async () => ((await repos.tiers.listTiers()) ?? []) as Array<{ type: string; [key: string]: unknown }>,
  });
}

export function useCreateTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; endpoint: string }) =>
      repos.tiers.addTiers({
        type: "s3",
        s3: { name: body.name, endpoint: body.endpoint, bucket: body.name, prefix: "", region: "us-east-1", accesskey: "", secretkey: "" },
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useDeleteTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (name: string) => repos.tiers.removeTiers(name),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useUpdateTier() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; endpoint: string }) =>
      repos.tiers.updateTiers(body.name, {
        type: "s3",
        s3: { name: body.name, endpoint: body.endpoint, bucket: body.name, prefix: "", region: "us-east-1", accesskey: "", secretkey: "" },
      }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.TIERS),
  });
}

export function useEventsTarget() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: STORAGES_QUERY_KEYS.eventsTarget,
    queryFn: async () => {
      const res = (await repos.eventsTarget.getEventsTargetList()) as {
        notification_endpoints?: Array<{ account_id: string; service: string; status: string }>;
      };
      return res.notification_endpoints ?? [];
    },
  });
}

export function useDeleteEventTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (row: { service: string; account_id: string }) => repos.eventsTarget.deleteEventTarget(row.service, row.account_id),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS_TARGET),
  });
}

export function useChangeUserStatus() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; status: string }) => repos.users.changeUserStatus(body.name, { status: body.status }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useAssignUserPolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { user: string; policyName: string }) =>
      repos.policies.setUserOrGroupPolicy({ userOrGroup: body.user, policyName: body.policyName, isGroup: "false" }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useAssignGroupPolicy() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { group: string; policyName: string }) =>
      repos.policies.setUserOrGroupPolicy({ userOrGroup: body.group, policyName: body.policyName, isGroup: "true" }),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.GROUPS);
      invalidateEventEmitter.emit(invalidateEvents.POLICIES);
    },
  });
}

export function useUpdateGroupMembers() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { group: string; members: string[] }) => repos.groups.updateGroupMembers(body),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useChangeGroupStatus() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; status: string }) => repos.groups.updateGroupStatus(body.name, { status: body.status }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.GROUPS),
  });
}

export function useUpdateUserGroups() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { name: string; groups: string[] }) => repos.users.updateUserGroups(body.name, { groups: body.groups }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useCreateUserAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (user: string) => repos.users.createAUserServiceAccount(user, { name: user }) as Promise<CredentialResult>,
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS);
      invalidateEventEmitter.emit(invalidateEvents.USERS);
    },
  });
}

export function useUpdateAccessKey() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { accessKey: string; name: string }) => repos.accessKeys.updateServiceAccount(body.accessKey, { name: body.name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS),
  });
}

export function useCreateEventTarget() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { type: string; name: string }) => repos.eventsTarget.updateEventTarget(body.type, body.name, { name: body.name }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.EVENTS_TARGET),
  });
}

export function useEventTargetArns() {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.eventsTarget, "arns"] as const,
    queryFn: async () => ((await repos.eventsTarget.getEventTargetArnList()) ?? []) as string[],
  });
}

export function useExportIam() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: () => repos.iamExport.exportIamConfig(),
  });
}

export function useImportIam() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (file: File) => repos.iamExport.importIamConfig(file),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.USERS);
      invalidateEventEmitter.emit(invalidateEvents.GROUPS);
      invalidateEventEmitter.emit(invalidateEvents.POLICIES);
      invalidateEventEmitter.emit(invalidateEvents.ACCESS_KEYS);
    },
  });
}

export function useUpdateUser() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { accessKey: string; name: string; description: string }) =>
      repos.users.updateUser(body.accessKey, { name: body.name, description: body.description }),
    onSuccess: () => invalidateEventEmitter.emit(invalidateEvents.USERS),
  });
}

export function useAssignPolicyMulti() {
  const repos = useStorageRepositories();
  return useMutation({
    mutationFn: (body: { policyName: string; users: string[]; groups: string[] }) =>
      repos.policies.setPolicyMultiple({ policyName: body.policyName, users: body.users, groups: body.groups }),
    onSuccess: () => {
      invalidateEventEmitter.emit(invalidateEvents.USERS);
      invalidateEventEmitter.emit(invalidateEvents.GROUPS);
      invalidateEventEmitter.emit(invalidateEvents.POLICIES);
    },
  });
}

export function useUserServiceAccounts(name: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.users, name, "service-accounts"] as const,
    enabled: Boolean(name),
    queryFn: async () => {
      const res = (await repos.users.listAllUserServiceAccounts(name)) as {
        accounts?: Array<{ accessKey?: string; name?: string; accountStatus?: string }>;
      };
      return res.accounts ?? [];
    },
  });
}

export function usePolicyUsers(policyName: string) {
  const repos = useStorageRepositories();
  return useQuery({
    queryKey: [...STORAGES_QUERY_KEYS.policies, policyName, "users"] as const,
    enabled: Boolean(policyName),
    queryFn: async () => {
      const res = await repos.policies.listUsersForPolicy(policyName);
      if (Array.isArray(res)) return res as string[];
      if (res && typeof res === "object") return Object.keys(res as Record<string, unknown>);
      return [];
    },
  });
}
