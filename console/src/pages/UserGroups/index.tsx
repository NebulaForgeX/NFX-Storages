import { UsersIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { AccessKeyStatusEnum } from "@/enums";
import { useAssignGroupPolicy, useChangeGroupStatus, useCreateGroup, useDeleteGroup, useGroups, useUpdateGroupMembers } from "@/hooks";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function UserGroupsPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const updateMembers = useUpdateGroupMembers();
  const assignPolicy = useAssignGroupPolicy();
  const changeStatus = useChangeGroupStatus();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [members, setMembers] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createGroup.mutateAsync(name);
      setName("");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (groupName: string) => {
    if (!window.confirm(t("Are you sure you want to delete all selected user groups?"))) return;
    try {
      await deleteGroup.mutateAsync(groupName);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const saveMembers = async (groupName: string) => {
    try {
      await updateMembers.mutateAsync({
        group: groupName,
        members: members.split(",").map((item) => item.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const assign = async (groupName: string) => {
    if (!policyName) return;
    try {
      await assignPolicy.mutateAsync({ group: groupName, policyName });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const toggle = async (groupName: string, status?: string) => {
    const next = status === AccessKeyStatusEnum.ENABLED ? AccessKeyStatusEnum.DISABLED : AccessKeyStatusEnum.ENABLED;
    try {
      await changeStatus.mutateAsync({ name: groupName, status: next });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={UsersIcon}
        title={t("User Groups")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search User Group")} />
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Add User Group")} />
            <TextField.Root value={members} onChange={(e) => setMembers(e.target.value)} placeholder={t("Members")} />
            <TextField.Root value={policyName} onChange={(e) => setPolicyName(e.target.value)} placeholder={t("Assign Policy")} />
            <Button onClick={() => void create()}>{t("Add User Group")}</Button>
          </Flex>
        }
      />
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={rows}
        rowKey={(row) => row.name}
        columns={[
          { key: "name", header: t("Name") },
          { key: "status", header: t("Status") },
          {
            key: "members",
            header: t("Members"),
            render: (row) => (row.members ?? []).join(", ") || "-",
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Flex gap="2">
                <Button size="1" variant="outline" onClick={() => void toggle(row.name, row.status)}>
                  {row.status === AccessKeyStatusEnum.ENABLED ? t("Disabled") : t("Enabled")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void saveMembers(row.name)}>
                  {t("Add group members")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void assign(row.name)}>
                  {t("Assign Policy")}
                </Button>
                <Button size="1" color="red" variant="outline" onClick={() => void remove(row.name)}>
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
