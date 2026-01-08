import type { ThemeName } from "@/assets/themes/types";

import { memo, useEffect, useRef, useState } from "react";

import { useTheme } from "@/providers/ThemeProvider";

import styles from "./styles.module.css";

interface ThemeSwitcherProps {
  status?: "primary" | "default";
}

const ThemeSwitcher = memo(({ status = "primary" }: ThemeSwitcherProps) => {
  const { themeName, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 主题显示名称映射
  const themeDisplayNames: Record<string, string> = {
    default: "默认",
    light: "浅色",
    dark: "深色",
    cosmic: "宇宙",
    corporate: "企业",
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleThemeChange = (theme: ThemeName) => {
    setTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className={styles.nbSelect} ref={wrapperRef}>
      <button
        className={`${styles.selectButton} ${styles[status]}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.buttonText}>{themeDisplayNames[themeName] || themeName}</span>
        <svg
          className={`${styles.chevronIcon} ${isOpen ? styles.open : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className={`${styles.optionsPanel} ${styles[status]}`}>
          <ul className={styles.optionsList} role="listbox">
            {availableThemes.map((theme) => (
              <li
                key={theme}
                className={`${styles.option} ${theme === themeName ? styles.selected : ""}`}
                onClick={() => handleThemeChange(theme)}
                role="option"
                aria-selected={theme === themeName}
              >
                <span>{themeDisplayNames[theme] || theme}</span>
                {theme === themeName && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

ThemeSwitcher.displayName = "ThemeSwitcher";

export default ThemeSwitcher;
