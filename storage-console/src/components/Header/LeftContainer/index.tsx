import { memo } from "react";
import { Menu } from "@/assets/icons/lucide";

import { LayoutSwitcher, ThemeSwitcher } from "@/components";

import styles from "./styles.module.css";

interface LeftContainerProps {
  onToggleSidebar?: () => void;
  onNavigateHome?: () => void;
}

const LeftContainer = memo(({ onToggleSidebar, onNavigateHome }: LeftContainerProps) => {
  return (
    <div className={styles.headerContainer}>
      {/* 侧边栏切换按钮 */}
      <button
        type="button"
        className={styles.sidebarToggle}
        onClick={() => {
          onToggleSidebar?.();
        }}
      >
        <Menu size={28} />
      </button>

      {/* Logo */}
      <button
        type="button"
        className={styles.logo}
        onClick={() => {
          onNavigateHome?.();
        }}
      >
        双江古寨茶业管理平台
      </button>

      {/* 主题/布局 切换器 */}
      <ThemeSwitcher status="primary" />
      <LayoutSwitcher status="default" />
    </div>
  );
});

LeftContainer.displayName = "LeftContainer";

export default LeftContainer;
