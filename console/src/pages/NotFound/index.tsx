import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { PageFrame } from "@/layouts";

import { ROUTES } from "@/navigations";

export default function NotFoundPage() {
  const { t } = useTranslation("common");
  return (
    <PageFrame>
      <Flex direction="column" gap="3" align="start">
        <Heading size="6">404</Heading>
        <Text>{t("No Data")}</Text>
        <Button asChild>
          <Link to={ROUTES.BROWSER}>{t("Browser")}</Link>
        </Button>
      </Flex>
    </PageFrame>
  );
}
