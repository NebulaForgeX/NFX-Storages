import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Users } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { groupsRepository } from "@/apis/repositories";
import { DataTable } from "@/components/DataTable";

export default function UserGroupsPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = (await groupsRepository.listGroup()) as string[];
      return (res ?? []).map((item) => ({ name: item }));
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await groupsRepository.createGroup({ group: name, members: [] });
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (groupName: string) => {
    if (!window.confirm(t("Are you sure you want to delete all selected user groups?"))) return;
    try {
      await groupsRepository.removeGroup(groupName);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Users}
        title={t("User Groups")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search User Group")} />
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Add User Group")} />
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
