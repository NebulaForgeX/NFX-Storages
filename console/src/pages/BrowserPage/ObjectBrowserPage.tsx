import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { FolderOpen } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useDeleteObject, useObjectInfo, useObjects, usePutObject, useSignedObjectUrl } from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { DataTable } from "@/components/DataTable";
import { niceBytes } from "@/utils/functions";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function ObjectBrowserPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const params = useParams();
  const bucket = decodeURIComponent(params.bucket ?? "");
  const key = decodeURIComponent(params.key ?? "");
  const prefix = key.endsWith("/") || key === "" ? key : "";
  const isList = key === "" || key.endsWith("/");
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useObjects(bucket, prefix, isList);
  const { data: objectInfo } = useObjectInfo(bucket, key, Boolean(bucket) && !isList);
  const putObject = usePutObject();
  const deleteObject = useDeleteObject();
  const signedUrl = useSignedObjectUrl();

  const rows = useMemo(
    () => (data ?? []).filter((row) => row.Key.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const openPath = (nextKey: string) => {
    navigate(`/browser/${encodeURIComponent(bucket)}/${encodeURIComponent(nextKey)}`);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        await putObject.mutateAsync({ bucket, key: `${prefix}${file.name}`, file });
      }
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Upload Failed")));
    }
  };

  const removeObject = async (objectKey: string) => {
    if (!window.confirm(t("Are you sure you want to delete this object?"))) return;
    try {
      await deleteObject.mutateAsync({ bucket, key: objectKey });
      if (!isList) navigate(`/browser/${encodeURIComponent(bucket)}`);
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Delete Failed")));
    }
  };

  const download = async (objectKey: string) => {
    const url = await signedUrl.mutateAsync({ bucket, key: objectKey });
    window.open(url, "_blank");
  };

  return (
    <PageFrame>
      <PageHeader
        icon={FolderOpen}
        title={bucket}
        description={key || "/"}
        actions={
          <Flex gap="2" wrap="wrap">
            <Button variant="outline" onClick={() => navigate("/browser")}>
              {t("Buckets")}
            </Button>
            {isList ? (
              <>
                <TextField.Root value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search")} />
                <input ref={fileRef} type="file" multiple hidden onChange={(e) => void uploadFiles(e.target.files)} />
                <Button onClick={() => fileRef.current?.click()}>{t("Upload File")}</Button>
                <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.OBJECTS)}>
                  {t("Refresh")}
                </Button>
              </>
            ) : null}
          </Flex>
        }
      />
      {error ? (
        <Text color="red" size="2">
          {error}
        </Text>
      ) : null}
      {isList ? (
        <DataTable
          loading={isLoading}
          empty={t("No Objects")}
          rows={rows}
          rowKey={(row) => row.Key}
          columns={[
            {
              key: "Key",
              header: t("Name"),
              render: (row) => (
                <Button variant="ghost" onClick={() => openPath(row.Key)}>
                  {row.Key.replace(prefix, "") || row.Key}
                </Button>
              ),
            },
            { key: "type", header: t("Type") },
            {
              key: "Size",
              header: t("Size"),
              render: (row) => (row.type === "object" ? niceBytes(String(row.Size)) : "-"),
            },
            { key: "LastModified", header: t("Last Modified") },
            {
              key: "actions",
              header: t("Actions"),
              render: (row) =>
                row.type === "object" ? (
                  <Flex gap="2">
                    <Button size="1" variant="outline" onClick={() => void download(row.Key)}>
                      {t("Download")}
                    </Button>
                    <Button size="1" color="red" variant="outline" onClick={() => void removeObject(row.Key)}>
                      {t("Delete")}
                    </Button>
                  </Flex>
                ) : null,
            },
          ]}
        />
      ) : (
        <Flex direction="column" gap="3">
          <Text>
            {t("Name")}: {key}
          </Text>
          <Text>
            {t("Size")}: {objectInfo?.ContentLength != null ? niceBytes(String(objectInfo.ContentLength)) : "-"}
          </Text>
          <Flex gap="2">
            <Button onClick={() => void download(key)}>{t("Download")}</Button>
            {objectInfo?.SignedUrl ? (
              <Button variant="outline" asChild>
                <a href={objectInfo.SignedUrl} target="_blank" rel="noreferrer">
                  {t("Preview")}
                </a>
              </Button>
            ) : null}
            <Button color="red" variant="outline" onClick={() => void removeObject(key)}>
              {t("Delete")}
            </Button>
          </Flex>
        </Flex>
      )}
    </PageFrame>
  );
}
