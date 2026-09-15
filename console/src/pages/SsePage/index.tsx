import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text } from "@radix-ui/themes";
import { FileKey } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";
import { DataTable } from "@/components/DataTable";

export default function SsePage() {
  const { sse: sseRepository } = useStorageRepositories();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["kms-status"],
    queryFn: () => sseRepository.getKMSStatus(),
  });

  const { data: keys = [] } = useQuery({
    queryKey: ["kms-keys"],
    queryFn: async () => {
      const res = (await sseRepository.getKeyList({ limit: 50 })) as { keys?: Array<{ key_id?: string; KeyId?: string; description?: string }> };
      return res.keys ?? [];
    },
  });

  return (
    <PageFrame>
      <PageHeader
        icon={FileKey}
        title={t("Server-Side Encryption (SSE) Configuration")}
        description={t("Configure server-side encryption for your objects using external key management services.")}
        actions={
          <Flex gap="2">
            <Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: ["kms-status"] })}>
              {t("Refresh")}
            </Button>
            <Button onClick={() => void sseRepository.startKMS()}>{t("Start")}</Button>
            <Button variant="outline" onClick={() => void sseRepository.stopKMS()}>
              {t("Stop")}
            </Button>
          </Flex>
        }
      />
      <Text as="p" mb="4">
        {t("Status")}: {JSON.stringify(status ?? {})}
      </Text>
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
        ]}
      />
    </PageFrame>
  );
}
