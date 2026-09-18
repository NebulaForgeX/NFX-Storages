import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Card, Flex, Text } from "@radix-ui/themes";
import { ArrowLeftRight, Download, Upload } from "lucide-react";
import { CardHeader, EmptyState, PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useExportIam, useImportIam } from "@/hooks/storages";
import { exportFile } from "@/utils/export-file";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";

export default function ImportExportPage() {
  const { t } = useTranslation("common");
  const fileRef = useRef<HTMLInputElement>(null);
  const exportIam = useExportIam();
  const importIam = useImportIam();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const runExport = async () => {
    setError("");
    try {
      const blob = await exportIam.mutateAsync();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      exportFile(
        { data: blob, headers: { "content-type": "application/zip", filename: encodeURIComponent(`iam-config-export-${timestamp}.zip`) } },
        `iam-config-export-${timestamp}.zip`,
      );
      setMessage(t("IAM configuration exported successfully"));
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Failed to export IAM configuration")));
    }
  };

  const runImport = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      await importIam.mutateAsync(file);
      setMessage(t("IAM configuration imported successfully"));
    } catch (err) {
      setError(getStoragesApiErrorMessage(err, t("Failed to import IAM configuration")));
    }
  };

  const pending = exportIam.isPending || importIam.isPending;

  return (
    <PageFrame>
      <PageHeader icon={ArrowLeftRight} title={t("Import/Export")} />
      <Flex direction="column" gap="5" maxWidth="640px">
        <Card>
          <CardHeader icon={<Download size={18} />} title={t("IAM Configuration Export")} />
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              {t("Export all IAM configurations including users, groups, policies, and access keys in a ZIP file.")}
            </Text>
            <Button disabled={pending} onClick={() => void runExport()}>
              {t("Export")}
            </Button>
          </Flex>
        </Card>
        <Card>
          <CardHeader icon={<Upload size={18} />} title={t("Import")} />
          <input ref={fileRef} type="file" accept=".zip" hidden onChange={(e) => void runImport(e.target.files?.[0])} />
          <Button variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
            {t("Import")}
          </Button>
        </Card>
        {message ? <Text color="green">{message}</Text> : null}
        {error ? <EmptyState icon={ArrowLeftRight} title={error} /> : null}
      </Flex>
    </PageFrame>
  );
}
