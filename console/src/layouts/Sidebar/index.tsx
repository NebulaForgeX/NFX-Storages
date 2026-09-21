import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Flex, IconButton, Text } from "@radix-ui/themes";
import { AnimatedIcon, type AnimatedIconComponent, ArrowNarrowLeftIcon, ArrowNarrowUpIcon, CpuIcon, DownChevron, FilledBellIcon, GaugeIcon, GearIcon, HeartIcon, LayersIcon, LockIcon, LogoutIcon, PassportIcon, PenIcon, RefreshIcon, RightChevron, ShieldCheck, Stack3Icon, StackIcon, UnorderedListIcon, UserIcon, UsersIcon } from "nfx-ui/icons";
import { ProfileKindEnum } from "nfx-ui/enums";
import { authEventEmitter, authEvents } from "nfx-ui/events";
import { useCurrentProfile } from "nfx-ui/hooks";
import { AuthStore, clearAuth } from "nfx-ui/stores";
import { useTranslation } from "react-i18next";
import { Menu, Sidebar as ProSidebar } from "react-pro-sidebar";
import { Link, Outlet, useLocation } from "react-router";

import { ROUTES } from "@/navigations";
import { buildImageUrl, resolveAccountDisplayName, safeNullable } from "@/utils";

import { MenuItem, SidebarMenuState, SubMenu } from "./menu";
import styles from "./s.module.css";

const SIDEBAR_WIDTH = "234px";
const SIDEBAR_COLLAPSED_WIDTH = "84px";

function MenuLabel({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <Text as="span" size="2" weight={active ? "bold" : "medium"}>
      {children}
    </Text>
  );
}

function SectionTitle({ label, icon }: { label: string; icon: AnimatedIconComponent }) {
  return (
    <Box className={styles.sectionTitleHairline}>
      <Box className={styles.sectionTitleY}>
        <Box className={styles.sectionTitleX}>
          <Flex align="center" justify="between" gap="2" className={styles.sectionTitle}>
            <Text as="span" size="2" weight="bold">
              {label}
            </Text>
            <AnimatedIcon icon={icon} size={16} className={styles.sectionTitleIcon} />
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

function createMenuItemStyles(collapsed: boolean) {
  return {
    button: ({ active, level = 0 }: { active: boolean; level?: number }) => ({
      height: level > 0 ? "34px" : "40px",
      margin: level > 0 ? (collapsed ? "3px 7px" : "3px 0 3px 32px") : "6px 0",
      borderRadius: "var(--radius-chip)",
      paddingLeft: level > 0 ? "11px" : "10px",
      paddingRight: "10px",
      fontSize: level > 0 ? "14px" : "15px",
      fontWeight: 400,
      color: active ? "var(--accent-11)" : "var(--gray-11)",
      backgroundColor: active ? "var(--accent-a3)" : "transparent",
      transition: "background-color 150ms ease, color 150ms ease",
      "&:hover": { backgroundColor: active ? "var(--accent-a3)" : "var(--gray-a3)", color: active ? "var(--accent-11)" : "var(--gray-12)" },
      "&:focus-visible": {
        outline: "2px solid var(--accent-8)",
        outlineOffset: "2px",
      },
    }),
    icon: ({ level = 0 }: { level?: number }) => ({
      width: "20px",
      minWidth: "20px",
      height: "20px",
      marginRight: "10px",
      color: "inherit",
      ...(level > 0 ? { display: "none" } : {}),
    }),
    subMenuContent: {
      backgroundColor: collapsed ? "var(--color-panel-solid)" : "transparent",
      padding: collapsed ? "5px 0" : "0",
      ...(collapsed
        ? {
            zIndex: 1000,
            minWidth: "156px",
            width: "max-content",
            maxWidth: "260px",
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto" as const,
            borderRadius: "var(--radius-4)",
            border: "1px solid var(--gray-a5)",
            boxShadow: "var(--shadow-5)",
          }
        : {}),
    },
  };
}

interface SectionProps {
  collapsed: boolean;
  broken: boolean;
  onMobileClose: () => void;
}

function OverviewSection({ collapsed, broken, onMobileClose }: SectionProps) {
  const { t } = useTranslation("language");
  const location = useLocation();
  const active = location.pathname === ROUTES.BROWSER || location.pathname.startsWith(`${ROUTES.BROWSER}/`);

  return (
    <Menu renderExpandIcon={({ open }) => <AnimatedIcon icon={open ? ArrowNarrowUpIcon : DownChevron} size={14} />} menuItemStyles={createMenuItemStyles(collapsed)} closeOnClick>
      <MenuItem component={<Link to={ROUTES.BROWSER} />} icon={<AnimatedIcon icon={StackIcon} size={18} />} active={active} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={active}>{t("sidebar.browser")}</MenuLabel>
      </MenuItem>
    </Menu>
  );
}

function MainMenuSection({ collapsed, broken, onMobileClose }: SectionProps) {
  const { t } = useTranslation("language");
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(() => location.pathname.startsWith(ROUTES.PROFILE));
  const [bucketOpen, setBucketOpen] = useState(
    () => location.pathname === ROUTES.EVENTS || location.pathname === ROUTES.REPLICATION || location.pathname === ROUTES.LIFECYCLE,
  );

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  const profileSubItems = [
    {
      key: "profileOverview",
      to: ROUTES.USER_PROFILE_OVERVIEW,
      icon: <AnimatedIcon icon={UserIcon} size={16} />,
      label: t("sidebar.profileOverview"),
    },
    {
      key: "profileEdit",
      to: ROUTES.USER_PROFILE_EDIT,
      icon: <AnimatedIcon icon={PenIcon} size={16} />,
      label: t("sidebar.profileEdit"),
    },
    {
      key: "profileIdentities",
      to: ROUTES.USER_PROFILE_IDENTITIES,
      icon: <AnimatedIcon icon={PassportIcon} size={16} />,
      label: t("sidebar.profileIdentities"),
    },
  ];

  const bucketSubItems = [
    { key: "events", to: ROUTES.EVENTS, icon: <AnimatedIcon icon={FilledBellIcon} size={16} />, label: t("sidebar.bucketEvents") },
    { key: "replication", to: ROUTES.REPLICATION, icon: <AnimatedIcon icon={RefreshIcon} size={16} />, label: t("sidebar.replication") },
    { key: "lifecycle", to: ROUTES.LIFECYCLE, icon: <AnimatedIcon icon={LayersIcon} size={16} />, label: t("sidebar.lifecycle") },
  ];

  const isProfileChildActive = profileSubItems.some((item) => isActive(item.to));
  const isBucketChildActive = bucketSubItems.some((item) => isActive(item.to));

  return (
    <Menu renderExpandIcon={({ open }) => <AnimatedIcon icon={open ? ArrowNarrowUpIcon : DownChevron} size={14} />} menuItemStyles={createMenuItemStyles(collapsed)} closeOnClick>
      <SectionTitle label={t("sidebar.mainMenu")} icon={LayersIcon} />
      <SubMenu label={t("sidebar.profile")} icon={<AnimatedIcon icon={UserIcon} size={18} />} open={profileOpen} onOpenChange={setProfileOpen} active={isProfileChildActive}>
        {profileSubItems.map((item) => (
          <MenuItem key={item.key} component={<Link to={item.to} />} icon={item.icon} active={isActive(item.to)} onClick={() => broken && onMobileClose()}>
            <MenuLabel active={isActive(item.to)}>{item.label}</MenuLabel>
          </MenuItem>
        ))}
      </SubMenu>
      <MenuItem component={<Link to={ROUTES.ACCESS_KEYS} />} icon={<AnimatedIcon icon={LockIcon} size={18} />} active={isActive(ROUTES.ACCESS_KEYS)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.ACCESS_KEYS)}>{t("sidebar.accessKeys")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.POLICIES} />} icon={<AnimatedIcon icon={ShieldCheck} size={18} />} active={isActive(ROUTES.POLICIES)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.POLICIES)}>{t("sidebar.policies")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.USERS} />} icon={<AnimatedIcon icon={UsersIcon} size={18} />} active={isActive(ROUTES.USERS)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.USERS)}>{t("sidebar.users")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.USER_GROUPS} />} icon={<AnimatedIcon icon={UsersIcon} size={18} />} active={isActive(ROUTES.USER_GROUPS)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.USER_GROUPS)}>{t("sidebar.userGroups")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.IMPORT_EXPORT} />} icon={<AnimatedIcon icon={RefreshIcon} size={18} />} active={isActive(ROUTES.IMPORT_EXPORT)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.IMPORT_EXPORT)}>{t("sidebar.importExport")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.PERFORMANCE} />} icon={<AnimatedIcon icon={GaugeIcon} size={18} />} active={isActive(ROUTES.PERFORMANCE)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.PERFORMANCE)}>{t("sidebar.performance")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.POOLS} />} icon={<AnimatedIcon icon={CpuIcon} size={18} />} active={isActive(ROUTES.POOLS)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.POOLS)}>{t("sidebar.pools")}</MenuLabel>
      </MenuItem>
      <SubMenu label={t("sidebar.bucketSetting")} icon={<AnimatedIcon icon={GearIcon} size={18} />} open={bucketOpen} onOpenChange={setBucketOpen} active={isBucketChildActive}>
        {bucketSubItems.map((item) => (
          <MenuItem key={item.key} component={<Link to={item.to} />} icon={item.icon} active={isActive(item.to)} onClick={() => broken && onMobileClose()}>
            <MenuLabel active={isActive(item.to)}>{item.label}</MenuLabel>
          </MenuItem>
        ))}
      </SubMenu>
      <MenuItem component={<Link to={ROUTES.TIERS} />} icon={<AnimatedIcon icon={CpuIcon} size={18} />} active={isActive(ROUTES.TIERS)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.TIERS)}>{t("sidebar.tiers")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.EVENTS_TARGET} />} icon={<AnimatedIcon icon={Stack3Icon} size={18} />} active={isActive(ROUTES.EVENTS_TARGET)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.EVENTS_TARGET)}>{t("sidebar.eventsTarget")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.SSE} />} icon={<AnimatedIcon icon={LockIcon} size={18} />} active={isActive(ROUTES.SSE)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.SSE)}>{t("sidebar.sse")}</MenuLabel>
      </MenuItem>
      <MenuItem component={<Link to={ROUTES.LICENSE} />} icon={<AnimatedIcon icon={HeartIcon} size={18} />} active={isActive(ROUTES.LICENSE)} onClick={() => broken && onMobileClose()}>
        <MenuLabel active={isActive(ROUTES.LICENSE)}>{t("sidebar.license")}</MenuLabel>
      </MenuItem>
    </Menu>
  );
}

function SettingsSection({ collapsed, broken, onMobileClose }: SectionProps) {
  const { t } = useTranslation("language");
  const location = useLocation();
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Menu renderExpandIcon={({ open }) => <AnimatedIcon icon={open ? ArrowNarrowUpIcon : DownChevron} size={14} />} menuItemStyles={createMenuItemStyles(collapsed)} closeOnClick>
      <SectionTitle label={t("sidebar.settings")} icon={GearIcon} />
      <MenuItem
        component={<Link to={ROUTES.USER_SETTINGS} />}
        icon={<AnimatedIcon icon={GearIcon} size={18} />}
        active={isActive(ROUTES.USER_SETTINGS)}
        onClick={() => broken && onMobileClose()}
      >
        <MenuLabel active={isActive(ROUTES.USER_SETTINGS)}>{t("sidebar.settingsItem")}</MenuLabel>
      </MenuItem>
    </Menu>
  );
}

function Sidebar() {
  const { t } = useTranslation("language");
  const [desktopCollapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [broken, setBroken] = useState(false);
  const collapsed = !broken && desktopCollapsed;
  const drawerRef = useRef<HTMLHtmlElement>(null);
  useEffect(() => {
    if (!broken || !toggled) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']") ?? []).filter(
        (node) => node.getClientRects().length && getComputedStyle(node).visibility !== "hidden",
      );
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setToggled(false);
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [broken, toggled]);

  const { kind, data, profile } = useCurrentProfile();

  const accountId = safeNullable(data?.account.id);
  const displayName = resolveAccountDisplayName(profile?.displayName, accountId);
  const avatarImageId = safeNullable(profile?.avatars?.[0]?.imageId);

  const closeMobile = () => broken && setToggled(false);

  const handleLogout = () => {
    const aID = AuthStore.getState().currentAccountId;
    if (aID) authEventEmitter.emit(authEvents.LOGOUT, aID);
    clearAuth();
  };

  return (
    <Flex minHeight="100dvh" width="100%" className={styles.shell}>
      <SidebarMenuState collapsed={collapsed}>
        <ProSidebar
          ref={drawerRef}
          inert={broken && !toggled ? true : undefined}
          aria-hidden={broken && !toggled ? true : undefined}
          collapsed={collapsed}
          toggled={toggled}
          onBackdropClick={() => setToggled(false)}
          onBreakPoint={setBroken}
          breakPoint="md"
          width={SIDEBAR_WIDTH}
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          rootStyles={{
            border: 0,
            height: "100dvh",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            margin: 0,
            zIndex: 200,
            overflow: "visible",
            "&.ps-broken.ps-toggled": { left: 0 },
            "&.ps-broken": { height: "100dvh", position: "fixed", margin: 0, top: 0, bottom: 0 },
            "& .ps-sidebar-container": {
              background: "transparent",
              height: "100%",
              overflow: "visible",
            },
          }}
        >
          <Flex direction="column" height="100%" minHeight="0" className={styles.sidebar}>
            <div className={styles.header}>
              <div className={styles.headerHairline}>
                <div className={styles.headerPy}>
              <Button type="button" variant="ghost" className={styles.accountCard} aria-label={displayName}>
                <Avatar
                  size="3"
                  className={styles.avatar}
                  src={avatarImageId ? buildImageUrl(avatarImageId) : undefined}
                  fallback={<UserIcon size={20} />}
                  alt=""
                  aria-hidden="true"
                />
                {!collapsed && (
                  <span className={styles.accountInfo}>
                    <span className={styles.accountRole}>{t(kind === ProfileKindEnum.AUTHORITY ? "sidebar.profileAuthority" : "sidebar.profileCommunity")}</span>
                    <span className={styles.accountName}>{displayName}</span>
                  </span>
                )}
              </Button>
              <IconButton
                variant="outline"
                size="1"
                className={styles.toggle}
                aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
                aria-expanded={!collapsed}
                onClick={() => (broken ? setToggled(false) : setCollapsed((value) => !value))}
              >
                <AnimatedIcon icon={collapsed ? RightChevron : ArrowNarrowLeftIcon} size={14} />
              </IconButton>
                </div>
              </div>
            </div>

            <Box flexGrow="1" minHeight="0" className={`${styles.menuArea} ${collapsed ? styles.menuAreaCollapsed : ""}`}>
              <Box className={styles.menuAreaPx}>
                <Box className={styles.menuAreaPy}>
              <OverviewSection collapsed={collapsed} broken={broken} onMobileClose={closeMobile} />
              <MainMenuSection collapsed={collapsed} broken={broken} onMobileClose={closeMobile} />
              <SettingsSection collapsed={collapsed} broken={broken} onMobileClose={closeMobile} />
                </Box>
              </Box>
            </Box>

            <div className={`${styles.footer} ${collapsed ? styles.footerCollapsed : ""}`}>
              <div className={styles.footerPx}>
                <div className={styles.footerPy}>
              <Button
                variant="ghost"
                className={`${styles.logout} ${collapsed ? styles.logoutCollapsed : ""}`}
                onClick={handleLogout}
                aria-label={t("sidebar.logout")}
                title={collapsed ? t("sidebar.logout") : undefined}
              >
                <AnimatedIcon icon={LogoutIcon} size={18} />
                {!collapsed && t("sidebar.logout")}
              </Button>
                </div>
              </div>
            </div>
          </Flex>
        </ProSidebar>
      </SidebarMenuState>

      <Flex direction="column" flexGrow="1" minWidth="0" inert={broken && toggled ? true : undefined} className={styles.content}>
        {broken ? (
          <IconButton variant="surface" color="gray" size="3" className={styles.mobileToggle} onClick={() => setToggled(true)} aria-label={t("sidebar.openMenu")}>
            <AnimatedIcon icon={UnorderedListIcon} size={18} />
          </IconButton>
        ) : null}
        <Box flexGrow="1" minWidth="0" minHeight="0" className={styles.contentInner}>
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

export default Sidebar;
