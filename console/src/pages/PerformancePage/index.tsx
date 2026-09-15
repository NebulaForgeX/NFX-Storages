import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { Activity, HardDrive, Server } from "lucide-react";
import { CardHeader, PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useStorageRepositories } from "@/hooks/storages";
import { niceBytes } from "@/utils/functions";

export default function PerformancePage() {
  const { system: systemRepository } = useStorageRepositories();
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
        <Card>
          <CardHeader icon={<HardDrive size={18} />} title={t("Used Capacity")} />
          <Text size="6">{niceBytes(String(used))}</Text>
        </Card>
        <Card>
          <CardHeader icon={<Server size={18} />} title={t("Server Information")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.info ?? {}, null, 2)}</pre>
        </Card>
        <Card>
          <CardHeader icon={<Activity size={18} />} title={t("Backend")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.storage ?? {}, null, 2)}</pre>
        </Card>
      </Flex>
    </PageFrame>
  );
}
