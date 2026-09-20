import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Text, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, Toolbar } from "@/components";
import { useLifecycle, useSaveLifecycle } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export function LifecyclePanel({ bucket }: { bucket: string }) {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useLifecycle(bucket);
  const saveLifecycle = useSaveLifecycle();
  const [open, setOpen] = useState(false);
  const [ruleId, setRuleId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [days, setDays] = useState("30");

  const addRule = async () => {
    if (!bucket) return;
    try {
      await saveLifecycle.mutateAsync({
        bucket,
        rules: [
          ...data,
          { ID: ruleId || `rule-${Date.now()}`, Status: "Enabled", Filter: { Prefix: prefix }, Expiration: { Days: Number(days) || 30 } },
        ],
      });
      setRuleId("");
      setPrefix("");
      setOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = (id?: string) => {
    if (!bucket) return;
    showConfirm({
      title: t("Delete"),
      message: t("Are you sure you want to delete this rule?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: () => {
        void saveLifecycle.mutateAsync({ bucket, rules: data.filter((rule) => rule.ID !== id) }).catch((err) => {
          showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
        });
      },
    });
  };

  return (
    <>
      <Toolbar>
        <Button disabled={!bucket} onClick={() => setOpen(true)}>
          {t("Add Lifecycle Rule")}
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
          { key: "prefix", header: t("Prefix"), render: (row) => row.Filter?.Prefix ?? "-" },
          { key: "days", header: t("Days"), render: (row) => String(row.Expiration?.Days ?? "-") },
        ]}
        actions={(row) => [{ label: t("Delete"), color: "red", onSelect: () => remove(row.ID) }]}
      />
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Add Lifecycle Rule")}
        submitLabel={t("Add")}
        cancelLabel={t("Cancel")}
        submitting={saveLifecycle.isPending}
        onSubmit={addRule}
      >
        <TextField.Root value={ruleId} onChange={(event) => setRuleId(event.target.value)} placeholder={t("Rule ID")} />
        <TextField.Root value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder={t("Prefix")} />
        <TextField.Root value={days} onChange={(event) => setDays(event.target.value)} placeholder={t("Days")} />
        {!bucket ? <Text color="red">{t("Please select bucket")}</Text> : null}
      </FormDialog>
    </>
  );
}
