import type { ReactNode } from "react";
import type { Theme, ThemeName } from "../assets/themes/types";

import { createContext, useContext, useEffect, useState } from "react";

import { themes } from "../assets/themes/base";

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = "default" }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("theme") as ThemeName | null;
    return saved && saved in themes ? saved : defaultTheme;
  });

  const currentTheme = themes[themeName];

  useEffect(() => {
    // 将主题变量注入到 CSS Variables
    const root = document.documentElement;
    const vars = currentTheme.variables;

    // 基础颜色
    root.style.setProperty("--color-primary", vars.primary);
    root.style.setProperty("--color-primary-light", vars.primaryLight);
    root.style.setProperty("--color-success", vars.success);
    root.style.setProperty("--color-success-light", vars.successLight);
    root.style.setProperty("--color-info", vars.info);
    root.style.setProperty("--color-info-light", vars.infoLight);
    root.style.setProperty("--color-warning", vars.warning);
    root.style.setProperty("--color-warning-light", vars.warningLight);
    root.style.setProperty("--color-danger", vars.danger);
    root.style.setProperty("--color-danger-light", vars.dangerLight);

    // 背景色
    root.style.setProperty("--color-bg", vars.bg);
    root.style.setProperty("--color-bg-2", vars.bg2);
    root.style.setProperty("--color-bg-3", vars.bg3);
    root.style.setProperty("--color-bg-4", vars.bg4);

    // 边框色
    root.style.setProperty("--color-border", vars.border);
    root.style.setProperty("--color-border-2", vars.border2);
    root.style.setProperty("--color-border-3", vars.border3);
    root.style.setProperty("--color-border-4", vars.border4);
    root.style.setProperty("--color-border-5", vars.border5);

    // 文字色
    root.style.setProperty("--color-fg", vars.fg);
    root.style.setProperty("--color-fg-text", vars.fgText);
    root.style.setProperty("--color-fg-heading", vars.fgHeading);
    root.style.setProperty("--color-fg-highlight", vars.fgHighlight);

    // 分隔符
    root.style.setProperty("--color-separator", vars.separator);

    // ECharts 颜色
    root.style.setProperty("--echarts-bg", vars.echarts.bg);
    root.style.setProperty("--echarts-text-color", vars.echarts.textColor);
    root.style.setProperty("--echarts-axis-line-color", vars.echarts.axisLineColor);
    root.style.setProperty("--echarts-split-line-color", vars.echarts.splitLineColor);
    root.style.setProperty("--echarts-item-hover-shadow-color", vars.echarts.itemHoverShadowColor);
    root.style.setProperty("--echarts-tooltip-bg-color", vars.echarts.tooltipBackgroundColor);
    root.style.setProperty("--echarts-area-opacity", vars.echarts.areaOpacity);

    // ChartJS 颜色
    root.style.setProperty("--chartjs-axis-line-color", vars.chartjs.axisLineColor);
    root.style.setProperty("--chartjs-text-color", vars.chartjs.textColor);

    // 保存到 localStorage
    localStorage.setItem("theme", themeName);
  }, [themeName, currentTheme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme);
  };

  const availableThemes: ThemeName[] = ["default", "light", "dark", "cosmic", "corporate"];

  return (
    <ThemeContext.Provider value={{ currentTheme, themeName, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
