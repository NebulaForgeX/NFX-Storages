import { RefreshIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components";
import { BucketSelect } from "@/components/BucketSelect";
import { PageFrame } from "@/layouts";

import { ReplicationPanel } from "../Buckets/panels/ReplicationPanel";

export default function ReplicationPage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");

  return (
    <PageFrame>
      <PageHeader
        icon={RefreshIcon}
        title={t("Bucket Replication")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <ReplicationPanel bucket={bucket} />
    </PageFrame>
  );
}
