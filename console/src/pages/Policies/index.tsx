import { ShieldCheck } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Heading, Text, TextArea, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useAssignPolicyMulti, useCreatePolicy, useDeletePolicy, usePolicies, usePolicyUsers } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

function stringifyPolicy(content: unknown) {
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content ?? "");
  }
}

export default function PoliciesPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = usePolicies();
  const createPolicy = useCreatePolicy();
  const deletePolicy = useDeletePolicy();
  const assignMulti = useAssignPolicyMulti();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": []\n}");
  const [users, setUsers] = useState("");
  const [groups, setGroups] = useState("");
  const selectedPolicy = data.find((row) => row.name === selected);
  const { data: boundUsers = [] } = usePolicyUsers(selected);

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createPolicy.mutateAsync({ name, policy: content });
      setName("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const assign = async () => {
    if (!selected) return;
    try {
      await assignMulti.mutateAsync({
        policyName: selected,
        users: users.split(",").map((item) => item.trim()).filter(Boolean),
        groups: groups.split(",").map((item) => item.trim()).filter(Boolean),
      });
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={ShieldCheck} title={t("IAM Policies")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search")}>
        <Button onClick={() => setCreateOpen(true)}>{t("New Policy")}</Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Policies")}
        emptyIcon={ShieldCheck}
        rows={rows}
        rowKey={(row) => row.name}
        selectedKey={selected}
        onRowClick={(row) => setSelected(row.name)}
        columns={[{ key: "name", header: t("Name") }]}
        actions={(row) => [
          { label: t("Assign Policy"), onSelect: () => setSelected(row.name) },
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete this policy?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deletePolicy.mutateAsync(row.name).catch((err) => {
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
        title={t("New Policy")}
        submitLabel={t("New Policy")}
        cancelLabel={t("Cancel")}
        submitting={createPolicy.isPending}
        onSubmit={create}
        maxWidth="640px"
      >
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
        <TextArea value={content} onChange={(event) => setContent(event.target.value)} rows={12} />
      </FormDialog>
      <FormDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected("");
        }}
        title={selected}
        cancelLabel={t("Close")}
        maxWidth="720px"
        footer={
          <Button type="button" variant="outline" onClick={() => setSelected("")}>
            {t("Close")}
          </Button>
        }
      >
        <Heading size="2">{t("Assign to Users")}</Heading>
        <TextField.Root value={users} onChange={(event) => setUsers(event.target.value)} placeholder={t("Assign to Users")} />
        <TextField.Root value={groups} onChange={(event) => setGroups(event.target.value)} placeholder={t("Assign to Groups")} />
        <Button type="button" onClick={() => void assign()}>
          {t("Assign Policy")}
        </Button>
        <Heading size="2">{t("Users")}</Heading>
        <Text size="2">{boundUsers.length ? boundUsers.join(", ") : t("No Data")}</Text>
        <Heading size="2">{t("Access Policy")}</Heading>
        <TextArea readOnly value={stringifyPolicy(selectedPolicy?.content)} rows={12} />
      </FormDialog>
    </PageFrame>
  );
}
