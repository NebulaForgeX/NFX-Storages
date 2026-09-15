import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { ShieldCheck } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";
import { DataTable } from "@/components/DataTable";

export default function PoliciesPage() {
  const { policies: policiesRepository } = useStorageRepositories();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("{}");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const res = (await policiesRepository.listPolicies()) as Record<string, unknown>;
      return Object.keys(res ?? {})
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ name: key, content: res[key] }));
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await policiesRepository.addPolicy({ name, policy: content });
      setName("");
      setContent("{}");
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (policyName: string) => {
    if (!window.confirm(t("Are you sure you want to delete this policy?"))) return;
    try {
      await policiesRepository.removePolicy(policyName);
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
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
              <Button size="1" color="red" variant="outline" onClick={() => void remove(row.name)}>
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
