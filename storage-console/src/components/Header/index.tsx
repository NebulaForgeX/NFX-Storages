import { memo } from "react";

import LeftContainer from "./LeftContainer";
import RightContainer from "./RightContainer";
import styles from "./styles.module.css";

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigateHome?: () => void;
}

const Header = memo(({ onToggleSidebar, onNavigateHome }: HeaderProps) => {
  return (
    <div className={styles.header}>
      {/* 左侧容器：Logo + 主题切换 */}
      <LeftContainer onToggleSidebar={onToggleSidebar} onNavigateHome={onNavigateHome} />

      {/* 右侧容器：操作按钮 */}
      <RightContainer />
    </div>
  );
});

Header.displayName = "Header";

export default Header;
