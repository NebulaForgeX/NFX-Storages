import { UsersIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Heading, Text, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, SecretDialog, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { AccessKeyStatusEnum } from "@/enums";
import {
  useAssignUserPolicy,
  useChangeUserStatus,
  useCreateUser,
  useCreateUserAccessKey,
  useDeleteUser,
  usePolicies,
  useUpdateUser,
  useUpdateUserGroups,
  useUserServiceAccounts,
  useUsers,
  type CredentialResult,
} from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function UsersPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useUsers();
  const { data: policies = [] } = usePolicies();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const changeStatus = useChangeUserStatus();
  const assignPolicy = useAssignUserPolicy();
  const updateGroups = useUpdateUserGroups();
  const createUserKey = useCreateUserAccessKey();
  const updateUser = useUpdateUser();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [groups, setGroups] = useState("");
  const [secret, setSecret] = useState<CredentialResult | null>(null);
  const { data: userKeys = [] } = useUserServiceAccounts(editUser);

  const rows = useMemo(
    () => data.filter((row) => row.accessKey.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      const result = await createUser.mutateAsync({ accessKey, secretKey });
      setSecret(result);
      setAccessKey("");
      setSecretKey("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      await updateUser.mutateAsync({ accessKey: editUser, name: displayName, description });
      if (policyName) await assignPolicy.mutateAsync({ user: editUser, policyName });
      await updateGroups.mutateAsync({
        name: editUser,
        groups: groups.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setEditUser("");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={UsersIcon} title={t("Users")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search Access User")}>
        <Button onClick={() => setCreateOpen(true)}>{t("Add User")}</Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        emptyIcon={UsersIcon}
        rows={rows}
        rowKey={(row) => row.accessKey}
        columns={[
          { key: "accessKey", header: t("Name") },
          { key: "displayName", header: t("Display Name"), render: (row) => String(row.name ?? "-") },
          { key: "status", header: t("Status") },
          { key: "policyName", header: t("IAM Policies"), render: (row) => String(row.policyName ?? "-") },
        ]}
        actions={(row) => [
          {
            label: row.status === AccessKeyStatusEnum.ENABLED ? t("Disabled") : t("Enabled"),
            onSelect: () => {
              const next = row.status === AccessKeyStatusEnum.ENABLED ? AccessKeyStatusEnum.DISABLED : AccessKeyStatusEnum.ENABLED;
              void changeStatus.mutateAsync({ name: row.accessKey, status: next }).catch((err) => {
                showError(getStoragesApiErrorMessage(err, t("Add Failed")));
              });
            },
          },
          {
            label: t("Edit"),
            onSelect: () => {
              setEditUser(row.accessKey);
              setDisplayName(String(row.name ?? ""));
              setDescription(String((row as { description?: string }).description ?? ""));
              setPolicyName(String(row.policyName ?? ""));
              setGroups("");
            },
          },
          {
            label: t("Add Access Key"),
            onSelect: () => {
              void createUserKey.mutateAsync(row.accessKey).then((result) => setSecret(result)).catch((err) => {
                showError(getStoragesApiErrorMessage(err, t("Add Failed")));
              });
            },
          },
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete all selected users?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deleteUser.mutateAsync(row.accessKey).catch((err) => {
                    showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
                  });
                },
              }),
          },
        ]}
      />
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("Add User")}
        submitLabel={t("Add User")}
        cancelLabel={t("Cancel")}
        submitting={createUser.isPending}
        onSubmit={create}
      >
        <TextField.Root value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder={t("Access Key")} />
        <TextField.Root type="password" value={secretKey} onChange={(event) => setSecretKey(event.target.value)} placeholder={t("Secret Key")} />
      </FormDialog>
      <FormDialog
        open={Boolean(editUser)}
        onOpenChange={(open) => {
          if (!open) setEditUser("");
        }}
        title={editUser}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        onSubmit={saveEdit}
        maxWidth="560px"
      >
        <TextField.Root value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t("Display Name")} />
        <TextField.Root value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("Description")} />
        <TextField.Root value={policyName} onChange={(event) => setPolicyName(event.target.value)} placeholder={t("Assign Policy")} list="policy-names" />
        <datalist id="policy-names">
          {policies.map((policy) => (
            <option key={policy.name} value={policy.name} />
          ))}
        </datalist>
        <TextField.Root value={groups} onChange={(event) => setGroups(event.target.value)} placeholder={t("User Groups")} />
        <Heading size="2">{t("Access Keys")}</Heading>
        {userKeys.length ? (
          userKeys.map((item) => (
            <Text key={item.accessKey} size="2">
              {item.accessKey} {item.accountStatus ? `(${item.accountStatus})` : ""}
            </Text>
          ))
        ) : (
          <Text size="2" color="gray">
            {t("No Access Keys")}
          </Text>
        )}
      </FormDialog>
      <SecretDialog
        open={Boolean(secret)}
        onOpenChange={(open) => {
          if (!open) setSecret(null);
        }}
        title={t("Access Key")}
        description={t("This secret is shown only once")}
        fields={[
          { label: t("Access Key"), value: secret?.accessKey ?? "" },
          { label: t("Secret Key"), value: secret?.secretKey ?? "" },
        ]}
      />
    </PageFrame>
  );
}
