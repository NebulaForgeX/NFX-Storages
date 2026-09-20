import { HeartIcon } from "nfx-ui/icons";
import { useTranslation } from "react-i18next";

import { EmptyState, PageHeader, PropertyList } from "@/components";
import { PageFrame } from "@/layouts";

import { useLicense } from "@/hooks";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export default function LicensePage() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useLicense();
  const license = asRecord(data);

  return (
    <PageFrame>
      <PageHeader icon={HeartIcon} title={t("Enterprise License")} />
      {isLoading ? (
        <EmptyState icon={HeartIcon} title={t("Loading")} />
      ) : (
        <PropertyList
          items={[
            { label: t("Plan"), value: String(license.plan ?? "-") },
            { label: t("Organization"), value: String(license.organization ?? "-") },
            { label: t("Email"), value: String(license.email || "-") },
          ]}
        />
      )}
    </PageFrame>
  );
}
