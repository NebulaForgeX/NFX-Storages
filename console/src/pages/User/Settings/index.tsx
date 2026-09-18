import type { ReactNode } from "react";

import { Flex, Heading, Section, Text } from "@radix-ui/themes";
import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader, Suspense } from "@/components";
import { PageFrame } from "@/layouts";

import { SystemSettings, ThemeSettings } from "./components";

function SettingsSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <Section size="1" py="0" aria-labelledby={id}>
      <Flex direction="column" gap="1" mb="3">
        <Heading as="h2" id={id} size="4">
          {title}
        </Heading>
        <Text as="p" size="2" color="gray">
          {description}
        </Text>
      </Flex>
      {children}
    </Section>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation("pages.User.Setting");

  return (
    <PageFrame>
      <PageHeader icon={Settings2} title={t("title")} description={t("description")} />

      <Flex direction="column" gap="6" width="100%">
        <SettingsSection id="settings-theme" title={t("sections.theme.title")} description={t("sections.theme.description")}>
          <ThemeSettings />
        </SettingsSection>

        <SettingsSection id="settings-system" title={t("sections.system.title")} description={t("sections.system.description")}>
          <Suspense>
            <SystemSettings />
          </Suspense>
        </SettingsSection>
      </Flex>
    </PageFrame>
  );
}
