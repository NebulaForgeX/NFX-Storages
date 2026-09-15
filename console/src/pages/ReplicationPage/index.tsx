import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Repeat } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { bucketRepository } from "@/apis/repositories";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";

interface ReplicationRule {
  ID?: string;
  Status?: string;
  Priority?: number;
  Filter?: { Prefix?: string };
  Destination?: { Bucket?: string };
}

export default function ReplicationPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState("");
  const [dest, setDest] = useState("");
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["replication", bucket],
    enabled: Boolean(bucket),
    queryFn: async () => {
      const res = await bucketRepository.getBucketReplication(bucket);
      return (res.ReplicationConfiguration?.Rules ?? []) as ReplicationRule[];
    },
  });

  const addRule = async () => {
    if (!bucket) return;
    const next = [
      ...data,
      {
        ID: `rule-${Date.now()}`,
        Status: "Enabled",
        Priority: data.length + 1,
        Filter: { Prefix: prefix },
        Destination: { Bucket: dest },
      },
    ];
    try {
      await bucketRepository.putBucketReplication(bucket, { Role: "", Rules: next });
      await queryClient.invalidateQueries({ queryKey: ["replication", bucket] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (id?: string) => {
    if (!bucket || !window.confirm(t("Are you sure you want to delete this replication rule?"))) return;
    const next = data.filter((rule) => rule.ID !== id);
    try {
      if (!next.length) await bucketRepository.deleteBucketReplication(bucket);
      else await bucketRepository.putBucketReplication(bucket, { Role: "", Rules: next });
      await queryClient.invalidateQueries({ queryKey: ["replication", bucket] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={Repeat}
        title={t("Bucket Replication")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <Flex gap="2" wrap="wrap" mb="4">
        <TextField.Root value={dest} onChange={(e) => setDest(e.target.value)} placeholder={t("Destination")} />
        <TextField.Root value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={t("Prefix")} />
        <Button onClick={() => void addRule()}>{t("Add Replication Rule")}</Button>
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
            key: "dest",
            header: t("Destination"),
            render: (row) => row.Destination?.Bucket ?? "-",
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
