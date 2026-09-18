import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Archive } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useCreateBucket, useDeleteBucket, useBuckets } from "@/hooks/storages";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { DataTable } from "@/components/DataTable";

export default function BrowserPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { data = [], isLoading } = useBuckets();
  const createBucketMut = useCreateBucket();
  const deleteBucketMut = useDeleteBucket();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.Name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const createBucket = async () => {
    if (!newName.trim()) return;
    try {
      await createBucketMut.mutateAsync(newName.trim());
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Create Failed"));
    }
  };

  const removeBucket = async (name: string) => {
    if (!window.confirm(t("Are you sure you want to delete this bucket?"))) return;
    try {
      await deleteBucketMut.mutateAsync(name);
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
            <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.BUCKETS)}>
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
