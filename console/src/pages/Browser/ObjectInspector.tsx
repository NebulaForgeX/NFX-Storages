import { FileDescriptionIcon, LayersIcon, LockIcon, ShieldCheck } from "nfx-ui/icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Heading, Select, Switch, Text, TextField } from "@radix-ui/themes";
import { DataTable, Inspector, PropertyList } from "@/components";
import {
  useDeleteAllObjectVersions,
  useDeleteObject,
  useObjectInfo,
  useObjectLegalHold,
  useObjectRetention,
  useObjectTags,
  useObjectVersions,
  useSaveObjectLegalHold,
  useSaveObjectRetention,
  useSaveObjectTags,
  useSignedObjectUrl,
} from "@/hooks";
import { showConfirm, showError, showSuccess } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { niceBytes } from "@/utils/functions";

interface ObjectInspectorProps {
  bucket: string;
  objectKey: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function ObjectInspector({ bucket, objectKey, onClose, onDeleted }: ObjectInspectorProps) {
  const { t } = useTranslation("common");
  const { data: info } = useObjectInfo(bucket, objectKey, true);
  const { data: tags = [] } = useObjectTags(bucket, objectKey, true);
  const { data: versions } = useObjectVersions(bucket, objectKey, true);
  const { data: retention } = useObjectRetention(bucket, objectKey, true);
  const { data: legalHold } = useObjectLegalHold(bucket, objectKey, true);
  const signedUrl = useSignedObjectUrl();
  const deleteObject = useDeleteObject();
  const deleteAll = useDeleteAllObjectVersions();
  const saveTags = useSaveObjectTags();
  const saveRetention = useSaveObjectRetention();
  const saveLegalHold = useSaveObjectLegalHold();
  const [tagText, setTagText] = useState("");
  const [mode, setMode] = useState<"GOVERNANCE" | "COMPLIANCE">("GOVERNANCE");
  const [retainUntil, setRetainUntil] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");

  useEffect(() => {
    setTagText(tags.filter((tag) => tag.Key).map((tag) => `${tag.Key}=${tag.Value}`).join("\n"));
  }, [tags]);

  useEffect(() => {
    const current = retention?.Retention;
    if (current?.Mode === "COMPLIANCE" || current?.Mode === "GOVERNANCE") setMode(current.Mode);
    if (current?.RetainUntilDate) setRetainUntil(new Date(current.RetainUntilDate).toISOString().slice(0, 16));
  }, [retention]);

  const contentType = info?.ContentType ?? "";
  const name = objectKey.split("/").filter(Boolean).at(-1) ?? objectKey;

  const download = async () => {
    try {
      const url = await signedUrl.mutateAsync({ bucket, key: objectKey });
      window.open(url, "_blank");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Download")));
    }
  };

  const copyUrl = async () => {
    try {
      const url = await signedUrl.mutateAsync({ bucket, key: objectKey });
      await navigator.clipboard.writeText(url);
      showSuccess(t("Copied"));
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Copy URL")));
    }
  };

  const loadPreview = async () => {
    try {
      const url = info?.SignedUrl || (await signedUrl.mutateAsync({ bucket, key: objectKey }));
      setPreviewUrl(url);
      if (contentType.startsWith("text/") || contentType.includes("json") || contentType.includes("xml")) {
        const res = await fetch(url);
        setPreviewText(await res.text());
      } else {
        setPreviewText("");
      }
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Preview")));
    }
  };

  const remove = () => {
    showConfirm({
      title: t("Delete"),
      message: t("Are you sure you want to delete this object?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: () => {
        void deleteObject.mutateAsync({ bucket, key: objectKey }).then(onDeleted).catch((err) => {
          showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
        });
      },
    });
  };

  const saveTagLines = async () => {
    const next = tagText
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
      await saveTags.mutateAsync({ bucket, key: objectKey, tags: next });
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const versionRows = [
    ...(versions?.Versions ?? []).map((version) => ({
      id: version.VersionId ?? "",
      kind: version.IsLatest ? t("Latest") : t("Versions"),
      size: version.Size ?? 0,
      modified: version.LastModified ? new Date(version.LastModified).toISOString() : "",
      marker: false,
    })),
    ...(versions?.DeleteMarkers ?? []).map((marker) => ({
      id: marker.VersionId ?? "",
      kind: t("Delete Marker"),
      size: 0,
      modified: marker.LastModified ? new Date(marker.LastModified).toISOString() : "",
      marker: true,
    })),
  ];

  return (
    <Inspector
      title={name}
      onClose={onClose}
      closeLabel={t("Close")}
      actions={
        <>
          <Button size="1" onClick={() => void download()}>
            {t("Download")}
          </Button>
          <Button size="1" variant="outline" onClick={() => void copyUrl()}>
            {t("Copy URL")}
          </Button>
          <Button size="1" variant="outline" onClick={() => void loadPreview()}>
            {t("Preview")}
          </Button>
          <Button size="1" color="red" variant="outline" onClick={remove}>
            {t("Delete")}
          </Button>
        </>
      }
    >
      <PropertyList
        items={[
          { label: t("Name"), value: objectKey },
          { label: t("Size"), value: info?.ContentLength != null ? niceBytes(String(info.ContentLength)) : "-" },
          { label: t("Content Type"), value: contentType || "-" },
          { label: "ETag", value: info?.ETag ?? "-" },
          { label: t("Last Modified"), value: info?.LastModified ? new Date(info.LastModified).toISOString() : "-" },
        ]}
      />
      {previewUrl && contentType.startsWith("image/") ? (
        <img src={previewUrl} alt={name} style={{ width: "100%", borderRadius: 6 }} />
      ) : null}
      {previewText ? (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 220, overflow: "auto" }}>{previewText}</pre>
      ) : null}

      <Heading as="h3" size="2">
        <Flex align="center" gap="2">
          <FileDescriptionIcon size={14} />
          {t("Tags")}
        </Flex>
      </Heading>
      <TextField.Root value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="key=value" />
      <Button size="1" variant="outline" onClick={() => void saveTagLines()}>
        {t("Save")}
      </Button>

      <Heading as="h3" size="2">
        <Flex align="center" gap="2">
          <LockIcon size={14} />
          {t("Retention")} / {t("Legal Hold")}
        </Flex>
      </Heading>
      <Select.Root value={mode} onValueChange={(value) => setMode(value as "GOVERNANCE" | "COMPLIANCE")}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="GOVERNANCE">GOVERNANCE</Select.Item>
          <Select.Item value="COMPLIANCE">COMPLIANCE</Select.Item>
        </Select.Content>
      </Select.Root>
      <TextField.Root type="datetime-local" value={retainUntil} onChange={(event) => setRetainUntil(event.target.value)} />
      <Button
        size="1"
        variant="outline"
        onClick={() =>
          void saveRetention
            .mutateAsync({
              bucket,
              key: objectKey,
              mode,
              retainUntilDate: retainUntil ? new Date(retainUntil).toISOString() : undefined,
            })
            .catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))))
        }
      >
        {t("Save")}
      </Button>
      <Flex align="center" gap="2">
        <Text size="2">{t("Legal Hold")}</Text>
        <Switch
          checked={legalHold?.LegalHold?.Status === "ON"}
          onCheckedChange={(checked) =>
            void saveLegalHold
              .mutateAsync({ bucket, key: objectKey, status: checked ? "ON" : "OFF" })
              .catch((err) => showError(getStoragesApiErrorMessage(err, t("Add Failed"))))
          }
        />
      </Flex>

      <Heading as="h3" size="2">
        <Flex align="center" gap="2">
          <LayersIcon size={14} />
          {t("Versions")}
        </Flex>
      </Heading>
      <DataTable
        empty={t("No Data")}
        emptyIcon={ShieldCheck}
        rows={versionRows}
        rowKey={(row) => row.id || row.modified}
        columns={[
          { key: "kind", header: t("Type") },
          { key: "id", header: "VersionId", render: (row) => row.id || "-" },
          { key: "modified", header: t("Last Modified") },
        ]}
        actions={(row) =>
          row.id
            ? [
                {
                  label: t("Delete"),
                  color: "red",
                  onSelect: () => {
                    void deleteObject.mutateAsync({ bucket, key: objectKey, versionId: row.id }).catch((err) => {
                      showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
                    });
                  },
                },
              ]
            : []
        }
      />
      {versionRows.length ? (
        <Button
          size="1"
          color="red"
          variant="outline"
          onClick={() =>
            showConfirm({
              title: t("Delete All Versions"),
              message: t("Are you sure you want to delete this object?"),
              confirmText: t("Delete"),
              cancelText: t("Cancel"),
              onConfirm: () => {
                void deleteAll.mutateAsync({ bucket, key: objectKey }).then(onDeleted).catch((err) => {
                  showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
                });
              },
            })
          }
        >
          {t("Delete All Versions")}
        </Button>
      ) : null}
    </Inspector>
  );
}
