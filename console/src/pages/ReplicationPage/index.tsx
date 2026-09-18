import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Repeat } from "@/assets/icons/lucide";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { useDeleteRemoteTarget, useRemoteTargets, useReplication, useSaveReplication, useSetRemoteTarget } from "@/hooks";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function ReplicationPage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");
  const [dest, setDest] = useState("");
  const [prefix, setPrefix] = useState("");
  const [remoteArn, setRemoteArn] = useState("");
  const [error, setError] = useState("");
  const { data = [], isLoading } = useReplication(bucket);
  const { data: remotes = [] } = useRemoteTargets(bucket);
  const saveReplication = useSaveReplication();
  const setRemote = useSetRemoteTarget();
  const deleteRemote = useDeleteRemoteTarget();

  const addRule = async () => {
    if (!bucket) return;
    try {
      await saveReplication.mutateAsync({
        bucket,
        rules: [
          ...data,
          {
            ID: `rule-${Date.now()}`,
            Status: "Enabled",
            Priority: data.length + 1,
            Filter: { Prefix: prefix },
            Destination: { Bucket: dest },
          },
        ],
      });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (id?: string) => {
    if (!bucket || !window.confirm(t("Are you sure you want to delete this replication rule?"))) return;
    try {
      await saveReplication.mutateAsync({ bucket, rules: data.filter((rule) => rule.ID !== id) });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const addRemote = async () => {
    if (!bucket || !remoteArn) return;
    try {
      await setRemote.mutateAsync({ bucket, arn: remoteArn });
      setRemoteArn("");
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const removeRemote = async (arn: string) => {
    if (!bucket) return;
    try {
      await deleteRemote.mutateAsync({ bucket, arn });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
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
        <TextField.Root value={remoteArn} onChange={(e) => setRemoteArn(e.target.value)} placeholder={t("ARN")} />
        <Button variant="outline" onClick={() => void addRemote()}>
          {t("Add Site Replication")}
        </Button>
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
      <DataTable
        empty={t("No Data")}
        rows={remotes}
        rowKey={(row) => String(row.arn ?? row.ARN ?? JSON.stringify(row))}
        columns={[
          {
            key: "arn",
            header: t("ARN"),
            render: (row) => String(row.arn ?? row.ARN ?? "-"),
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button
                size="1"
                color="red"
                variant="outline"
                onClick={() => void removeRemote(String(row.arn ?? row.ARN ?? ""))}
              >
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
