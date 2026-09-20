import { Stack3Icon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Select, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateEventTarget, useDeleteEventTarget, useEventsTarget } from "@/hooks";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { showConfirm, showError } from "@/stores/modal";

export default function EventsTargetPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useEventsTarget();
  const deleteTarget = useDeleteEventTarget();
  const createTarget = useCreateEventTarget();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("sqs");
  const [name, setName] = useState("");

  const rows = useMemo(
    () => data.filter((row) => row.account_id.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      await createTarget.mutateAsync({ type, name });
      setName("");
      setOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={Stack3Icon} title={t("Event Destinations")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search")}>
        <Button onClick={() => setOpen(true)}>{t("Add Event Destination")}</Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Destinations")}
        emptyIcon={Stack3Icon}
        rows={rows}
        rowKey={(row) => `${row.service}-${row.account_id}`}
        columns={[
          { key: "account_id", header: t("Event Destinations") },
          { key: "service", header: t("Type") },
          { key: "status", header: t("Status") },
        ]}
        actions={(row) => [
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete this destination?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deleteTarget.mutateAsync(row).catch((err) => {
                    showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
                  });
                },
              }),
          },
        ]}
      />
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Add Event Destination")}
        submitLabel={t("Add Event Destination")}
        cancelLabel={t("Cancel")}
        submitting={createTarget.isPending}
        onSubmit={create}
      >
        <Select.Root value={type} onValueChange={setType}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="sqs">SQS</Select.Item>
            <Select.Item value="amqp">AMQP</Select.Item>
            <Select.Item value="webhook">Webhook</Select.Item>
          </Select.Content>
        </Select.Root>
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
      </FormDialog>
    </PageFrame>
  );
}
