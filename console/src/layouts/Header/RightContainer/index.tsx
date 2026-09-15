import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { PreferencesPopover } from "nfx-ui/components";

import { authEventEmitter, authEvents } from "@/events/auth";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import { useAuthStore } from "@/stores/authStore";

import styles from "./styles.module.css";

const RightContainer = memo(() => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.actions}>
        <PreferencesPopover />
        <div className={styles.separator} />
        <UserMenu />
      </div>
    </div>
  );
});

RightContainer.displayName = "RightContainer";
export default RightContainer;

const UserMenu = memo(() => {
  const { t } = useTranslation("components");
  const accessKey = useAuthStore((state) => state.credentials.AccessKeyId);

  const handleLogout = useCallback(() => {
    authEventEmitter.emit(authEvents.LOGOUT);
  }, []);

  const handleSettings = useCallback(() => {
    routerEventEmitter.navigate({ to: ROUTES.SETTINGS });
  }, []);

  return (
    <div className={`${styles.userAction} ${styles.controlItem}`}>
      <button className={styles.user} type="button" onClick={handleSettings}>
        <span className={styles.userName}>{accessKey || t("header.user")}</span>
      </button>
      <button className={styles.menuItem} type="button" onClick={handleLogout}>
        {t("header.logout")}
      </button>
    </div>
  );
});

UserMenu.displayName = "UserMenu";
