import { GearIcon } from "nfx-ui/icons";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import { Button, Flex, Select, Switch, Tabs, Text, TextArea, TextField } from "@radix-ui/themes";
import { DataTable, EmptyState, PageHeader, PropertyList, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";
import {
  useBucketSettings,
  useDeleteBucketEncryption,
  useSetBucketEncryption,
  useSetBucketPolicy,
  useSetBucketTags,
  useSetBucketVersioning,
  useSetObjectLock,
} from "@/hooks";
import { showConfirm, showError, showSuccess } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

import { EventsPanel } from "./panels/EventsPanel";
import { LifecyclePanel } from "./panels/LifecyclePanel";
import { ReplicationPanel } from "./panels/ReplicationPanel";

export default function BucketsPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const params = useParams();
  const bucket = decodeURIComponent(params.key ?? "");
  const { data, isLoading, error } = useBucketSettings(bucket);
  const setVersioning = useSetBucketVersioning();
  const setPolicy = useSetBucketPolicy();
  const setEncryption = useSetBucketEncryption();
  const deleteEncryption = useDeleteBucketEncryption();
  const setTags = useSetBucketTags();
  const setObjectLock = useSetObjectLock();
  const [policy, setPolicyText] = useState("");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [lockMode, setLockMode] = useState("GOVERNANCE");
  const [lockDays, setLockDays] = useState("1");

  useEffect(() => {
    if (!data) return;
    setPolicyText(data.policy);
    setLockMode(data.objectLockMode || "GOVERNANCE");
    setLockDays(String(data.objectLockDays ?? 1));
  }, [data]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) showSuccess(ok);
      return true;
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
      return false;
    }
  };

  return (
    <PageFrame>
      <PageHeader
        icon={GearIcon}
        title={bucket}
        description={t("Settings")}
        actions={
          <Button variant="outline" onClick={() => navigate(`/browser/${encodeURIComponent(bucket)}`)}>
            {t("Browser")}
          </Button>
        }
      />
      {isLoading ? <EmptyState icon={GearIcon} title={t("Loading")} /> : null}
      {error ? <EmptyState icon={GearIcon} title={getStoragesApiErrorMessage(error, t("Failed to fetch data"))} /> : null}
      {data ? (
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Trigger value="overview">{t("Overview")}</Tabs.Trigger>
            <Tabs.Trigger value="policy">{t("Access Policy")}</Tabs.Trigger>
            <Tabs.Trigger value="versioning">{t("Versioning")}</Tabs.Trigger>
            <Tabs.Trigger value="encryption">{t("Encryption")}</Tabs.Trigger>
            <Tabs.Trigger value="tags">{t("Tags")}</Tabs.Trigger>
            <Tabs.Trigger value="lifecycle">{t("Lifecycle")}</Tabs.Trigger>
            <Tabs.Trigger value="replication">{t("Replication")}</Tabs.Trigger>
            <Tabs.Trigger value="events">{t("Events")}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview" style={{ paddingTop: 12 }}>
            <PropertyList
              items={[
                { label: t("Bucket"), value: bucket },
                { label: t("Versioning"), value: String(data.versioning ?? "-") },
                { label: t("Access Policy"), value: data.policyPublic ? t("Public") : t("Private") },
                { label: t("Encryption"), value: data.encryptionAlgorithm || t("Disabled") },
                { label: t("Object Lock"), value: data.objectLockEnabled ? t("Enabled") : t("Disabled") },
              ]}
            />
          </Tabs.Content>
          <Tabs.Content value="policy" style={{ paddingTop: 12 }}>
            <Toolbar>
              <Button onClick={() => void run(() => setPolicy.mutateAsync({ bucket, policy }), t("Save"))}>{t("Save")}</Button>
            </Toolbar>
            <TextArea value={policy} onChange={(event) => setPolicyText(event.target.value)} rows={16} style={{ width: "100%" }} />
          </Tabs.Content>
          <Tabs.Content value="versioning" style={{ paddingTop: 12 }}>
            <Flex direction="column" gap="3" mt="3">
              <Flex align="center" gap="3">
                <Text>{t("Versioning")}</Text>
                <Switch
                  checked={data.versioning === "Enabled"}
                  onCheckedChange={() =>
                    void run(() =>
                      setVersioning.mutateAsync({ bucket, status: data.versioning === "Enabled" ? "Suspended" : "Enabled" }),
                    )
                  }
                />
                <Text color="gray">{String(data.versioning ?? "-")}</Text>
              </Flex>
              <Flex gap="2" align="center" wrap="wrap">
                <Text>{t("Object Lock")}</Text>
                <Select.Root value={lockMode} onValueChange={setLockMode}>
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="GOVERNANCE">GOVERNANCE</Select.Item>
                    <Select.Item value="COMPLIANCE">COMPLIANCE</Select.Item>
                  </Select.Content>
                </Select.Root>
                <TextField.Root value={lockDays} onChange={(event) => setLockDays(event.target.value)} placeholder={t("Days")} />
                <Button
                  onClick={() =>
                    void run(() => setObjectLock.mutateAsync({ bucket, mode: lockMode, days: Number(lockDays) || 1 }), t("Enabled"))
                  }
                >
                  {t("Enabled")}
                </Button>
              </Flex>
            </Flex>
          </Tabs.Content>
          <Tabs.Content value="encryption" style={{ paddingTop: 12 }}>
            <Flex gap="2" align="center" mt="3">
              <Text>{t("Algorithm")}: {data.encryptionAlgorithm || t("Disabled")}</Text>
              <Button onClick={() => void run(() => setEncryption.mutateAsync(bucket), t("Enabled"))}>{t("Enabled")}</Button>
              {data.encryptionAlgorithm ? (
                <Button
                  color="red"
                  variant="outline"
                  onClick={() =>
                    showConfirm({
                      title: t("Delete"),
                      message: t("Are you sure you want to remove encryption?"),
                      confirmText: t("Delete"),
                      cancelText: t("Cancel"),
                      onConfirm: () => {
                        void run(() => deleteEncryption.mutateAsync(bucket));
                      },
                    })
                  }
                >
                  {t("Delete")}
                </Button>
              ) : null}
            </Flex>
          </Tabs.Content>
          <Tabs.Content value="tags" style={{ paddingTop: 12 }}>
            <Toolbar>
              <TextField.Root value={tagKey} onChange={(event) => setTagKey(event.target.value)} placeholder={t("Name")} />
              <TextField.Root value={tagValue} onChange={(event) => setTagValue(event.target.value)} placeholder={t("Value")} />
              <Button
                onClick={() => {
                  if (!tagKey.trim()) return;
                  const tags = [...data.tags.filter((tag) => tag.Key !== tagKey.trim()), { Key: tagKey.trim(), Value: tagValue }];
                  void run(() => setTags.mutateAsync({ bucket, tags })).then((ok) => {
                    if (!ok) return;
                    setTagKey("");
                    setTagValue("");
                  });
                }}
              >
                {t("Add Tag")}
              </Button>
            </Toolbar>
            <DataTable
              empty={t("No Data")}
              rows={data.tags}
              rowKey={(row) => row.Key}
              columns={[
                { key: "Key", header: t("Name") },
                { key: "Value", header: t("Value") },
              ]}
              actions={(row) => [
                {
                  label: t("Delete"),
                  color: "red",
                  onSelect: () => void run(() => setTags.mutateAsync({ bucket, tags: data.tags.filter((tag) => tag.Key !== row.Key) })),
                },
              ]}
            />
          </Tabs.Content>
          <Tabs.Content value="lifecycle" style={{ paddingTop: 12 }}>
            <LifecyclePanel bucket={bucket} />
          </Tabs.Content>
          <Tabs.Content value="replication" style={{ paddingTop: 12 }}>
            <ReplicationPanel bucket={bucket} />
          </Tabs.Content>
          <Tabs.Content value="events" style={{ paddingTop: 12 }}>
            <EventsPanel bucket={bucket} />
          </Tabs.Content>
        </Tabs.Root>
      ) : null}
    </PageFrame>
  );
}
