import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Bell } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useBucketEvents, useEventTargetArns, usePutBucketNotifications } from "@/hooks/storages";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function EventsPage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");
  const [arn, setArn] = useState("");
  const [error, setError] = useState("");
  const { data = [], isLoading } = useBucketEvents(bucket);
  const { data: arns = [] } = useEventTargetArns();
  const putNotifications = usePutBucketNotifications();

  const add = async () => {
    if (!bucket) return;
    try {
      await putNotifications.mutateAsync({ bucket, arn });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Bell}
        title={t("Events")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <Flex gap="2" wrap="wrap" mb="4">
        <TextField.Root value={arn} onChange={(e) => setArn(e.target.value)} placeholder={arns[0] ?? t("ARN")} />
        <Button onClick={() => void add()}>{t("Add Event Subscription")}</Button>
      </Flex>
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={data}
        rowKey={(row) => row.id}
        columns={[
          { key: "type", header: t("Type") },
          { key: "arn", header: t("ARN") },
          {
            key: "events",
            header: t("Events"),
            render: (row) => row.events.join(", "),
          },
        ]}
      />
    </PageFrame>
  );
}
