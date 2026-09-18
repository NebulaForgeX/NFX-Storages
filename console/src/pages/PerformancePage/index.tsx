import { useTranslation } from "react-i18next";

import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { Activity, HardDrive, Server } from "lucide-react";
import { CardHeader, PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { usePerformance } from "@/hooks/storages";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { niceBytes } from "@/utils/functions";

export default function PerformancePage() {
  const { t } = useTranslation("common");
  const { data } = usePerformance();
  const used = Number((data?.usage as { total_used_capacity?: number } | null)?.total_used_capacity ?? 0);

  return (
    <PageFrame>
      <PageHeader
        icon={Activity}
        title={t("Server Information")}
        actions={
          <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.PERFORMANCE)}>
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
