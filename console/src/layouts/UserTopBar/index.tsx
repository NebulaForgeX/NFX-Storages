import { Settings, User } from "lucide-react";
import { Box, Container, Section, Avatar, Button, Flex, Text } from "@radix-ui/themes";
import { ProfileKindEnum } from "nfx-ui/enums";
import { useCurrentProfile } from "nfx-ui/hooks";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeNullable } from "@/utils";

import styles from "./s.module.css";

export default function UserTopBar() {
  const { t } = useTranslation("language");
  const { data, profile, kind } = useCurrentProfile();
  const accountId = safeNullable(data?.account.id);
  const displayName = resolveAccountDisplayName(profile?.displayName, accountId);
  const initial = resolveAccountInitial(profile?.displayName, accountId);
  const avatarImageId = safeNullable(profile?.avatars?.[0]?.imageId);
  const role = t(kind === ProfileKindEnum.AUTHORITY ? "sidebar.profileAuthority" : "sidebar.profileCommunity");

  return (
    <Box position="sticky" top="0" className={`${styles.barLayer} ${styles.barRule} ${styles.barFill} ${styles.barBlur}`}>
      <Container px="6">
        <Section py="4">
          <Flex align="center" justify="between" gap="4" wrap="wrap">
            <Flex align="center" gap="3" minWidth="0">
              <Avatar size="2" radius="none" src={avatarImageId ? buildImageUrl(avatarImageId) : undefined} fallback={initial} />
              <Flex direction="column" minWidth="0">
                <Text size="2" weight="bold" truncate>
                  {displayName}
                </Text>
                <Text size="1" color="gray" truncate>
                  {role} · {t("sidebar.product")}
                </Text>
              </Flex>
            </Flex>
            <Flex align="center" gap="2" wrap="wrap">
              <Button size="2" variant="outline" color="gray" onClick={() => routerEventEmitter.navigate({ to: ROUTES.USER_PROFILE_OVERVIEW })}>
                <LucideIcon icon={User} size={14} />
                {t("header.profile")}
              </Button>
              <Button size="2" variant="outline" color="gray" onClick={() => routerEventEmitter.navigate({ to: ROUTES.USER_SETTINGS })}>
                <LucideIcon icon={Settings} size={14} />
                {t("sidebar.settingsItem")}
              </Button>
            </Flex>
          </Flex>
        </Section>
      </Container>
    </Box>
  );
}
