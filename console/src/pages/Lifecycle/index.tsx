import { LayersIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components";
import { BucketSelect } from "@/components/BucketSelect";
import { PageFrame } from "@/layouts";

import { LifecyclePanel } from "../Buckets/panels/LifecyclePanel";

export default function LifecyclePage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");

  return (
    <PageFrame>
      <PageHeader
        icon={LayersIcon}
        title={t("Lifecycle")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <LifecyclePanel bucket={bucket} />
    </PageFrame>
  );
}
