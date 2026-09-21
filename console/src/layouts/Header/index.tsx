import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Card, DropdownMenu, Flex, IconButton, Text } from "@radix-ui/themes";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { APP_NAME } from "nfx-ui/config";
import { authEventEmitter, authEvents } from "nfx-ui/events";
import { useCurrentProfile } from "nfx-ui/hooks";
import { AuthStore, clearAuth, openAsider, setHeaderHeight, useAuthStore, useLayoutStore } from "nfx-ui/stores";
import { useTranslation } from "react-i18next";

import { Logo, PreferencesPopover } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeNullable } from "@/utils";

import styles from "./s.module.css";

function Header() {
  const headerRef = useRef<Nullable<HTMLElement>>(null);
  const { t } = useTranslation("language");
  const isAuthValid = useAuthStore((state) => state.isAuthValid);
  const isAsiderOpen = useLayoutStore((state) => state.isAsiderOpen);
  const { data: accountInfo, profile } = useCurrentProfile();
  const [elevated, setElevated] = useState(false);

  const accountId = safeNullable(accountInfo?.account.id);
  const displayName = resolveAccountDisplayName(profile?.displayName, accountId);
  const initial = resolveAccountInitial(profile?.displayName, accountId);
  const avatarImageId = safeNullable(profile?.avatars?.[0]?.imageId);

  useEffect(() => {
    if (!headerRef.current) return;
    const element = headerRef.current;
    const emitHeight = () => {
      const rect = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      const marginBottom = parseFloat(computed.marginBottom) || 0;
      setHeaderHeight(rect.bottom + marginBottom);
    };
    emitHeight();
    const observer = new ResizeObserver(emitHeight);
    observer.observe(element);
    window.addEventListener("resize", emitHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", emitHeight);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className={styles.header}>
      <Box px="4">
        <Box py="3">
        <Card
          size="1"
          className={styles.bar}
          style={
            elevated
              ? {
                  boxShadow: "0 14px 40px color-mix(in oklab, var(--gray-12) 10%, transparent)",
                }
              : undefined
          }
        >
          <Flex align="center" justify="between" gap="3">
            <Logo variant="glassSquare" size="small" title={<Text className={styles.brandWord}>{APP_NAME}</Text>} subtitle="Storages" />

            <Flex align="center" gap="2" flexShrink="0">
              <IconButton
                id="header-mobile-menu-button"
                variant="outline"
                size="2"
                aria-label={t("header.openMenu")}
                aria-expanded={isAsiderOpen}
                aria-controls="mobile-asider"
                onClick={openAsider}
              >
                <HamburgerMenuIcon width={20} height={20} />
              </IconButton>
              <PreferencesPopover />

              {isAuthValid ? (
                <DropdownMenu.Root modal={false}>
                  <DropdownMenu.Trigger>
                    <Button variant="outline" color="gray" highContrast>
                      <Avatar size="1" radius="full" src={avatarImageId ? buildImageUrl(avatarImageId) : undefined} fallback={initial} />
                      <Text size="2" truncate style={{ maxWidth: 120 }}>
                        {displayName}
                      </Text>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" sideOffset={8} size="2" className={styles.accountMenu}>
                    <DropdownMenu.Label>
                      <Text size="1" color="gray" truncate style={{ maxWidth: 200 }}>
                        {displayName}
                      </Text>
                    </DropdownMenu.Label>
                    <DropdownMenu.Item onSelect={() => routerEventEmitter.navigate({ to: ROUTES.USER_OVERVIEW })}>
                      {t("header.panel")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onSelect={() => routerEventEmitter.navigate({ to: ROUTES.USER_PROFILE_OVERVIEW })}>
                      {t("header.profile")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onSelect={() => routerEventEmitter.navigate({ to: ROUTES.USER_SETTINGS })}>
                      {t("sidebar.settingsItem")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      color="red"
                      onSelect={() => {
                        const aID = AuthStore.getState().currentAccountId;
                        if (aID) authEventEmitter.emit(authEvents.LOGOUT, aID);
                        clearAuth();
                        routerEventEmitter.navigate({ to: ROUTES.LOGIN });
                      }}
                    >
                      {t("header.logout")}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              ) : (
                <>
                  <Button variant="outline" color="gray" onClick={() => routerEventEmitter.navigate({ to: ROUTES.LOGIN })}>
                    {t("header.login")}
                  </Button>
                  <Button onClick={() => routerEventEmitter.navigate({ to: ROUTES.SIGNUP })}>{t("header.signup")}</Button>
                </>
              )}
            </Flex>
          </Flex>
        </Card>
        </Box>
      </Box>
    </header>
  );
}

export default Header;
