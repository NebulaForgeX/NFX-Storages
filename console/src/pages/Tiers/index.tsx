import { CpuIcon } from "nfx-ui/icons";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateTier, useDeleteTier, useTiers, useUpdateTier, type S3TierInput } from "@/hooks";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { showConfirm, showError } from "@/stores/modal";

interface TierRow {
  type: string;
  [key: string]: unknown;
}

interface S3Config extends S3TierInput {}

const emptyTier = (): S3TierInput => ({
  name: "",
  endpoint: "",
  bucket: "",
  prefix: "",
  region: "us-east-1",
  accesskey: "",
  secretkey: "",
});

function getConfig(row: TierRow): S3Config | undefined {
  const nested = row[row.type];
  return nested && typeof nested === "object" ? (nested as S3Config) : undefined;
}

function TierFields({ value, onChange, lockName = false }: { value: S3TierInput; onChange: (next: S3TierInput) => void; lockName?: boolean }) {
  const { t } = useTranslation("common");
  const set = (key: keyof S3TierInput) => (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: event.target.value });

  return (
    <>
      {lockName ? null : <TextField.Root value={value.name} onChange={set("name")} placeholder={t("Name")} />}
      <TextField.Root value={value.endpoint} onChange={set("endpoint")} placeholder={t("Endpoint")} />
      <TextField.Root value={value.bucket} onChange={set("bucket")} placeholder={t("Bucket")} />
      <TextField.Root value={value.prefix} onChange={set("prefix")} placeholder={t("Prefix")} />
      <TextField.Root value={value.region} onChange={set("region")} placeholder={t("Region")} />
      <TextField.Root value={value.accesskey} onChange={set("accesskey")} placeholder={t("Access Key")} />
      <TextField.Root type="password" value={value.secretkey} onChange={set("secretkey")} placeholder={t("Secret Key")} />
    </>
  );
}

export default function TiersPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useTiers();
  const createTier = useCreateTier();
  const deleteTier = useDeleteTier();
  const updateTier = useUpdateTier();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<S3TierInput>(emptyTier);
  const [editName, setEditName] = useState("");

  const create = async () => {
    try {
      await createTier.mutateAsync(draft);
      setDraft(emptyTier());
      setOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const update = async () => {
    if (!editName) return;
    try {
      await updateTier.mutateAsync({ ...draft, name: editName });
      setEditName("");
      setDraft(emptyTier());
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={CpuIcon} title={t("Tiers")} />
      <Toolbar>
        <Button
          onClick={() => {
            setDraft(emptyTier());
            setOpen(true);
          }}
        >
          {t("Add Tier")}
        </Button>
      </Toolbar>
      <DataTable
        loading={isLoading}
        empty={t("No Tiers")}
        emptyIcon={CpuIcon}
        rows={data}
        rowKey={(row) => `${row.type}-${getConfig(row)?.name ?? ""}`}
        columns={[
          { key: "type", header: t("Type") },
          { key: "name", header: t("Name"), render: (row) => getConfig(row)?.name ?? "-" },
          { key: "endpoint", header: t("Endpoint"), render: (row) => getConfig(row)?.endpoint ?? "-" },
          { key: "bucket", header: t("Bucket"), render: (row) => getConfig(row)?.bucket ?? "-" },
          { key: "region", header: t("Region"), render: (row) => getConfig(row)?.region ?? "-" },
        ]}
        actions={(row) => [
          {
            label: t("Save"),
            onSelect: () => {
              const config = getConfig(row);
              setEditName(config?.name ?? "");
              setDraft({
                name: config?.name ?? "",
                endpoint: config?.endpoint ?? "",
                bucket: config?.bucket ?? "",
                prefix: config?.prefix ?? "",
                region: config?.region ?? "us-east-1",
                accesskey: config?.accesskey ?? "",
                secretkey: config?.secretkey ?? "",
              });
            },
          },
          {
            label: t("Delete"),
            color: "red",
            onSelect: () => {
              const tierName = getConfig(row)?.name;
              if (!tierName) return;
              showConfirm({
                title: t("Delete"),
                message: t("Are you sure you want to delete this tier?"),
                confirmText: t("Delete"),
                cancelText: t("Cancel"),
                onConfirm: () => {
                  void deleteTier.mutateAsync(tierName).catch((err) => showError(getStoragesApiErrorMessage(err, t("Delete Failed"))));
                },
              });
            },
          },
        ]}
      />
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Add Tier")}
        submitLabel={t("Add Tier")}
        cancelLabel={t("Cancel")}
        submitting={createTier.isPending}
        onSubmit={create}
      >
        <TierFields value={draft} onChange={setDraft} />
      </FormDialog>
      <FormDialog
        open={Boolean(editName)}
        onOpenChange={(next) => {
          if (!next) setEditName("");
        }}
        title={t("Save")}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        submitting={updateTier.isPending}
        onSubmit={update}
      >
        <TierFields value={draft} onChange={setDraft} lockName />
      </FormDialog>
    </PageFrame>
  );
}
