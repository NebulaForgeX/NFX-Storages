import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text } from "@radix-ui/themes";
import { HardDrive } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useCancelPoolDecommission, useDecommissionPool, usePools } from "@/hooks";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";

export default function PoolsPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = usePools();
  const decommission = useDecommissionPool();
  const cancel = useCancelPoolDecommission();
  const [error, setError] = useState("");

  const offline = async (id: string) => {
    if (!window.confirm(t("Are you sure you want to decommission this pool?"))) return;
    try {
      await decommission.mutateAsync(id);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const restore = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={HardDrive}
        title={t("Storage Pools")}
        actions={
          <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.POOLS)}>
            {t("Refresh")}
          </Button>
        }
      />
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={data}
        rowKey={(row) => String(row.id ?? "pool-0")}
        columns={[
          { key: "id", header: t("Name"), render: (row) => String(row.id ?? "-") },
          { key: "status", header: t("Status"), render: (row) => String(row.status ?? "-") },
          {
            key: "disks",
            header: t("Disks"),
            render: (row) => (row.disks ?? []).join(", ") || "-",
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => {
              const id = String(row.id ?? "pool-0");
              const decommissioning = row.status === "decommissioning";
              return (
                <Flex gap="2">
                  {decommissioning ? (
                    <Button size="1" variant="outline" onClick={() => void restore(id)}>
                      {t("Cancel Decommission")}
                    </Button>
                  ) : (
                    <Button size="1" color="red" variant="outline" onClick={() => void offline(id)}>
                      {t("Decommission")}
                    </Button>
                  )}
                </Flex>
              );
            },
          },
        ]}
      />
    </PageFrame>
  );
}
