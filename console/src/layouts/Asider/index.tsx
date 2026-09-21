import { AnimatedIcon, HomeIcon, LogoutIcon, RightChevron, UserIcon } from "nfx-ui/icons";

import { useEffect, useRef } from "react";
import { Avatar, Box, Button, Card, Flex, IconButton, Text } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { useCurrentProfile } from "nfx-ui/hooks";
import { clearAuth, closeAsider, useAuthStore, useLayoutStore } from "nfx-ui/stores";
import { useTranslation } from "react-i18next";

import { Logo, PreferencesPopover } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { buildImageUrl, resolveAccountDisplayName, resolveAccountInitial, safeNullable } from "@/utils";

import styles from "./s.module.css";

const MOBILE_MENU_BUTTON_ID = "header-mobile-menu-button";

function Asider() {
  const { t } = useTranslation("language");
  const isAuthValid = useAuthStore((state) => state.isAuthValid);
  const isAsiderOpen = useLayoutStore((state) => state.isAsiderOpen);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { data: accountInfo, profile } = useCurrentProfile();

  const accountId = safeNullable(accountInfo?.account.id);
  const displayName = resolveAccountDisplayName(profile?.displayName, accountId);
  const initial = resolveAccountInitial(profile?.displayName, accountId);
  const avatarImageId = safeNullable(profile?.avatars?.[0]?.imageId);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 981px)");
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeAsider();
    };

    mediaQuery.addEventListener("change", handleDesktop);
    return () => mediaQuery.removeEventListener("change", handleDesktop);
  }, [closeAsider]);

  useEffect(() => {
    if (!isAsiderOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAsider();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAsider, isAsiderOpen]);

  useEffect(() => {
    if (isAsiderOpen) {
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
      return;
    }

    const active = document.activeElement;
    if (active instanceof HTMLElement && sidebarRef.current?.contains(active)) {
      document.getElementById(MOBILE_MENU_BUTTON_ID)?.focus();
    }
  }, [isAsiderOpen]);

  const navigateFromMenu = (to: string) => {
    closeAsider();
    routerEventEmitter.navigate({ to });
  };

  return (
    <>
      <div className={`${styles.overlay} ${isAsiderOpen ? styles.overlayOpen : ""}`} role="presentation" onClick={closeAsider} aria-hidden={!isAsiderOpen} />

      <Box asChild className={`${styles.sidebar} ${isAsiderOpen ? styles.sidebarOpen : ""}`}>
        <aside
          id="mobile-asider"
          ref={sidebarRef}
          role="dialog"
          aria-modal={isAsiderOpen}
          aria-label={t("header.openMenu")}
          aria-hidden={!isAsiderOpen}
          inert={!isAsiderOpen ? true : undefined}
        >
          <Box className={styles.sidebarPx}>
            <Box className={styles.sidebarPy}>
              <Flex direction="column" gap="6" height="100%">
                <Box className={styles.sidebarHeader}>
                  <Box className={styles.sidebarHeaderPy}>
                    <Flex align="center" justify="between" gap="3">
            {isAuthValid ? (
              <Card size="1" className={styles.accountCard}>
                <Flex align="center" gap="3">
                  <Avatar size="3" radius="medium" src={avatarImageId ? buildImageUrl(avatarImageId) : undefined} fallback={initial} aria-hidden />
                  <Box>
                    <Text as="p" size="2" weight="bold">
                      {displayName}
                    </Text>
                    <Text as="p" size="1" color="gray" weight="medium">
                      {accountId ?? t("header.accountFallback")}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            ) : (
              <Logo title={APP_NAME} subtitle="Live local map" />
            )}
            <IconButton ref={closeButtonRef} variant="outline" size="2" aria-label={t("header.closeMenu")} onClick={closeAsider}>
              <AnimatedIcon icon={RightChevron} size={14} />
            </IconButton>
                    </Flex>
                  </Box>
                </Box>

          <Box className={styles.navHairline}>
          <Box pb="5">
          <Flex asChild direction="column" gap="3" className={styles.nav}>
            <nav>
              <Button type="button" variant="ghost" className={styles.navLink} onClick={() => navigateFromMenu(ROUTES.HOME)}>
                <AnimatedIcon icon={HomeIcon} size={18} aria-hidden="true" />
                <Text as="span" size="3">
                  {t("header.home")}
                </Text>
              </Button>
            </nav>
          </Flex>
          </Box>
          </Box>

          <Flex direction="column" gap="3" className={styles.actions}>
            {isAuthValid ? (
              <>
                <Button
                  className={styles.wideButton}
                  variant="outline"
                  size="2"
                  onClick={() => {
                    closeAsider();
                    routerEventEmitter.navigate({ to: ROUTES.PROFILE });
                  }}
                >
                  <AnimatedIcon icon={UserIcon} size={18} aria-hidden="true" />
                  {t("header.profile")}
                </Button>
                <Button
                  className={`${styles.wideButton} ${styles.logout}`}
                  variant="outline"
                  size="2"
                  onClick={() => {
                    clearAuth();
                    closeAsider();
                    routerEventEmitter.navigate({ to: ROUTES.LOGIN });
                  }}
                >
                  <AnimatedIcon icon={LogoutIcon} size={18} aria-hidden="true" />
                  {t("header.logout")}
                </Button>
              </>
            ) : (
              <>
                <PreferencesPopover triggerVariant="outline" />

                <Button
                  className={styles.wideButton}
                  variant="outline"
                  size="2"
                  onClick={() => {
                    closeAsider();
                    routerEventEmitter.navigate({ to: ROUTES.LOGIN });
                  }}
                >
                  {t("header.login")}
                </Button>
                <Button
                  className={styles.wideButton}
                  variant="solid"
                  size="2"
                  onClick={() => {
                    closeAsider();
                    routerEventEmitter.navigate({ to: ROUTES.SIGNUP });
                  }}
                >
                  {t("header.signup")}
                </Button>
              </>
            )}
          </Flex>
              </Flex>
            </Box>
          </Box>
        </aside>
      </Box>
    </>
  );
}

export default Asider;
