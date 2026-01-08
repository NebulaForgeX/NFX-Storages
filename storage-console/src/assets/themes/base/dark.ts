import type { Theme } from "../types";

export const darkTheme: Theme = {
  name: "dark",
  displayName: "Dark",
  variables: {
    // 基础颜色 - 中性色系
    primary: "#333333",
    primaryLight: "#555555",
    success: "#00d68f",
    successLight: "#33dfaa",
    info: "#0095ff",
    infoLight: "#33a7ff",
    warning: "#ffaa00",
    warningLight: "#ffbb33",
    danger: "#ff3d71",
    dangerLight: "#ff6491",

    // 背景色 - 中性深色
    bg: "#1a1a1a",
    bg2: "#2a2a2a",
    bg3: "#3a3a3a",
    bg4: "#4a4a4a",

    // 边框色 - 中性深色
    border: "#1a1a1a",
    border2: "#2a2a2a",
    border3: "#3a3a3a",
    border4: "#4a4a4a",
    border5: "#5a5a5a",

    // 文字色
    fg: "#b4b4db",
    fgText: "#ffffff",
    fgHeading: "#ffffff",
    fgHighlight: "#ffffff",

    // 分隔符
    separator: "#2a2a2a",

    // 扩展配置 - Temperature
    temperature: {
      arcFill: ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
      arcEmpty: "#2a2a2a",
      thumbBg: "#2a2a2a",
      thumbBorder: "#ffffff",
    },

    // Solar
    solar: {
      gradientLeft: "#ffffff",
      gradientRight: "#ffffff",
      shadowColor: "rgba(0, 0, 0, 0)",
      secondSeriesFill: "#2a2a2a",
      radius: ["80%", "90%"],
    },

    // Traffic
    traffic: {
      tooltipBg: "#1a1a1a",
      tooltipBorderColor: "#2a2a2a",
      tooltipExtraCss: "border-radius: 10px; padding: 4px 16px;",
      tooltipTextColor: "#ffffff",
      tooltipFontWeight: "normal",
      yAxisSplitLine: "#2a2a2a",
      lineBg: "#3a3a3a",
      lineShadowBlur: "1",
      itemColor: "#3a3a3a",
      itemBorderColor: "#3a3a3a",
      itemEmphasisBorderColor: "#ffffff",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
      shadowLineShadow: "rgba(0, 0, 0, 0)",
      gradFrom: "#2a2a2a",
      gradTo: "#2a2a2a",
    },

    // Electricity
    electricity: {
      tooltipBg: "#1a1a1a",
      tooltipLineColor: "#ffffff",
      tooltipLineWidth: "0",
      tooltipBorderColor: "#2a2a2a",
      tooltipExtraCss: "border-radius: 10px; padding: 8px 24px;",
      tooltipTextColor: "#ffffff",
      tooltipFontWeight: "normal",
      axisLineColor: "#3a3a3a",
      xAxisTextColor: "#b4b4db",
      yAxisSplitLine: "#2a2a2a",
      itemBorderColor: "#ffffff",
      lineStyle: "solid",
      lineWidth: "4",
      lineGradFrom: "#ffffff",
      lineGradTo: "#ffffff",
      lineShadow: "rgba(0, 0, 0, 0)",
      areaGradFrom: "#2a2a2a",
      areaGradTo: "#2a2a2a",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
    },

    // ECharts
    echarts: {
      bg: "#1a1a1a",
      textColor: "#ffffff",
      axisLineColor: "#ffffff",
      splitLineColor: "#2a2a2a",
      itemHoverShadowColor: "rgba(0, 0, 0, 0.5)",
      tooltipBackgroundColor: "#ffffff",
      areaOpacity: "0.7",
    },

    // ChartJS
    chartjs: {
      axisLineColor: "#2a2a2a",
      textColor: "#ffffff",
    },
  },
};
