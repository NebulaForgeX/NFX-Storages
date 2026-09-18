import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Database } from "@/assets/icons/lucide";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateEventTarget, useDeleteEventTarget, useEventsTarget } from "@/hooks";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

interface RowData {
  account_id: string;
  service: string;
  status: string;
}

export default function EventsTargetPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useEventsTarget();
  const deleteTarget = useDeleteEventTarget();
  const createTarget = useCreateEventTarget();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("sqs");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.account_id.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createTarget.mutateAsync({ type, name });
      setName("");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (row: RowData) => {
    if (!window.confirm(t("Are you sure you want to delete this destination?"))) return;
    try {
      await deleteTarget.mutateAsync(row);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Database}
        title={t("Event Destinations")}
        actions={
          <Flex gap="2" wrap="wrap">
            <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search")} />
            <TextField.Root value={type} onChange={(e) => setType(e.target.value)} placeholder={t("Type")} />
            <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} />
            <Button onClick={() => void create()}>{t("Add Event Destination")}</Button>
          </Flex>
        }
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
