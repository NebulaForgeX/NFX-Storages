import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Select, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, Toolbar } from "@/components";
import { useBucketEvents, useEventTargetArns, useSaveBucketNotifications } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

const EVENT_TYPES = ["s3:ObjectCreated:*", "s3:ObjectCreated:Put", "s3:ObjectRemoved:*", "s3:ObjectRemoved:Delete"];

export function EventsPanel({ bucket }: { bucket: string }) {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useBucketEvents(bucket);
  const { data: arns = [] } = useEventTargetArns();
  const save = useSaveBucketNotifications();
  const [open, setOpen] = useState(false);
  const [arn, setArn] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [kind, setKind] = useState("SQS");

  const add = async () => {
    if (!bucket || !arn) return;
    try {
      await save.mutateAsync({
        bucket,
        items: [...data, { id: `evt-${Date.now()}`, type: kind, arn, events: [eventType] }],
      });
      setArn("");
      setOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = (id: string) => {
    showConfirm({
      title: t("Delete"),
      message: t("Are you sure you want to delete this notification configuration?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: () => {
        void save.mutateAsync({ bucket, items: data.filter((item) => item.id !== id) }).catch((err) => {
          showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
        });
      },
    });
  };

  return (
    <>
      <Toolbar>
        <Button disabled={!bucket} onClick={() => setOpen(true)}>
          {t("Add Event Subscription")}
        </Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={data}
        rowKey={(row) => row.id}
        columns={[
          { key: "type", header: t("Type") },
          { key: "arn", header: t("ARN") },
          { key: "events", header: t("Events"), render: (row) => row.events.join(", ") },
        ]}
        actions={(row) => [{ label: t("Delete"), color: "red", onSelect: () => remove(row.id) }]}
      />
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Add Event Subscription")}
        submitLabel={t("Add")}
        cancelLabel={t("Cancel")}
        submitting={save.isPending}
        onSubmit={add}
      >
        <Select.Root value={kind} onValueChange={setKind}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="SQS">SQS</Select.Item>
            <Select.Item value="SNS">SNS</Select.Item>
            <Select.Item value="Lambda">Lambda</Select.Item>
          </Select.Content>
        </Select.Root>
        <Select.Root value={eventType} onValueChange={setEventType}>
          <Select.Trigger />
          <Select.Content>
            {EVENT_TYPES.map((item) => (
              <Select.Item key={item} value={item}>
                {item}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <TextField.Root value={arn} onChange={(event) => setArn(event.target.value)} placeholder={arns[0] ?? t("ARN")} />
      </FormDialog>
    </>
  );
}
