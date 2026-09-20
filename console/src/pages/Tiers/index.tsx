import { CpuIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextField } from "@radix-ui/themes";
import { DataTable, FormDialog, PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useCreateTier, useDeleteTier, useTiers, useUpdateTier } from "@/hooks";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { showConfirm, showError } from "@/stores/modal";

interface TierRow {
  type: string;
  [key: string]: unknown;
}

function getConfig(row: TierRow): { name?: string; endpoint?: string } | undefined {
  const nested = row[row.type];
  return nested && typeof nested === "object" ? (nested as { name?: string; endpoint?: string }) : undefined;
}

export default function TiersPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useTiers();
  const createTier = useCreateTier();
  const deleteTier = useDeleteTier();
  const updateTier = useUpdateTier();
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");

  const create = async () => {
    try {
      await createTier.mutateAsync({ name, endpoint });
      setName("");
      setEndpoint("");
      setOpen(false);
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  const update = async () => {
    if (!editName) return;
    try {
      await updateTier.mutateAsync({ name: editName, endpoint });
      setEditName("");
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Add Failed")));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={CpuIcon} title={t("Tiers")} />
      <Toolbar>
        <Button onClick={() => setOpen(true)}>{t("Add Tier")}</Button>
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
        ]}
        actions={(row) => [
          {
            label: t("Save"),
            onSelect: () => {
              setEditName(getConfig(row)?.name ?? "");
              setEndpoint(getConfig(row)?.endpoint ?? "");
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
        <TextField.Root value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Name")} />
        <TextField.Root value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder={t("Endpoint")} />
      </FormDialog>
      <FormDialog
        open={Boolean(editName)}
        onOpenChange={(next) => {
          if (!next) setEditName("");
        }}
        title={t("Save")}
        submitLabel={t("Save")}
        cancelLabel={t("Cancel")}
        onSubmit={update}
      >
        <TextField.Root value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder={t("Endpoint")} />
      </FormDialog>
    </PageFrame>
  );
}
