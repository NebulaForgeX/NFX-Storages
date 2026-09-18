import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { HardDrive } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useCreateTier, useDeleteTier, useTiers } from "@/hooks/storages";
import { DataTable } from "@/components/DataTable";

interface TierRow {
  type: string;
  [key: string]: unknown;
}

function getConfig(row: TierRow): { name?: string } | undefined {
  const nested = row[row.type];
  return nested && typeof nested === "object" ? (nested as { name?: string }) : undefined;
}

export default function TiersPage() {
  const { t } = useTranslation("common");
  const { data = [], isLoading } = useTiers();
  const createTier = useCreateTier();
  const deleteTier = useDeleteTier();
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [error, setError] = useState("");

  const create = async () => {
    try {
      await createTier.mutateAsync({ name, endpoint });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Add Failed"));
    }
  };

  const remove = async (row: TierRow) => {
    const tierName = getConfig(row)?.name;
    if (!tierName || !window.confirm(t("Are you sure you want to delete this tier?"))) return;
    try {
      await deleteTier.mutateAsync(tierName);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Delete Failed"));
    }
  };

  return (
    <PageFrame>
      <PageHeader icon={HardDrive} title={t("Tiers")} />
      <Flex gap="2" wrap="wrap" mb="4">
        <TextField.Root value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} />
        <TextField.Root value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder={t("Endpoint")} />
        <Button onClick={() => void create()}>{t("Add Tier")}</Button>
      </Flex>
      {error ? <Text color="red">{error}</Text> : null}
      <DataTable
        loading={isLoading}
        empty={t("No Tiers")}
        rows={data}
        rowKey={(row) => `${row.type}-${getConfig(row)?.name ?? ""}`}
        columns={[
          { key: "type", header: t("Type") },
          {
            key: "name",
            header: t("Name"),
            render: (row) => getConfig(row)?.name ?? "-",
          },
          {
            key: "actions",
            header: t("Actions"),
            render: (row) => (
              <Button size="1" color="red" variant="outline" onClick={() => void remove(row)}>
                {t("Delete")}
              </Button>
            ),
          },
        ]}
      />
    </PageFrame>
  );
}
