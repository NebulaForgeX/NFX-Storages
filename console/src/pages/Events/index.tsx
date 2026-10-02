import { FilledBellIcon } from "nfx-ui/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components";
import { BucketSelect } from "@/components/BucketSelect";
import { PageFrame } from "@/layouts";

import { EventsPanel } from "../Buckets/panels/EventsPanel";

export default function EventsPage() {
  const { t } = useTranslation("common");
  const [bucket, setBucket] = useState("");

  return (
    <PageFrame>
      <PageHeader
        icon={FilledBellIcon}
        title={t("Events")}
        actions={<BucketSelect value={bucket} onChange={setBucket} placeholder={t("Please select bucket")} />}
      />
      <EventsPanel bucket={bucket} />
    </PageFrame>
  );
}
