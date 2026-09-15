import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Activity } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { systemRepository } from "@/apis/repositories";
import { niceBytes } from "@/utils/functions";

export default function PerformancePage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["performance"],
    queryFn: async () => {
      const [info, storage, usage] = await Promise.allSettled([
        systemRepository.getSystemInfo(),
        systemRepository.getStorageInfo(),
        systemRepository.getDataUsageInfo(),
      ]);
      return {
        info: info.status === "fulfilled" ? info.value : null,
        storage: storage.status === "fulfilled" ? storage.value : null,
        usage: usage.status === "fulfilled" ? usage.value : null,
      };
    },
  });

  const used = Number((data?.usage as { total_used_capacity?: number } | null)?.total_used_capacity ?? 0);

  return (
    <PageFrame>
      <PageHeader
        icon={Activity}
        title={t("Server Information")}
        actions={
          <Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: ["performance"] })}>
            {t("Sync")}
          </Button>
        }
      />
      <Flex direction="column" gap="4">
        <Heading size="4">{t("Used Capacity")}</Heading>
        <Text size="6">{niceBytes(String(used))}</Text>
        <Heading size="4">{t("Server Information")}</Heading>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.info ?? {}, null, 2)}</pre>
        <Heading size="4">{t("Backend")}</Heading>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.storage ?? {}, null, 2)}</pre>
      </Flex>
    </PageFrame>
  );
}
