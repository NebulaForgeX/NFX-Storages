import { UsersIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { AccessKeyStatusEnum } from "@/enums";
import { useAssignGroupPolicy, useChangeGroupStatus, useCreateGroup, useDeleteGroup, useGroups, usePolicies, useUpdateGroupMembers } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function UserGroupsPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useGroups();
  const { data: policies = [] } = usePolicies();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const updateMembers = useUpdateGroupMembers();
  const assignPolicy = useAssignGroupPolicy();
  const changeStatus = useChangeGroupStatus();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [name, setName] = useState("");
  const [members, setMembers] = useState("");
  const [policyName, setPolicyName] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createGroup.mutateAsync(name);
      setName("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveEdit = async () => {
    if (!editName) return;
    try {
      await updateMembers.mutateAsync({
        group: editName,
        members: members.split(",").map((item) => item.trim()).filter(Boolean),
      });
      if (policyName) await assignPolicy.mutateAsync({ group: editName, policyName });
      setEditName("");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={UsersIcon} title={t("User Groups")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search User Group")}>
        <Button onClick={() => setCreateOpen(true)}>{t("Add User Group")}</Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        emptyIcon={UsersIcon}
        rows={rows}
        rowKey={(row) => row.name}
        columns={[
          { key: "name", header: t("Name") },
          { key: "status", header: t("Status") },
          { key: "members", header: t("Members"), render: (row) => (row.members ?? []).join(", ") || "-" },
          { key: "policy", header: t("IAM Policies"), render: (row) => row.policy ?? "-" },
        ]}
        actions={(row) => [
          {
            label: row.status === AccessKeyStatusEnum.ENABLED ? t("Disabled") : t("Enabled"),
            onSelect: () => {
              const next = row.status === AccessKeyStatusEnum.ENABLED ? AccessKeyStatusEnum.DISABLED : AccessKeyStatusEnum.ENABLED;
              void changeStatus.mutateAsync({ name: row.name, status: next }).catch((err) => {
                showError(getStoragesApiErrorMessage(err, t("Add Failed")));
              });
            },
          },
          {
            label: t("Add group members"),
            onSelect: () => {
              setEditName(row.name);
              setMembers((row.members ?? []).join(", "));
              setPolicyName(row.policy ?? "");
            },
          },
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete all selected user groups?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deleteGroup.mutateAsync(row.name).catch((err) => {
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
        title={t("Add User Group")}
        submitLabel={t("Add User Group")}
        cancelLabel={t("Cancel")}
        submitting={createGroup.isPending}
        onSubmit={create}
      >
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
      </FormDialog>
      <FormDialog
        open={Boolean(editName)}
        onOpenChange={(open) => {
          if (!open) setEditName("");
        }}
        title={editName}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        onSubmit={saveEdit}
      >
        <TextField.Root value={members} onChange={(event) => setMembers(event.target.value)} placeholder={t("Members")} />
        <TextField.Root value={policyName} onChange={(event) => setPolicyName(event.target.value)} placeholder={t("Assign Policy")} list="group-policies" />
        <datalist id="group-policies">
          {policies.map((policy) => (
            <option key={policy.name} value={policy.name} />
          ))}
        </datalist>
      </FormDialog>
    </PageFrame>
  );
}
