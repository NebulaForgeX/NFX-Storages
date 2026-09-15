import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Users } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";
import { DataTable } from "@/components/DataTable";

interface UserRow {
  accessKey: string;
  status?: string;
}

export default function UsersPage() {
  const { users: usersRepository } = useStorageRepositories();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = (await usersRepository.listUsers()) as Record<string, Record<string, unknown>>;
      return Object.entries(res ?? {}).map(([name, info]) => ({
        accessKey: name,
        ...(typeof info === "object" && info ? info : {}),
      })) as UserRow[];
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.accessKey.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await usersRepository.createUser({ accessKey, secretKey, status: "enabled" });
      setAccessKey("");
      setSecretKey("");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(t("Are you sure you want to delete all selected users?"))) return;
    try {
      await usersRepository.deleteUser(name);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
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
          { key: "status", header: t("Status") },
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
