import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { KeyRound } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";
import { DataTable } from "@/components/DataTable";

interface AccessKeyRow {
  accessKey: string;
  expiration?: string | null;
  name?: string;
  description?: string;
  accountStatus?: string;
}

export default function AccessKeysPage() {
  const { accessKeys: accessKeysRepository } = useStorageRepositories();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["access-keys"],
    queryFn: async () => {
      const res = (await accessKeysRepository.listUserServiceAccounts({})) as { accounts?: AccessKeyRow[] };
      return res.accounts ?? [];
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.accessKey.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await accessKeysRepository.createServiceAccount({ name });
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["access-keys"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (accessKey: string) => {
    if (!window.confirm(t("Are you sure you want to delete this key?"))) return;
    try {
      await accessKeysRepository.deleteServiceAccount(accessKey);
      await queryClient.invalidateQueries({ queryKey: ["access-keys"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={KeyRound}
        title={t("Access Keys")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search Access Key")} />
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} />
            <Button onClick={() => void create()}>{t("Add Access Key")}</Button>
          </Flex>
        }
      />
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Access Keys")}
        rows={rows}
        rowKey={(row) => row.accessKey}
        columns={[
          { key: "accessKey", header: t("Access Key") },
          { key: "name", header: t("Name") },
          { key: "accountStatus", header: t("Status") },
          { key: "expiration", header: t("Expiration") },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button size="1" color="red" variant="outline" onClick={() => void remove(row.accessKey)}>
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
