import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { LayoutFrame, type SidebarMenuItem } from "nfx-ui/layouts";
import { Logo } from "nfx-ui/components";
import {
  ArrowLeftRight,
  Activity,
  Bell,
  Database,
  FileKey,
  FolderOpen,
  HardDrive,
  KeyRound,
  Layers,
  LifeBuoy,
  Repeat,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "@/assets/icons/lucide";

import { authEventEmitter, authEvents } from "@/events/auth";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";
import RightContainer from "./Header/RightContainer";

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

function useSidebarItems(): SidebarMenuItem[] {
  const { t } = useTranslation("components");
  return useMemo(
    () => [
      { label: t("sidebar.browser"), path: ROUTES.BROWSER, icon: <FolderOpen size={20} /> },
      { label: t("sidebar.accessKeys"), path: ROUTES.ACCESS_KEYS, icon: <KeyRound size={18} /> },
      { label: t("sidebar.policies"), path: ROUTES.POLICIES, icon: <ShieldCheck size={18} /> },
      { label: t("sidebar.users"), path: ROUTES.USERS, icon: <Users size={18} /> },
      { label: t("sidebar.userGroups"), path: ROUTES.USER_GROUPS, icon: <Users size={18} /> },
      { label: t("sidebar.importExport"), path: ROUTES.IMPORT_EXPORT, icon: <ArrowLeftRight size={18} /> },
      { label: t("sidebar.performance"), path: ROUTES.PERFORMANCE, icon: <Activity size={18} /> },
      { label: t("sidebar.pools"), path: ROUTES.POOLS, icon: <HardDrive size={18} /> },
      {
        label: t("sidebar.bucketSetting"),
        path: ROUTES.EVENTS,
        icon: <Settings size={18} />,
        children: [
          { label: t("sidebar.events"), path: ROUTES.EVENTS, icon: <Bell size={16} /> },
          { label: t("sidebar.replication"), path: ROUTES.REPLICATION, icon: <Repeat size={16} /> },
          { label: t("sidebar.lifecycle"), path: ROUTES.LIFECYCLE, icon: <Layers size={16} /> },
        ],
      },
      { label: t("sidebar.tiers"), path: ROUTES.TIERS, icon: <HardDrive size={18} /> },
      { label: t("sidebar.eventsTarget"), path: ROUTES.EVENTS_TARGET, icon: <Database size={18} /> },
      { label: t("sidebar.sse"), path: ROUTES.SSE, icon: <FileKey size={18} /> },
      { label: t("sidebar.license"), path: ROUTES.LICENSE, icon: <LifeBuoy size={18} /> },
      { label: t("sidebar.settings"), path: ROUTES.SETTINGS, icon: <Shield size={18} /> },
    ],
    [t],
  );
}

export const ConsoleLayout = memo(({ children }: ConsoleLayoutProps) => {
  const { t } = useTranslation("components");
  const location = useLocation();
  const sidebarItems = useSidebarItems();

  const onSidebarNavigate = useCallback((path: string) => {
    routerEventEmitter.navigate({ to: path });
  }, []);

  const onSidebarLogout = useCallback(() => {
    authEventEmitter.emit(authEvents.LOGOUT);
  }, []);

  return (
    <LayoutFrame
      headerLeft={<Logo title="NFX" subtitle="Storage" alt="NFX" onClick={() => routerEventEmitter.navigateToDashboard()} />}
      headerRight={<RightContainer />}
      sidebarItems={sidebarItems}
      sidebarCurrentPathname={location.pathname}
      onSidebarNavigate={onSidebarNavigate}
      sidebarLogoutLabel={t("header.logout")}
      onSidebarLogout={onSidebarLogout}
    >
      {children}
    </LayoutFrame>
  );
});

ConsoleLayout.displayName = "ConsoleLayout";
export default ConsoleLayout;
