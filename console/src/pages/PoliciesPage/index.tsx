import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { ShieldCheck } from "@/assets/icons/lucide";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { useAssignPolicyMulti, useAssignUserPolicy, useCreatePolicy, useDeletePolicy, usePolicies } from "@/hooks";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function PoliciesPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = usePolicies();
  const createPolicy = useCreatePolicy();
  const deletePolicy = useDeletePolicy();
  const assignPolicy = useAssignUserPolicy();
  const assignMulti = useAssignPolicyMulti();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("{}");
  const [user, setUser] = useState("");
  const [users, setUsers] = useState("");
  const [groups, setGroups] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createPolicy.mutateAsync({ name, policy: content });
      setName("");
      setContent("{}");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (policyName: string) => {
    if (!window.confirm(t("Are you sure you want to delete this policy?"))) return;
    try {
      await deletePolicy.mutateAsync(policyName);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const assign = async (policyName: string) => {
    if (!user) return;
    try {
      await assignPolicy.mutateAsync({ user, policyName });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const assignMany = async (policyName: string) => {
    const userList = users.split(",").map((item) => item.trim()).filter(Boolean);
    const groupList = groups.split(",").map((item) => item.trim()).filter(Boolean);
    if (!userList.length && !groupList.length) return;
    try {
      await assignMulti.mutateAsync({ policyName, users: userList, groups: groupList });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={ShieldCheck}
        title={t("IAM Policies")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search")} />
            <TextField.Root value={user} onChange={(e) => setUser(e.target.value)} placeholder={t("Access Key")} />
            <TextField.Root value={users} onChange={(e) => setUsers(e.target.value)} placeholder={t("Assign to Users")} />
            <TextField.Root value={groups} onChange={(e) => setGroups(e.target.value)} placeholder={t("Assign to Groups")} />
          </Flex>
        }
      />
      <Flex direction="column" gap="3" mb="4" maxWidth="640px">
        <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} />
        <TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <Button onClick={() => void create()}>{t("New Policy")}</Button>
      </Flex>
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Policies")}
        rows={rows}
        rowKey={(row) => row.name}
        columns={[
          { key: "name", header: t("Name") },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Flex gap="2">
                <Button size="1" variant="outline" onClick={() => void assign(row.name)}>
                  {t("Assign Policy")}
                </Button>
                <Button size="1" variant="outline" onClick={() => void assignMany(row.name)}>
                  {t("Assign to Users")}
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
