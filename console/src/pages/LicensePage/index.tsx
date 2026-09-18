import { useTranslation } from "react-i18next";

import { Card } from "@radix-ui/themes";
import { LifeBuoy } from "@/assets/icons/lucide";
import { FileText } from "lucide-react";
import { CardHeader, EmptyState, PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useLicense } from "@/hooks/storages";

export default function LicensePage() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useLicense();

  return (
    <PageFrame>
      <PageHeader icon={LifeBuoy} title={t("Enterprise License")} />
      {isLoading ? (
        <EmptyState icon={LifeBuoy} title={t("Loading")} />
      ) : (
        <Card>
          <CardHeader icon={<FileText size={18} />} title={t("License Details")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data ?? {}, null, 2)}</pre>
        </Card>
      )}
    </PageFrame>
  );
}
