import { FilledBellIcon, SaveIcon } from "nfx-ui/icons";
import { useEffect, useState } from "react";
import { Button, Card, Checkbox, Flex, Text } from "@radix-ui/themes";
import { useCurrentProfile, useUpdateProfileSettings } from "nfx-ui/hooks";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

export default function SystemSettings() {
  const { t } = useTranslation("pages.User.Setting", {
    keyPrefix: "systemSettings",
  });
  const { profile } = useCurrentProfile();
  const update = useUpdateProfileSettings();
  const [loginNotification, setLoginNotification] = useState(true);

  useEffect(() => {
    if (profile?.settings) {
      setLoginNotification(profile.settings.loginNotification);
      return;
    }
    setLoginNotification(true);
  }, [profile]);

  const baseline = profile?.settings?.loginNotification ?? true;
  const dirty = loginNotification !== baseline;

  return (
    <Card size="2">
      <Flex direction="column" gap="4" height="100%">
        <Flex direction="column" gap="4" flexGrow="1" align="start">
          <Text as="label" size="2">
            <Flex align="center" gap="2">
              <Checkbox checked={loginNotification} onCheckedChange={(c) => setLoginNotification(c === true)} />
              <LucideIcon icon={FilledBellIcon} size={14} />
              {t("loginEmailNotification")}
            </Flex>
          </Text>
          <Text as="p" size="1" color="gray">
            {t("loginEmailNotificationDesc")}
          </Text>
        </Flex>
        <Flex justify="end" gap="2">
          <Button size="2" disabled={!dirty || update.isPending} loading={update.isPending} onClick={() => update.mutate({ loginNotification })}>
            <LucideIcon icon={SaveIcon} size={14} />
            {t("save")}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
