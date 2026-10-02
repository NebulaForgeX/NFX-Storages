import { Stack3Icon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Select, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateEventTarget, useDeleteEventTarget, useEventsTarget } from "@/hooks";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { showConfirm, showError } from "@/stores/modal";

type TargetKind = "sqs" | "amqp" | "webhook";

interface TargetDraft {
  queueUrl: string;
  url: string;
  exchange: string;
  routingKey: string;
  endpoint: string;
}

const emptyDraft = (): TargetDraft => ({ queueUrl: "", url: "", exchange: "", routingKey: "", endpoint: "" });

function targetAddress(service: string, config?: Record<string, string>) {
  if (service === "sqs") return config?.queueUrl || "-";
  if (service === "amqp") return [config?.url, config?.exchange, config?.routingKey].filter(Boolean).join(" · ") || "-";
  if (service === "webhook") return config?.endpoint || "-";
  return "-";
}

export default function EventsTargetPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useEventsTarget();
  const deleteTarget = useDeleteEventTarget();
  const createTarget = useCreateEventTarget();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TargetKind>("sqs");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<TargetDraft>(emptyDraft);

  const rows = useMemo(
    () => data.filter((row) => row.account_id.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    const config: Record<string, string> = { name };
    if (type === "sqs") config.queueUrl = draft.queueUrl;
    if (type === "amqp") {
      config.url = draft.url;
      config.exchange = draft.exchange;
      config.routingKey = draft.routingKey;
    }
    if (type === "webhook") config.endpoint = draft.endpoint;
    try {
      await createTarget.mutateAsync({ type, name, config });
      setName("");
      setDraft(emptyDraft());
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
          { key: "address", header: t("Endpoint"), render: (row) => targetAddress(row.service, row.config) },
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
        <Select.Root value={type} onValueChange={(value) => setType(value as TargetKind)}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="sqs">SQS</Select.Item>
            <Select.Item value="amqp">AMQP</Select.Item>
            <Select.Item value="webhook">Webhook</Select.Item>
          </Select.Content>
        </Select.Root>
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
        {type === "sqs" ? (
          <TextField.Root value={draft.queueUrl} onChange={(event) => setDraft({ ...draft, queueUrl: event.target.value })} placeholder={t("Queue URL")} />
        ) : null}
        {type === "amqp" ? (
          <>
            <TextField.Root value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder={t("Endpoint")} />
            <TextField.Root value={draft.exchange} onChange={(event) => setDraft({ ...draft, exchange: event.target.value })} placeholder={t("Exchange")} />
            <TextField.Root value={draft.routingKey} onChange={(event) => setDraft({ ...draft, routingKey: event.target.value })} placeholder={t("Routing Key")} />
          </>
        ) : null}
        {type === "webhook" ? (
          <TextField.Root value={draft.endpoint} onChange={(event) => setDraft({ ...draft, endpoint: event.target.value })} placeholder={t("Endpoint")} />
        ) : null}
      </FormDialog>
    </PageFrame>
  );
}
