import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Bell } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { bucketRepository } from "@/apis/repositories";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";

interface NotificationItem {
  id: string;
  type: string;
  arn: string;
  events: string[];
}

export default function EventsPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState("");
  const [arn, setArn] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["events", bucket],
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await bucketRepository.listBucketNotifications(bucket);
      const items: NotificationItem[] = [];
      const push = (type: string, configs?: Array<{ Id?: string; QueueArn?: string; TopicArn?: string; LambdaFunctionArn?: string; Events?: string[] }>) => {
        for (const cfg of configs ?? []) {
          items.push({
            id: cfg.Id ?? `${type}-${cfg.QueueArn ?? cfg.TopicArn ?? cfg.LambdaFunctionArn}`,
            type,
            arn: cfg.QueueArn ?? cfg.TopicArn ?? cfg.LambdaFunctionArn ?? "",
            events: (cfg.Events ?? []).map(String),
          });
        }
      };
      push("SQS", res.QueueConfigurations as never);
      push("SNS", res.TopicConfigurations as never);
      push("Lambda", res.LambdaFunctionConfigurations as never);
      return items;
    },
  });

  const add = async () => {
    if (!bucket) return;
    try {
      await bucketRepository.putBucketNotifications(bucket, {
        QueueConfigurations: [{ Id: `queue-${Date.now()}`, QueueArn: arn, Events: ["s3:ObjectCreated:*"] }],
      });
      await queryClient.invalidateQueries({ queryKey: ["events", bucket] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
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
        <TextField.Root value={arn} onChange={(e) => setArn(e.target.value)} placeholder={t("ARN")} />
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
