import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Archive } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { bucketRepository, systemRepository } from "@/apis/repositories";
import { DataTable } from "@/components/DataTable";
import { niceBytes } from "@/utils/functions";

export default function BrowserPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["buckets"],
    queryFn: async () => {
      const response = await bucketRepository.listBuckets();
      let usage: Record<string, { objects_count?: number; size?: number }> = {};
      try {
        const usageInfo = await systemRepository.getDataUsageInfo();
        usage = (usageInfo?.buckets_usage ?? {}) as typeof usage;
      } catch {
        usage = {};
      }
      return (response.Buckets ?? [])
        .filter((item): item is { Name: string; CreationDate?: Date } => Boolean(item.Name))
        .map((item) => ({
          Name: item.Name,
          CreationDate: item.CreationDate ? new Date(item.CreationDate).toISOString() : "",
          Count: usage[item.Name]?.objects_count ?? 0,
          Size: niceBytes(String(usage[item.Name]?.size ?? 0)),
        }))
        .sort((a, b) => a.Name.localeCompare(b.Name));
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.Name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const createBucket = async () => {
    if (!newName.trim()) return;
    try {
      await bucketRepository.createBucket({ Bucket: newName.trim() });
      setNewName("");
      await queryClient.invalidateQueries({ queryKey: ["buckets"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Create Failed"));
    }
  };

  const removeBucket = async (name: string) => {
    if (!window.confirm(t("Are you sure you want to delete this bucket?"))) return;
    try {
      await bucketRepository.deleteBucket(name);
      await queryClient.invalidateQueries({ queryKey: ["buckets"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Archive}
        title={t("Buckets")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search")} />
            <TextField.Root value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("Create Bucket")} />
            <Button onClick={() => void createBucket()}>{t("Create Bucket")}</Button>
            <Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: ["buckets"] })}>
              {t("Refresh")}
            </Button>
          </Flex>
        }
      />
      {error ? (
        <Text color="red" size="2">
          {error}
        </Text>
      ) : null}
      <DataTable
        loading={isLoading}
        empty={t("No Buckets")}
        rows={rows}
        rowKey={(row) => row.Name}
        columns={[
          {
            key: "Name",
            header: t("Bucket"),
            render: (row) => (
              <Button variant="ghost" onClick={() => navigate(`/browser/${encodeURIComponent(row.Name)}`)}>
                {row.Name}
              </Button>
            ),
          },
          { key: "CreationDate", header: t("Creation Date") },
          { key: "Count", header: t("Object Count") },
          { key: "Size", header: t("Size") },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Flex gap="2">
                <Button size="1" variant="outline" onClick={() => navigate(`/buckets/${encodeURIComponent(row.Name)}`)}>
                  {t("Settings")}
                </Button>
                <Button size="1" color="red" variant="outline" onClick={() => void removeBucket(row.Name)}>
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
