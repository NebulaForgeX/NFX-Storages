import { LockIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Select, Text, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, PropertyList, SecretDialog, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import {
  useCancelKmsKeyDeletion,
  useClearKmsCache,
  useConfigureKms,
  useCreateKmsKey,
  useDeleteKmsKey,
  useGenerateKmsDataKey,
  useKmsConfig,
  useKmsKeyDetails,
  useKmsKeys,
  useKmsStatus,
  useStartKms,
  useStopKms,
} from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function keyIdOf(row: { key_id?: string; KeyId?: string }) {
  return String(row.key_id ?? row.KeyId ?? "");
}

export default function SsePage() {
  const { t } = useTranslation("common");
  const { data: status } = useKmsStatus();
  const { data: config } = useKmsConfig();
  const { data: keys = [] } = useKmsKeys();
  const startKms = useStartKms();
  const stopKms = useStopKms();
  const createKey = useCreateKmsKey();
  const deleteKey = useDeleteKmsKey();
  const configureKms = useConfigureKms();
  const clearCache = useClearKmsCache();
  const cancelDeletion = useCancelKmsKeyDeletion();
  const generateDataKey = useGenerateKmsDataKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [backend, setBackend] = useState("local");
  const [detailId, setDetailId] = useState("");
  const [dataKey, setDataKey] = useState<Record<string, unknown> | null>(null);
  const { data: details } = useKmsKeyDetails(detailId);
  const statusRow = asRecord(status);
  const configRow = asRecord(config);

  const create = async () => {
    try {
      await createKey.mutateAsync(description);
      setDescription("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveConfig = async () => {
    try {
      await configureKms.mutateAsync({ backend });
      setConfigOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={LockIcon} title={t("Server-Side Encryption (SSE) Configuration")} />
      <Toolbar>
        <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.KMS)}>
          {t("Refresh")}
        </Button>
        <Button variant="outline" onClick={() => void clearCache.mutate()}>
          {t("Clear Cache")}
        </Button>
        <Button onClick={() => void startKms.mutate()}>{t("Start")}</Button>
        <Button variant="outline" onClick={() => void stopKms.mutate()}>
          {t("Stop")}
        </Button>
        <Button variant="outline" onClick={() => setConfigOpen(true)}>
          {t("Configure")}
        </Button>
        <Button onClick={() => setCreateOpen(true)}>{t("Create Key")}</Button>
      </Toolbar>
      <PropertyList
        items={[
          { label: t("Status"), value: String(statusRow.status ?? statusRow.state ?? JSON.stringify(statusRow.status ?? "-")) },
          { label: t("Backend"), value: String(configRow.backend ?? statusRow.backend ?? "-") },
        ]}
      />
      <DataTable
        empty={t("No Data")}
        emptyIcon={LockIcon}
        rows={keys}
        rowKey={(row) => keyIdOf(row)}
        columns={[
          { key: "key_id", header: t("Key"), render: (row) => keyIdOf(row) || "-" },
          { key: "description", header: t("Description") },
          { key: "status", header: t("Status"), render: (row) => String(row.status ?? "-") },
        ]}
        actions={(row) => {
          const keyId = keyIdOf(row);
          return [
            { label: t("Key Details"), onSelect: () => setDetailId(keyId) },
            {
              label: t("Generate Data Key"),
              onSelect: () => {
                void generateDataKey
                  .mutateAsync(keyId)
                  .then((result) => setDataKey(asRecord(result)))
                  .catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))));
              },
            },
            ...(row.status === "pending-deletion"
              ? [
                  {
                    label: t("Cancel Deletion"),
                    onSelect: () => {
                      void cancelDeletion.mutateAsync(keyId).catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))));
                    },
                  },
                ]
              : []),
            {
              label: t("Delete"),
              color: "red" as const,
              onSelect: () =>
                showConfirm({
                  title: t("Delete"),
                  message: t("Are you sure you want to delete this key?"),
                  confirmText: t("Delete"),
                  cancelText: t("Cancel"),
                  onConfirm: () => {
                    void deleteKey.mutateAsync(keyId).catch((err) => showError(getStoragesApiErrorMessage(err, t("Delete Failed"))));
                  },
                }),
            },
          ];
        }}
      />
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("Create Key")}
        submitLabel={t("Create Key")}
        cancelLabel={t("Cancel")}
        submitting={createKey.isPending}
        onSubmit={create}
      >
        <TextField.Root value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("Description")} />
      </FormDialog>
      <FormDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        title={t("Configure")}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        submitting={configureKms.isPending}
        onSubmit={saveConfig}
      >
        <Select.Root value={backend} onValueChange={setBackend}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="local">local</Select.Item>
          </Select.Content>
        </Select.Root>
      </FormDialog>
      <FormDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId("");
        }}
        title={t("Key Details")}
        cancelLabel={t("Close")}
        footer={
          <Button type="button" variant="outline" onClick={() => setDetailId("")}>
            {t("Close")}
          </Button>
        }
      >
        <PropertyList
          items={Object.entries(asRecord(details)).map(([label, value]) => ({
            label,
            value: typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value),
          }))}
        />
        {!details ? <Text color="gray">{t("Loading")}</Text> : null}
      </FormDialog>
      <SecretDialog
        open={Boolean(dataKey)}
        onOpenChange={(open) => {
          if (!open) setDataKey(null);
        }}
        title={t("Generate Data Key")}
        description={t("This secret is shown only once")}
        fields={Object.entries(dataKey ?? {}).map(([label, value]) => ({
          label,
          value: typeof value === "string" ? value : JSON.stringify(value),
        }))}
      />
    </PageFrame>
  );
}
