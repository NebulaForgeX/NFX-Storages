import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Box, Button, Flex, Heading, Section, Text, TextField } from "@radix-ui/themes";
import { Settings2 } from "@/assets/icons/lucide";
import { PageHeader, ThemeSettings } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useHostConfigStore } from "@/stores/hostConfigStore";
import { configManager } from "@/utils/config";

function SettingsSection({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <Section size="1" py="0" aria-labelledby={id}>
      <Box mb="3">
        <Heading as="h2" id={id} size="4" mb="1">
          {title}
        </Heading>
        <Text as="p" size="2" color="gray">
          {description}
        </Text>
      </Box>
      {children}
    </Section>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation("EditPreferencePage");
  const { t: tc } = useTranslation("common");
  const serverHost = useHostConfigStore((s) => s.serverHost);
  const setServerHost = useHostConfigStore((s) => s.setServerHost);
  const resetServerHost = useHostConfigStore((s) => s.resetServerHost);
  const [value, setValue] = useState(serverHost);
  const [message, setMessage] = useState("");

  const saveHost = () => {
    let next = value.trim();
    if (next && !/^https?:\/\//.test(next)) next = `https://${next}`;
    if (next) {
      new URL(next);
      setServerHost(next);
    } else {
      resetServerHost();
    }
    setMessage(tc("Configuration saved successfully"));
  };

  const current = configManager.getCurrentHostConfig();

  return (
    <PageFrame>
      <PageHeader icon={Settings2} title={t("title")} description={t("subtitle")} />
      <Flex direction="column" gap="6" width="100%">
        <SettingsSection id="settings-theme" title={t("title")} description={t("subtitle")}>
          <ThemeSettings />
        </SettingsSection>
        <SettingsSection id="settings-host" title={t("serverHost.label")} description={t("serverHost.description")}>
          <Flex direction="column" gap="3" maxWidth="480px">
            <Text size="2" color="gray">
              {tc("Server Host")}: {current.serverHost || t("serverHost.placeholder")}
            </Text>
            <TextField.Root value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("serverHost.placeholder")} />
            <Flex gap="2">
              <Button onClick={saveHost}>{t("serverHost.save")}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetServerHost();
                  setValue("");
                }}
              >
                {t("serverHost.reset")}
              </Button>
            </Flex>
            {message ? (
              <Text size="2" color="green">
                {message}
              </Text>
            ) : null}
          </Flex>
        </SettingsSection>
      </Flex>
    </PageFrame>
  );
}
