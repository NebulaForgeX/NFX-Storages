import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Flex, Heading, Text } from "@radix-ui/themes";
import { LifeBuoy } from "@/assets/icons/lucide";
import { PageHeader } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { systemRepository } from "@/apis/repositories";

export default function LicensePage() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery({
    queryKey: ["license"],
    queryFn: () => systemRepository.getLicense(),
  });

  return (
    <PageFrame>
      <PageHeader icon={LifeBuoy} title={t("Enterprise License")} />
      {isLoading ? <Text>{t("Loading")}</Text> : null}
      <Flex direction="column" gap="3">
        <Heading size="4">{t("License Details")}</Heading>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data ?? {}, null, 2)}</pre>
      </Flex>
    </PageFrame>
  );
}
