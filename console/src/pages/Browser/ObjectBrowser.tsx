import { StackIcon } from "nfx-ui/icons";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateFolder, useDeleteObject, useObjects, usePutObject, useSignedObjectUrl } from "@/hooks";
import { invalidateEventEmitter, invalidateEvents } from "@/events/invalidate";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { niceBytes } from "@/utils/functions";

import ObjectInspector from "./ObjectInspector";

function parentPrefix(key: string) {
  const trimmed = key.endsWith("/") ? key.slice(0, -1) : key;
  const idx = trimmed.lastIndexOf("/");
  return idx >= 0 ? `${trimmed.slice(0, idx + 1)}` : "";
}

function objectPath(bucket: string, nextKey: string) {
  return `/browser/${encodeURIComponent(bucket)}/${encodeURIComponent(nextKey)}`;
}

export default function ObjectBrowserPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const params = useParams();
  const bucket = decodeURIComponent(params.bucket ?? "");
  const key = decodeURIComponent(params.key ?? "");
  const isFolder = key === "" || key.endsWith("/");
  const prefix = isFolder ? key : parentPrefix(key);
  const selectedKey = isFolder ? "" : key;
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const objectsQuery = useObjects(bucket, prefix, Boolean(bucket));
  const putObject = usePutObject();
  const createFolder = useCreateFolder();
  const deleteObject = useDeleteObject();
  const signedUrl = useSignedObjectUrl();

  const rows = useMemo(() => {
    const all = (objectsQuery.data?.pages ?? []).flatMap((page) => page.rows);
    if (!search) return all;
    return all.filter((row) => row.Key.toLowerCase().includes(search.toLowerCase()));
  }, [objectsQuery.data, search]);

  const crumbs = [
    { label: t("Buckets"), href: "/browser" },
    { label: bucket, href: `/browser/${encodeURIComponent(bucket)}` },
    ...prefix
      .split("/")
      .filter(Boolean)
      .map((part, index, parts) => {
        const next = `${parts.slice(0, index + 1).join("/")}/`;
        return { label: part, href: objectPath(bucket, next) };
      }),
  ];

  const openPath = (nextKey: string, type: "prefix" | "object") => {
    navigate(objectPath(bucket, type === "prefix" ? nextKey : nextKey));
  };

  const uploadFiles = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        await putObject.mutateAsync({ bucket, key: `${prefix}${file.name}`, file });
      }
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Upload Failed")));
    }
  };

  const makeFolder = async () => {
    const name = folderName.trim().replace(/^\/+|\/+$/g, "");
    if (!name) return;
    try {
      await createFolder.mutateAsync({ bucket, key: `${prefix}${name}/` });
      setFolderName("");
      setFolderOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const removeObject = (objectKey: string) => {
    showConfirm({
      title: t("Delete"),
      message: t("Are you sure you want to delete this object?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: () => {
        void deleteObject.mutateAsync({ bucket, key: objectKey }).catch((err) => {
          showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
        });
      },
    });
  };

  const download = async (objectKey: string) => {
    try {
      const url = await signedUrl.mutateAsync({ bucket, key: objectKey });
      window.open(url, "_blank");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Download")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={StackIcon} title={bucket} description={prefix || "/"} />
      <Flex gap="1" wrap="wrap" mb="3" align="center">
        {crumbs.map((crumb, index) => (
          <Flex key={crumb.href} gap="1" align="center">
            {index > 0 ? <Text color="gray">/</Text> : null}
            <Button size="1" variant="ghost" onClick={() => navigate(crumb.href)}>
              {crumb.label}
            </Button>
          </Flex>
        ))}
      </Flex>
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search")}>
        <input ref={fileRef} type="file" multiple hidden onChange={(event) => void uploadFiles(event.target.files)} />
        <Button onClick={() => fileRef.current?.click()}>{t("Upload File")}</Button>
        <Button variant="outline" onClick={() => setFolderOpen(true)}>
          {t("Create Folder")}
        </Button>
        <Button variant="outline" onClick={() => invalidateEventEmitter.emit(invalidateEvents.OBJECTS)}>
          {t("Refresh")}
        </Button>
      </Toolbar>
      <Flex
        gap="4"
        align="start"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        style={{
          outline: dragging ? "2px dashed var(--accent-8)" : undefined,
          outlineOffset: 4,
          minHeight: 240,
        }}
      >
        <Flex direction="column" gap="3" flexGrow="1" minWidth="0">
          {dragging ? (
            <Text size="2" color="gray">
              {t("Drop files to upload")}
            </Text>
          ) : null}
          <DataTable
            loading={objectsQuery.isLoading}
            empty={t("No Objects")}
            emptyIcon={StackIcon}
            rows={rows}
            rowKey={(row) => row.Key}
            selectedKey={selectedKey}
            onRowClick={(row) => openPath(row.Key, row.type)}
            columns={[
              {
                key: "Key",
                header: t("Name"),
                render: (row) => row.Key.replace(prefix, "") || row.Key,
              },
              {
                key: "type",
                header: t("Type"),
                render: (row) => (row.type === "prefix" ? t("Folder") : t("Object")),
              },
              {
                key: "Size",
                header: t("Size"),
                render: (row) => (row.type === "object" ? niceBytes(String(row.Size)) : "-"),
              },
              { key: "LastModified", header: t("Last Modified") },
            ]}
            actions={(row) =>
              row.type === "object"
                ? [
                    { label: t("Download"), onSelect: () => void download(row.Key) },
                    { label: t("Delete"), color: "red", onSelect: () => removeObject(row.Key) },
                  ]
                : [{ label: t("Open"), onSelect: () => openPath(row.Key, "prefix") }]
            }
          />
          {objectsQuery.hasNextPage ? (
            <Button variant="outline" onClick={() => void objectsQuery.fetchNextPage()} disabled={objectsQuery.isFetchingNextPage}>
              {t("Load More")}
            </Button>
          ) : null}
        </Flex>
        {selectedKey ? (
          <ObjectInspector
            bucket={bucket}
            objectKey={selectedKey}
            onClose={() => navigate(prefix ? objectPath(bucket, prefix) : `/browser/${encodeURIComponent(bucket)}`)}
            onDeleted={() => navigate(prefix ? objectPath(bucket, prefix) : `/browser/${encodeURIComponent(bucket)}`)}
          />
        ) : null}
      </Flex>
      <FormDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        title={t("Create Folder")}
        submitLabel={t("Create Folder")}
        cancelLabel={t("Cancel")}
        submitting={createFolder.isPending}
        onSubmit={makeFolder}
      >
        <TextField.Root
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          placeholder={t("Folder Name")}
          autoFocus
        />
      </FormDialog>
    </PageFrame>
  );
}
