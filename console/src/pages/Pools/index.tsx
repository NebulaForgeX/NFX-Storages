import { CpuIcon } from "nfx-ui/icons";
import { useTranslation } from "react-i18next";

import { Button } from "@radix-ui/themes";
import { DataTable, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCancelPoolDecommission, useDecommissionPool, usePools } from "@/hooks";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { showConfirm, showError } from "@/stores/modal";

export default function PoolsPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = usePools();
  const decommission = useDecommissionPool();
  const cancel = useCancelPoolDecommission();

  return (
    <PageFrame>
      <PageHeader icon={CpuIcon} title={t("Storage Pools")} />
      <Toolbar>
        <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.POOLS)}>
          {t("Refresh")}
        </Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        emptyIcon={CpuIcon}
        rows={data}
        rowKey={(row) => String(row.id ?? "pool-0")}
        columns={[
          { key: "id", header: t("Name"), render: (row) => String(row.id ?? "-") },
          { key: "status", header: t("Status"), render: (row) => String(row.status ?? "-") },
          { key: "disks", header: t("Disks"), render: (row) => (row.disks ?? []).join(", ") || "-" },
        ]}
        actions={(row) => {
          const id = String(row.id ?? "pool-0");
          const decommissioning = row.status === "decommissioning";
          return decommissioning
            ? [
                {
                  label: t("Cancel Decommission"),
                  onSelect: () => {
                    void cancel.mutateAsync(id).catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))));
                  },
                },
              ]
            : [
                {
                  label: t("Decommission"),
                  color: "red",
                  onSelect: () =>
                    showConfirm({
                      title: t("Decommission"),
                      message: t("Are you sure you want to decommission this pool?"),
                      confirmText: t("Decommission"),
                      cancelText: t("Cancel"),
                      onConfirm: () => {
                        void decommission.mutateAsync(id).catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))));
                      },
                    }),
                },
              ];
        }}
      />
    </PageFrame>
  );
}
