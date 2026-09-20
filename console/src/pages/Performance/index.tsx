import { CpuIcon, GaugeIcon, RouterIcon } from "nfx-ui/icons";
import { useTranslation } from "react-i18next";

import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { CardHeader, PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { usePerformance } from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { niceBytes } from "@/utils/functions";

export default function PerformancePage() {
  const { t } = useTranslation("common");
  const { data } = usePerformance();
  const used = Number((data?.usage as { total_used_capacity?: number } | null)?.total_used_capacity ?? 0);

  return (
    <PageFrame>
      <PageHeader
        icon={GaugeIcon}
        title={t("Server Information")}
        actions={
          <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.PERFORMANCE)}>
            {t("Sync")}
          </Button>
        }
      />
      <Flex direction="column" gap="4">
        <Card>
          <CardHeader icon={<CpuIcon size={18} />} title={t("Used Capacity")} />
          <Text size="6">{niceBytes(String(used))}</Text>
        </Card>
        <Card>
          <CardHeader icon={<RouterIcon size={18} />} title={t("Server Information")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.info ?? {}, null, 2)}</pre>
        </Card>
        <Card>
          <CardHeader icon={<GaugeIcon size={18} />} title={t("Backend")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data?.storage ?? {}, null, 2)}</pre>
        </Card>
      </Flex>
    </PageFrame>
  );
}
