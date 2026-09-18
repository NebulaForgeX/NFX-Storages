import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { FileKey } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import {
  useClearKmsCache,
  useConfigureKms,
  useCreateKmsKey,
  useDeleteKmsKey,
  useKmsKeys,
  useKmsStatus,
  useStartKms,
  useStopKms,
} from "@/hooks/storages";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function SsePage() {
  const { t } = useTranslation("common");
  const { data: status } = useKmsStatus();
  const { data: keys = [] } = useKmsKeys();
  const startKms = useStartKms();
  const stopKms = useStopKms();
  const createKey = useCreateKmsKey();
  const deleteKey = useDeleteKmsKey();
  const configureKms = useConfigureKms();
  const clearCache = useClearKmsCache();
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState('{"backend":"local"}');
  const [error, setError] = useState("");

  const create = async () => {
    try {
      await createKey.mutateAsync(description);
      setDescription("");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveConfig = async () => {
    try {
      await configureKms.mutateAsync(JSON.parse(config) as unknown);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (keyId: string) => {
    if (!window.confirm(t("Are you sure you want to delete this key?"))) return;
    try {
      await deleteKey.mutateAsync(keyId);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={FileKey}
        title={t("Server-Side Encryption (SSE) Configuration")}
        description={t("Configure server-side encryption for your objects using external key management services.")}
        actions={
          <Flex gap="2" wrap="wrap">
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
          </Flex>
        }
      />
      <Text as="p" mb="4">
        {t("Status")}: {JSON.stringify(status ?? {})}
      </Text>
      <Flex direction="column" gap="2" mb="4" maxWidth="640px">
        <TextArea value={config} onChange={(e) => setConfig(e.target.value)} rows={5} />
        <Button onClick={() => void saveConfig()}>{t("Save")}</Button>
      </Flex>
      <Flex gap="2" wrap="wrap" mb="4">
        <TextField.Root value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Description")} />
        <Button onClick={() => void create()}>{t("Create Key")}</Button>
      </Flex>
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        empty={t("No Data")}
        rows={keys}
        rowKey={(row) => String(row.key_id ?? row.KeyId ?? JSON.stringify(row))}
        columns={[
          {
            key: "key_id",
            header: t("Key"),
            render: (row) => String(row.key_id ?? row.KeyId ?? "-"),
          },
          { key: "description", header: t("Description") },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button
                size="1"
                color="red"
                variant="outline"
                onClick={() => void remove(String(row.key_id ?? row.KeyId ?? ""))}
              >
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
