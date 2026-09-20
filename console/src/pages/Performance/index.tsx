import { GaugeIcon } from "nfx-ui/icons";
import { useTranslation } from "react-i18next";

import { Button, Heading } from "@radix-ui/themes";
import { DataTable, PageHeader, PropertyList, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { usePerformance } from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { niceBytes } from "@/utils/functions";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export default function PerformancePage() {
  const { t } = useTranslation("common");
  const { data } = usePerformance();
  const usage = asRecord(data?.usage);
  const info = asRecord(data?.info);
  const metrics = asRecord(data?.metrics);
  const disks = data?.storage?.disks ?? [];
  const used = Number(usage.total_used_capacity ?? usage.objectsTotalSize ?? metrics.bytes ?? 0);

  return (
    <PageFrame>
      <PageHeader icon={GaugeIcon} title={t("Server Information")} />
      <Toolbar>
        <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.PERFORMANCE)}>
          {t("Sync")}
        </Button>
      </Toolbar>
      <PropertyList
        items={[
          { label: t("Used Capacity"), value: niceBytes(String(used)) },
          { label: t("Buckets"), value: String(metrics.buckets ?? usage.bucketsCount ?? "-") },
          { label: t("Object Count"), value: String(metrics.objects ?? usage.objectsCount ?? "-") },
          { label: t("Mode"), value: String(info.mode ?? "-") },
          { label: t("Region"), value: String(info.region ?? "-") },
          { label: t("Deployment ID"), value: String(info.deploymentID ?? "-") },
          { label: t("Runtime"), value: String(info.runtime ?? "-") },
        ]}
      />
      <Heading as="h2" size="3" mt="4" mb="2">
        {t("Disks")}
      </Heading>
      <DataTable
        empty={t("No Data")}
        emptyIcon={GaugeIcon}
        rows={disks}
        rowKey={(row) => String(row.path ?? JSON.stringify(row))}
        columns={[
          { key: "path", header: t("Name"), render: (row) => String(row.path ?? "-") },
          { key: "exists", header: t("Status"), render: (row) => (row.exists ? t("Available") : t("Disabled")) },
          { key: "dir", header: t("Type"), render: (row) => (row.dir ? t("Folder") : "-") },
        ]}
      />
    </PageFrame>
  );
}
