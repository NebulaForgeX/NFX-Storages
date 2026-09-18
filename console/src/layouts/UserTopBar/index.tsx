import { Avatar, Button, Flex, Text } from "@radix-ui/themes";
import { Settings, UserRound } from "lucide-react";
import { useCurrentProfile } from "nfx-ui/hooks";

import { LucideIcon } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeNullable } from "@/utils";

import styles from "./s.module.css";

export default function UserTopBar() {
  const { data, profile, kind } = useCurrentProfile();
  const accountId = safeNullable(data?.account.id);
  const displayName = resolveAccountDisplayName(profile?.displayName, accountId);
  const initial = resolveAccountInitial(profile?.displayName, accountId);
  const avatarImageId = safeNullable(profile?.avatars?.[0]?.imageId);

  return (
    <Flex align="center" justify="between" gap="3" wrap="wrap" py="3" px="4" position="sticky" top="0" className={styles.bar}>
      <Flex align="center" gap="3" minWidth="0">
        <Avatar size="2" radius="full" src={avatarImageId ? buildImageUrl(avatarImageId) : undefined} fallback={initial} />
        <Flex direction="column" minWidth="0">
          <Text size="2" weight="bold" truncate>
            {displayName}
          </Text>
          <Text size="1" color="gray" truncate>
            {kind} · Identity
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap="2" wrap="wrap">
        <Button size="2" variant="soft" color="gray" onClick={() => routerEventEmitter.navigate({ to: ROUTES.USER_PROFILE_OVERVIEW })}>
          <LucideIcon icon={UserRound} size={14} />
          Profile
        </Button>
        <Button size="2" variant="soft" color="gray" onClick={() => routerEventEmitter.navigate({ to: ROUTES.USER_SETTINGS })}>
          <LucideIcon icon={Settings} size={14} />
          Settings
        </Button>
      </Flex>
    </Flex>
  );
}
