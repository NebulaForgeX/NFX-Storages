import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

import { Button, Card, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { Settings, Shield, KeyRound, Lock, Tag } from "lucide-react";
import { CardHeader, EmptyState, PageHeader } from "@/components";
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
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function BucketsPage() {
  const { t } = useTranslation("common");
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
  const [tagText, setTagText] = useState("");
  const [lockMode, setLockMode] = useState("");
  const [lockDays, setLockDays] = useState("");
  const [writeError, setWriteError] = useState("");

  const currentPolicy = policy || data?.policy || "";
  const currentTags =
    tagText ||
    (data?.tags ?? [])
      .filter((tag) => tag.Key)
      .map((tag) => `${tag.Key}=${tag.Value}`)
      .join("\n");
  const currentLockMode = lockMode || data?.objectLockMode || "GOVERNANCE";
  const currentLockDays = lockDays || String(data?.objectLockDays ?? 1);
  const hasEncryption = Boolean(data?.encryption && data.encryption !== "" && data.encryption !== "undefined");

  const toggleVersioning = async () => {
    const next = data?.versioning === "Enabled" ? "Suspended" : "Enabled";
    try {
      await setVersioning.mutateAsync({ bucket, status: next });
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const savePolicy = async () => {
    try {
      await setPolicy.mutateAsync({ bucket, policy: currentPolicy });
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const enableEncryption = async () => {
    try {
      await setEncryption.mutateAsync(bucket);
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const removeEncryption = async () => {
    if (!window.confirm(t("Are you sure you want to remove encryption?"))) return;
    try {
      await deleteEncryption.mutateAsync(bucket);
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const saveTags = async () => {
    const tags = currentTags
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf("=");
        if (idx <= 0) return { Key: line, Value: "" };
        return { Key: line.slice(0, idx).trim(), Value: line.slice(idx + 1).trim() };
      })
      .filter((tag) => tag.Key);
    try {
      await setTags.mutateAsync({ bucket, tags });
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const saveObjectLock = async () => {
    try {
      await setObjectLock.mutateAsync({
        bucket,
        mode: currentLockMode,
        days: Number(currentLockDays) || 1,
      });
    } catch (err) {
      setWriteError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={Settings} title={bucket} description={t("Settings")} />
      {isLoading ? <EmptyState icon={Settings} title={t("Loading")} /> : null}
      {error ? <EmptyState icon={Settings} title={getStoragesApiErrorMessage(error, t("Failed to fetch data"))} /> : null}
      {writeError ? <Text color="red">{writeError}</Text> : null}
      {data ? (
        <Flex direction="column" gap="4">
          <Card>
            <CardHeader icon={<Shield size={18} />} title={t("Versioning")} />
            <Flex gap="3" align="center">
              <Text>{String(data.versioning ?? "-")}</Text>
              <Button size="1" variant="outline" onClick={() => void toggleVersioning()}>
                {data.versioning === "Enabled" ? t("Disabled") : t("Enabled")}
              </Button>
            </Flex>
          </Card>
          <Card>
            <CardHeader icon={<KeyRound size={18} />} title={t("Access Policy")} />
            <TextArea
              value={currentPolicy}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={8}
              style={{ width: "100%" }}
            />
            <Button mt="2" onClick={() => void savePolicy()}>
              {t("Save")}
            </Button>
          </Card>
          <Card>
            <CardHeader icon={<Tag size={18} />} title={t("Tags")} />
            <TextArea
              value={currentTags}
              onChange={(e) => setTagText(e.target.value)}
              rows={4}
              placeholder="key=value"
              style={{ width: "100%" }}
            />
            <Button mt="2" onClick={() => void saveTags()}>
              {t("Save")}
            </Button>
          </Card>
          <Card>
            <CardHeader icon={<Lock size={18} />} title={t("Object Lock")} />
            <Flex gap="2" wrap="wrap" align="center">
              <TextField.Root value={currentLockMode} onChange={(e) => setLockMode(e.target.value)} placeholder="GOVERNANCE" />
              <TextField.Root value={currentLockDays} onChange={(e) => setLockDays(e.target.value)} placeholder={t("Days")} />
              <Button onClick={() => void saveObjectLock()}>{t("Enabled")}</Button>
            </Flex>
          </Card>
          <Card>
            <CardHeader icon={<Lock size={18} />} title={t("Encryption")} />
            <pre style={{ whiteSpace: "pre-wrap" }}>{data.encryption || "-"}</pre>
            <Flex gap="2" mt="2">
              <Button size="1" onClick={() => void enableEncryption()}>
                {t("Enabled")}
              </Button>
              {hasEncryption ? (
                <Button size="1" color="red" variant="outline" onClick={() => void removeEncryption()}>
                  {t("Delete")}
                </Button>
              ) : null}
            </Flex>
          </Card>
          <Button asChild>
            <a href={`/browser/${encodeURIComponent(bucket)}`}>{t("Browser")}</a>
          </Button>
        </Flex>
      ) : null}
    </PageFrame>
  );
}
