import { LockIcon } from "nfx-ui/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, SecretDialog, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useAccessKeys, useCreateAccessKey, useDeleteAccessKey, useUpdateAccessKey, type CredentialResult } from "@/hooks";
import { showConfirm, showError } from "@/stores/modal";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function AccessKeysPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useAccessKeys();
  const createAccessKey = useCreateAccessKey();
  const deleteAccessKey = useDeleteAccessKey();
  const updateAccessKey = useUpdateAccessKey();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameKey, setRenameKey] = useState("");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<CredentialResult | null>(null);

  const rows = useMemo(
    () => data.filter((row) => row.accessKey.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const create = async () => {
    try {
      const result = await createAccessKey.mutateAsync(name);
      setSecret(result);
      setName("");
      setCreateOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const rename = async () => {
    if (!renameKey || !name) return;
    try {
      await updateAccessKey.mutateAsync({ accessKey: renameKey, name });
      setRenameKey("");
      setName("");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={LockIcon} title={t("Access Keys")} />
      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder={t("Search Access Key")}>
        <Button onClick={() => setCreateOpen(true)}>{t("Add Access Key")}</Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Access Keys")}
        emptyIcon={LockIcon}
        rows={rows}
        rowKey={(row) => row.accessKey}
        columns={[
          { key: "accessKey", header: t("Access Key") },
          { key: "name", header: t("Name") },
          { key: "accountStatus", header: t("Status") },
          { key: "expiration", header: t("Expiration") },
        ]}
        actions={(row) => [
          {
            label: t("Save"),
            onSelect: () => {
              setRenameKey(row.accessKey);
              setName(row.name ?? "");
            },
          },
          {
            label: t("Delete"),
            color: "red",
            onSelect: () =>
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete this key?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deleteAccessKey.mutateAsync(row.accessKey).catch((err) => {
                    showError(getStoragesApiErrorMessage(err, t("Delete Failed")));
                  });
                },
              }),
          },
        ]}
      />
      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("Add Access Key")}
        submitLabel={t("Add Access Key")}
        cancelLabel={t("Cancel")}
        submitting={createAccessKey.isPending}
        onSubmit={create}
      >
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
      </FormDialog>
      <FormDialog
        open={Boolean(renameKey)}
        onOpenChange={(open) => {
          if (!open) setRenameKey("");
        }}
        title={t("Name")}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        onSubmit={rename}
      >
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
      </FormDialog>
      <SecretDialog
        open={Boolean(secret)}
        onOpenChange={(open) => {
          if (!open) setSecret(null);
        }}
        title={t("Access Key")}
        description={t("This secret is shown only once")}
        fields={[
          { label: t("Access Key"), value: secret?.accessKey ?? "" },
          { label: t("Secret Key"), value: secret?.secretKey ?? "" },
        ]}
      />
    </PageFrame>
  );
}
