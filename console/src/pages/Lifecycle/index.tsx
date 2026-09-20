import { LayersIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { useLifecycle, useSaveLifecycle } from "@/hooks";
import { BucketSelect } from "@/components/BucketSelect";
import { DataTable } from "@/components/DataTable";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function LifecyclePage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [days, setDays] = useState("30");
  const [error, setError] = useState("");
  const { data = [], isLoading } = useLifecycle(bucket);
  const saveLifecycle = useSaveLifecycle();

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
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const remove = async (id?: string) => {
    if (!bucket || !window.confirm(t("Are you sure you want to delete this rule?"))) return;
    try {
      await saveLifecycle.mutateAsync({ bucket, rules: data.filter((rule) => rule.ID !== id) });
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={LayersIcon}
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
