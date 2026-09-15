import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { Server, Settings2 } from "lucide-react";
import { CardHeader, PageHeader, ThemeSettings } from "nfx-ui/components";
import { PageFrame } from "nfx-ui/layouts";

import { useHostConfigStore } from "@/stores/hostConfigStore";
import { configManager } from "@/utils/config";

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
        <ThemeSettings />
        <Card>
          <CardHeader icon={<Server size={18} />} title={t("serverHost.label")} description={t("serverHost.description")} />
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
        </Card>
      </Flex>
    </PageFrame>
  );
}
