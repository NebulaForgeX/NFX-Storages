import { FileDescriptionIcon, HeartIcon } from "nfx-ui/icons";
import { useTranslation } from "react-i18next";

import { Card } from "@radix-ui/themes";
import { CardHeader, EmptyState, PageHeader } from "@/components";
import { PageFrame } from "@/layouts";

import { useLicense } from "@/hooks";

export default function LicensePage() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useLicense();

  return (
    <PageFrame>
      <PageHeader icon={HeartIcon} title={t("Enterprise License")} />
      {isLoading ? (
        <EmptyState icon={HeartIcon} title={t("Loading")} />
      ) : (
        <Card>
          <CardHeader icon={<FileDescriptionIcon size={18} />} title={t("License Details")} />
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data ?? {}, null, 2)}</pre>
        </Card>
      )}
    </PageFrame>
  );
}
