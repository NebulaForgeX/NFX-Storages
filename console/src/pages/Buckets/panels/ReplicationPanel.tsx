import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Heading, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, Toolbar } from "@/components";
import { useDeleteRemoteTarget, useRemoteTargets, useReplication, useSaveReplication, useSetRemoteTarget } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export function ReplicationPanel({ bucket }: { bucket: string }) {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useReplication(bucket);
  const { data: remotes = [] } = useRemoteTargets(bucket);
  const saveReplication = useSaveReplication();
  const setRemote = useSetRemoteTarget();
  const deleteRemote = useDeleteRemoteTarget();
  const [ruleOpen, setRuleOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [dest, setDest] = useState("");
  const [prefix, setPrefix] = useState("");
  const [remoteArn, setRemoteArn] = useState("");

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
      setDest("");
      setPrefix("");
      setRuleOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const addRemote = async () => {
    if (!bucket || !remoteArn) return;
    try {
      await setRemote.mutateAsync({ bucket, arn: remoteArn });
      setRemoteArn("");
      setRemoteOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <>
      <Toolbar>
        <Button disabled={!bucket} onClick={() => setRuleOpen(true)}>
          {t("Add Replication Rule")}
        </Button>
        <Button variant="outline" disabled={!bucket} onClick={() => setRemoteOpen(true)}>
          {t("Add Site Replication")}
        </Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Data")}
        rows={data}
        rowKey={(row) => row.ID ?? JSON.stringify(row)}
        columns={[
          { key: "ID", header: t("Rule ID") },
          { key: "Status", header: t("Status") },
          { key: "dest", header: t("Destination"), render: (row) => row.Destination?.Bucket ?? "-" },
          { key: "prefix", header: t("Prefix"), render: (row) => row.Filter?.Prefix ?? "-" },
        ]}
        actions={(row) => [
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete this replication rule?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void saveReplication
                    .mutateAsync({ bucket, rules: data.filter((rule) => rule.ID !== row.ID) })
                    .catch((err) => showError(getStoragesApiErrorMessage(err, t("Delete Failed"))));
                },
              }),
          },
        ]}
      />
      <Heading as="h3" size="3" mt="4" mb="2">
        {t("ARN")}
      </Heading>
      <DataTable
        empty={t("No Data")}
        rows={remotes}
        rowKey={(row) => String(row.arn ?? row.ARN ?? JSON.stringify(row))}
        columns={[{ key: "arn", header: t("ARN"), render: (row) => String(row.arn ?? row.ARN ?? "-") }]}
        actions={(row) => [
          {
            label: t("Delete"),
            color: "red",
            onSelect: () => {
              void deleteRemote
                .mutateAsync({ bucket, arn: String(row.arn ?? row.ARN ?? "") })
                .catch((err) => showError(getStoragesApiErrorMessage(err, t("Delete Failed"))));
            },
          },
        ]}
      />
      <FormDialog
        open={ruleOpen}
        onOpenChange={setRuleOpen}
        title={t("Add Replication Rule")}
        submitLabel={t("Add")}
        cancelLabel={t("Cancel")}
        submitting={saveReplication.isPending}
        onSubmit={addRule}
      >
        <TextField.Root value={dest} onChange={(event) => setDest(event.target.value)} placeholder={t("Destination")} />
        <TextField.Root value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder={t("Prefix")} />
      </FormDialog>
      <FormDialog
        open={remoteOpen}
        onOpenChange={setRemoteOpen}
        title={t("Add Site Replication")}
        submitLabel={t("Add")}
        cancelLabel={t("Cancel")}
        submitting={setRemote.isPending}
        onSubmit={addRemote}
      >
        <TextField.Root value={remoteArn} onChange={(event) => setRemoteArn(event.target.value)} placeholder={t("ARN")} />
      </FormDialog>
    </>
  );
}
