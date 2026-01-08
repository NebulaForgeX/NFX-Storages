import type { ReactNode } from "react";
import type { SidebarProps as ProSidebarProps } from "react-pro-sidebar";

import { memo } from "react";
import {
  Coffee,
  Edit,
  Eye,
  FolderTree,
  Home,
  LayoutGrid,
  Leaf,
  Package,
  Plus,
  Shield,
  User,
} from "@/assets/icons/lucide";
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";

import { isActiveRoute, ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SidebarProps extends ProSidebarProps {
  children?: ReactNode;
  collapsed?: boolean;
  toggled?: boolean;
  onBackdropClick?: () => void;
  className?: string;
}

const Sidebar = memo(
  ({ children, collapsed = false, toggled = false, onBackdropClick, breakPoint = "all", className }: SidebarProps) => {
    const location = useLocation();

    return (
      <ProSidebar
        collapsed={collapsed}
        toggled={toggled}
        onBackdropClick={onBackdropClick}
        breakPoint={breakPoint}
        backgroundColor="var(--color-bg-2)"
        rootStyles={{
          border: "none",
          borderRight: "1px solid var(--color-separator)",
        }}
        className={`${styles.sidebar} ${className || ""}`}
      >
        <div className={styles.sidebarContent}>
          {children || (
            <Menu
              key={`${collapsed}-${toggled}`} //! Prevent re-rendering when collapsed/toggled changes; Do not remove this!
              transitionDuration={300}
              closeOnClick
              menuItemStyles={{
                button: {
                  color: "var(--color-fg-text)",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "var(--color-bg-3)",
                    color: "var(--color-fg-text)",
                  },
                  "&.active": {
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                  },
                },
                icon: {
                  color: "var(--color-fg-text)",
                  "&.active": {
                    color: "#ffffff",
                  },
                },
                label: {
                  color: "var(--color-fg-text)",
                  "&.active": {
                    color: "#ffffff",
                  },
                },
              }}
            >
              <MenuItem
                icon={<Home size={20} />}
                component={<Link to={ROUTES.DASHBOARD} />}
                active={
                  isActiveRoute(location.pathname, ROUTES.DASHBOARD) || isActiveRoute(location.pathname, ROUTES.HOME)
                }
              >
                仪表盘
              </MenuItem>

              <SubMenu
                label="个人中心"
                icon={<User size={20} />}
                active={
                  isActiveRoute(location.pathname, ROUTES.PROFILE) ||
                  isActiveRoute(location.pathname, ROUTES.EDIT_PROFILE) ||
                  isActiveRoute(location.pathname, ROUTES.ACCOUNT_SECURITY)
                }
              >
                <MenuItem
                  icon={<Eye size={18} />}
                  component={<Link to={ROUTES.PROFILE} />}
                  active={isActiveRoute(location.pathname, ROUTES.PROFILE)}
                >
                  查看资料
                </MenuItem>
                <MenuItem
                  icon={<Edit size={18} />}
                  component={<Link to={ROUTES.EDIT_PROFILE} />}
                  active={isActiveRoute(location.pathname, ROUTES.EDIT_PROFILE)}
                >
                  编辑资料
                </MenuItem>
                <MenuItem
                  icon={<Shield size={18} />}
                  component={<Link to={ROUTES.ACCOUNT_SECURITY} />}
                  active={isActiveRoute(location.pathname, ROUTES.ACCOUNT_SECURITY)}
                >
                  账户安全
                </MenuItem>
              </SubMenu>

              <MenuItem
                icon={<LayoutGrid size={20} />}
                component={<Link to={ROUTES.CATEGORY_PANEL} />}
                active={isActiveRoute(location.pathname, ROUTES.CATEGORY_PANEL)}
              >
                分类面板
              </MenuItem>

              <SubMenu
                label="分类管理"
                icon={<Package size={20} />}
                active={
                  isActiveRoute(location.pathname, ROUTES.CATEGORY_LIST) ||
                  isActiveRoute(location.pathname, ROUTES.CATEGORY_ADD)
                }
              >
                <MenuItem
                  icon={<Eye size={18} />}
                  component={<Link to={ROUTES.CATEGORY_LIST} />}
                  active={isActiveRoute(location.pathname, ROUTES.CATEGORY_LIST)}
                >
                  分类列表
                </MenuItem>
                <MenuItem
                  icon={<Plus size={18} />}
                  component={<Link to={ROUTES.CATEGORY_ADD} />}
                  active={isActiveRoute(location.pathname, ROUTES.CATEGORY_ADD)}
                >
                  添加分类
                </MenuItem>
              </SubMenu>

              <SubMenu
                label="子分类管理"
                icon={<FolderTree size={20} />}
                active={
                  isActiveRoute(location.pathname, ROUTES.SUBCATEGORY_LIST) ||
                  isActiveRoute(location.pathname, ROUTES.SUBCATEGORY_ADD)
                }
              >
                <MenuItem
                  icon={<Eye size={18} />}
                  component={<Link to={ROUTES.SUBCATEGORY_LIST} />}
                  active={isActiveRoute(location.pathname, ROUTES.SUBCATEGORY_LIST)}
                >
                  子分类列表
                </MenuItem>
                <MenuItem
                  icon={<Plus size={18} />}
                  component={<Link to={ROUTES.SUBCATEGORY_ADD} />}
                  active={isActiveRoute(location.pathname, ROUTES.SUBCATEGORY_ADD)}
                >
                  添加子分类
                </MenuItem>
              </SubMenu>

              <SubMenu
                label="茶叶管理"
                icon={<Leaf size={20} />}
                active={
                  isActiveRoute(location.pathname, ROUTES.TEA_LIST) ||
                  isActiveRoute(location.pathname, ROUTES.TEA_ADD)
                }
              >
                <MenuItem
                  icon={<Coffee size={18} />}
                  component={<Link to={ROUTES.TEA_LIST} />}
                  active={isActiveRoute(location.pathname, ROUTES.TEA_LIST)}
                >
                  茶叶列表
                </MenuItem>
                <MenuItem
                  icon={<Plus size={18} />}
                  component={<Link to={ROUTES.TEA_ADD} />}
                  active={isActiveRoute(location.pathname, ROUTES.TEA_ADD)}
                >
                  添加茶叶
                </MenuItem>
              </SubMenu>
            </Menu>
          )}
        </div>
      </ProSidebar>
    );
  },
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
