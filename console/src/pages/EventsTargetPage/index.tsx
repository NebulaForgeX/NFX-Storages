import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Text, TextField } from "@radix-ui/themes";
import { Database } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { eventsTargetRepository } from "@/apis/repositories";
import { DataTable } from "@/components/DataTable";

interface RowData {
  account_id: string;
  service: string;
  status: string;
}

export default function EventsTargetPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["events-target"],
    queryFn: async () => {
      const res = (await eventsTargetRepository.getEventsTargetList()) as { notification_endpoints?: RowData[] };
      return res.notification_endpoints ?? [];
    },
  });

  const rows = useMemo(
    () => data.filter((row) => row.account_id.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const remove = async (row: RowData) => {
    if (!window.confirm(t("Are you sure you want to delete this destination?"))) return;
    try {
      await eventsTargetRepository.deleteEventTarget(row.service, row.account_id);
      await queryClient.invalidateQueries({ queryKey: ["events-target"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Database}
        title={t("Event Destinations")}
        actions={<TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search")} />}
      />
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Destinations")}
        rows={rows}
        rowKey={(row) => `${row.service}-${row.account_id}`}
        columns={[
          { key: "account_id", header: t("Event Destinations") },
          { key: "service", header: t("Type") },
          { key: "status", header: t("Status") },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button size="1" color="red" variant="outline" onClick={() => void remove(row)}>
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
