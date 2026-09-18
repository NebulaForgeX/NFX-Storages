import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Users } from "@/assets/icons/lucide";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { AccessKeyStatusEnum } from "@/enums";
import {
  useAssignUserPolicy,
  useChangeUserStatus,
  useCreateUser,
  useCreateUserAccessKey,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserGroups,
  useUsers,
} from "@/hooks";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function UsersPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const changeStatus = useChangeUserStatus();
  const assignPolicy = useAssignUserPolicy();
  const updateGroups = useUpdateUserGroups();
  const createUserKey = useCreateUserAccessKey();
  const updateUser = useUpdateUser();
  const [search, setSearch] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [groups, setGroups] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.accessKey.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createUser.mutateAsync({ accessKey, secretKey });
      setAccessKey("");
      setSecretKey("");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(t("Are you sure you want to delete all selected users?"))) return;
    try {
      await deleteUser.mutateAsync(name);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const toggle = async (name: string, status?: string) => {
    const next = status === AccessKeyStatusEnum.ENABLED ? AccessKeyStatusEnum.DISABLED : AccessKeyStatusEnum.ENABLED;
    try {
      await changeStatus.mutateAsync({ name, status: next });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const assign = async (name: string) => {
    if (!policyName) return;
    try {
      await assignPolicy.mutateAsync({ user: name, policyName });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveGroups = async (name: string) => {
    try {
      await updateGroups.mutateAsync({
        name,
        groups: groups.split(",").map((item) => item.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const createKey = async (name: string) => {
    try {
      await createUserKey.mutateAsync(name);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveUser = async (name: string) => {
    try {
      await updateUser.mutateAsync({ accessKey: name, name: displayName, description });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Users}
        title={t("Users")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search Access User")} />
            <TextField.Root value={accessKey} onChange={(e) => setAccessKey(e.target.value)} placeholder={t("Access Key")} />
            <TextField.Root type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder={t("Key")} />
            <TextField.Root value={policyName} onChange={(e) => setPolicyName(e.target.value)} placeholder={t("Assign Policy")} />
            <TextField.Root value={groups} onChange={(e) => setGroups(e.target.value)} placeholder={t("User Groups")} />
            <TextField.Root value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("Display Name")} />
            <TextField.Root value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Description")} />
            <Button onClick={() => void create()}>{t("Add User")}</Button>
          </Flex>
        }
      />
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={rows}
        rowKey={(row) => row.accessKey}
        columns={[
          { key: "accessKey", header: t("Name") },
          {
            key: "displayName",
            header: t("Display Name"),
            render: (row) => String((row as { name?: string }).name ?? "-"),
          },
          { key: "status", header: t("Status") },
          {
            key: "policyName",
            header: t("IAM Policies"),
            render: (row) => String((row as { policyName?: string }).policyName ?? "-"),
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Flex gap="2">
                <Button size="1" variant="outline" onClick={() => void toggle(row.accessKey, row.status)}>
                  {row.status === AccessKeyStatusEnum.ENABLED ? t("Disabled") : t("Enabled")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void assign(row.accessKey)}>
                  {t("Assign Policy")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void saveGroups(row.accessKey)}>
                  {t("Add to Group")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void createKey(row.accessKey)}>
                  {t("Add Access Key")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void saveUser(row.accessKey)}>
                  {t("Save")}
                </Button>
                <Button size="1" color="red" variant="outline" onClick={() => void remove(row.accessKey)}>
                  {t("Delete")}
                </Button>
              </Flex>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
