import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { Layers } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { bucketRepository } from "@/apis/repositories";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";

interface LifecycleRule {
  ID?: string;
  Status?: string;
  Filter?: { Prefix?: string };
  Expiration?: { Days?: number };
}

export default function LifecyclePage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [days, setDays] = useState("30");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["lifecycle", bucket],
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await bucketRepository.getBucketLifecycleConfiguration(bucket);
      return (res.Rules ?? []) as LifecycleRule[];
    },
  });

  const addRule = async () => {
    if (!bucket) return;
    try {
      const next: LifecycleRule[] = [
        ...data,
        { ID: ruleId || `rule-${Date.now()}`, Status: "Enabled", Filter: { Prefix: prefix }, Expiration: { Days: Number(days) || 30 } },
      ];
      await bucketRepository.putBucketLifecycleConfiguration(bucket, { Rules: next });
      setRuleId("");
      await queryClient.invalidateQueries({ queryKey: ["lifecycle", bucket] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (id?: string) => {
    if (!bucket || !window.confirm(t("Are you sure you want to delete this rule?"))) return;
    const next = data.filter((rule) => rule.ID !== id);
    try {
      if (!next.length) await bucketRepository.deleteBucketLifecycle(bucket);
      else await bucketRepository.putBucketLifecycleConfiguration(bucket, { Rules: next });
      await queryClient.invalidateQueries({ queryKey: ["lifecycle", bucket] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Layers}
        title={t("Lifecycle")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <Flex gap="2" wrap="wrap" mb="4">
        <TextField.Root value={ruleId} onChange={(e) => setRuleId(e.target.value)} placeholder={t("Rule ID")} />
        <TextField.Root value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={t("Prefix")} />
        <TextField.Root value={days} onChange={(e) => setDays(e.target.value)} placeholder={t("Days")} />
        <Button onClick={() => void addRule()}>{t("Add Lifecycle Rule")}</Button>
        <TextArea value={JSON.stringify(data, null, 2)} readOnly rows={6} style={{ width: "100%" }} />
      </Flex>
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={data}
        rowKey={(row) => row.ID ?? JSON.stringify(row)}
        columns={[
          { key: "ID", header: t("Rule ID") },
          { key: "Status", header: t("Status") },
          {
            key: "prefix",
            header: t("Prefix"),
            render: (row) => row.Filter?.Prefix ?? "-",
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button size="1" color="red" variant="outline" onClick={() => void remove(row.ID)}>
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
