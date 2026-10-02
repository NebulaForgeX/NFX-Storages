import { StackIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button, Text, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateBucket, useDeleteBucket, useBuckets } from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function BrowserPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { data = [], isLoading } = useBuckets();
  const createBucketMut = useCreateBucket();
  const deleteBucketMut = useDeleteBucket();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.Name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const createBucket = async () => {
    if (!newName.trim()) return;
    try {
      await createBucketMut.mutateAsync(newName.trim());
      setNewName("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Create Failed")));
    }
  };

  const removeBucket = (name: string) => {
    showConfirm({
      title: t("Delete"),
      message: t("Are you sure you want to delete this bucket?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: () => {
        void deleteBucketMut.mutateAsync(name).catch((err) => {
          showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
        });
      },
    });
  };

  return (
    <PageFrame>
      <PageHeader icon={StackIcon} title={t("Buckets")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search")}>
        <Button onClick={() => setCreateOpen(true)}>{t("Create Bucket")}</Button>
        <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.BUCKETS)}>
          {t("Refresh")}
        </Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Buckets")}
        emptyIcon={StackIcon}
        rows={rows}
        rowKey={(row) => row.Name}
        onRowClick={(row) => navigate(`/browser/${encodeURIComponent(row.Name)}`)}
        columns={[
          {
            key: "Name",
            header: t("Bucket"),
            render: (row) => <Text weight="medium">{row.Name}</Text>,
          },
          { key: "CreationDate", header: t("Creation Date") },
          { key: "Count", header: t("Object Count") },
          { key: "Size", header: t("Size") },
        ]}
        actions={(row) => [
          { label: t("Open"), onSelect: () => navigate(`/browser/${encodeURIComponent(row.Name)}`) },
          { label: t("Settings"), onSelect: () => navigate(`/buckets/${encodeURIComponent(row.Name)}`) },
          { label: t("Delete"), color: "red", onSelect: () => removeBucket(row.Name) },
        ]}
      />
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("Create Bucket")}
        submitLabel={t("Create Bucket")}
        cancelLabel={t("Cancel")}
        submitting={createBucketMut.isPending}
        onSubmit={createBucket}
      >
        <TextField.Root
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={t("Bucket")}
          autoFocus
        />
      </FormDialog>
    </PageFrame>
  );
}
