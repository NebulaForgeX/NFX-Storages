import { RefreshIcon } from "nfx-ui/icons";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button, Text } from "@radix-ui/themes";
import { PageHeader, Toolbar } from "@/components";
import { PageFrame } from "@/layouts";

import { useExportIam, useImportIam } from "@/hooks";
import { exportFile } from "@/utils/export-file";
import { getStoragesApiErrorMessage } from "@/utils/error-handler";
import { showError, showSuccess } from "@/stores/modal";

export default function ImportExportPage() {
  const { t } = useTranslation("common");
  const fileRef = useRef<HTMLInputElement>(null);
  const exportIam = useExportIam();
  const importIam = useImportIam();

  const runExport = async () => {
    try {
      const blob = await exportIam.mutateAsync();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      exportFile(
        { data: blob, headers: { "content-type": "application/zip", filename: encodeURIComponent(`iam-config-export-${timestamp}.zip`) } },
        `iam-config-export-${timestamp}.zip`,
      );
      showSuccess(t("IAM configuration exported successfully"));
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Failed to export IAM configuration")));
    }
  };

  const runImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      await importIam.mutateAsync(file);
      showSuccess(t("IAM configuration imported successfully"));
    } catch (err) {
      showError(getStoragesApiErrorMessage(err, t("Failed to import IAM configuration")));
    }
  };

  const pending = exportIam.isPending || importIam.isPending;

  return (
    <PageFrame>
      <PageHeader
        icon={RefreshIcon}
        title={t("Import/Export")}
        description={t("Export all IAM configurations including users, groups, policies, and access keys in a ZIP file.")}
      />
      <Toolbar>
        <input ref={fileRef} type="file" accept=".zip" hidden onChange={(event) => void runImport(event.target.files?.[0])} />
        <Button disabled={pending} onClick={() => void runExport()}>
          {t("Export")}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
          {t("Import")}
        </Button>
      </Toolbar>
      <Text size="2" color="gray">
        {t("Import")} / {t("Export")}
      </Text>
    </PageFrame>
  );
}
