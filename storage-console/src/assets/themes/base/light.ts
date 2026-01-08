import type { Theme } from "../types";

// 原 ngx-admin 的 default 主题（浅灰蓝色风格）
export const lightTheme: Theme = {
  name: "light",
  displayName: "Light",
  variables: {
    // 基础颜色 - 黑白对比色系
    primary: "#222b45",
    primaryLight: "#192038",
    success: "#00d68f",
    successLight: "#33dfaa",
    info: "#0095ff",
    infoLight: "#33a7ff",
    warning: "#ffaa00",
    warningLight: "#ffbb33",
    danger: "#ff3d71",
    dangerLight: "#ff6491",

    // 背景色
    bg: "#ffffff",
    bg2: "#f7f9fc",
    bg3: "#edf1f7",
    bg4: "#e4e9f2",

    // 边框色
    border: "#ffffff",
    border2: "#f7f9fc",
    border3: "#edf1f7",
    border4: "#e4e9f2",
    border5: "#c5cee0",

    // 文字色
    fg: "#8f9bb3",
    fgText: "#222b45",
    fgHeading: "#192038",
    fgHighlight: "#003694",

    // 分隔符
    separator: "#edf1f7",

    // 扩展配置 - Temperature
    temperature: {
      arcFill: ["#8f9bb3", "#8f9bb3", "#8f9bb3", "#8f9bb3", "#8f9bb3"],
      arcEmpty: "#f7f9fc",
      thumbBg: "#f7f9fc",
      thumbBorder: "#8f9bb3",
    },

    // Solar
    solar: {
      gradientLeft: "#8f9bb3",
      gradientRight: "#8f9bb3",
      shadowColor: "rgba(0, 0, 0, 0)",
      secondSeriesFill: "#f7f9fc",
      radius: ["80%", "90%"],
    },

    // Traffic
    traffic: {
      tooltipBg: "#ffffff",
      tooltipBorderColor: "#f7f9fc",
      tooltipExtraCss: "border-radius: 10px; padding: 4px 16px;",
      tooltipTextColor: "#222b45",
      tooltipFontWeight: "normal",
      yAxisSplitLine: "#edf1f7",
      lineBg: "#e4e9f2",
      lineShadowBlur: "1",
      itemColor: "#e4e9f2",
      itemBorderColor: "#e4e9f2",
      itemEmphasisBorderColor: "#8f9bb3",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
      shadowLineShadow: "rgba(0, 0, 0, 0)",
      gradFrom: "#f7f9fc",
      gradTo: "#f7f9fc",
    },

    // Electricity
    electricity: {
      tooltipBg: "#ffffff",
      tooltipLineColor: "#222b45",
      tooltipLineWidth: "0",
      tooltipBorderColor: "#f7f9fc",
      tooltipExtraCss: "border-radius: 10px; padding: 8px 24px;",
      tooltipTextColor: "#222b45",
      tooltipFontWeight: "normal",
      axisLineColor: "#edf1f7",
      xAxisTextColor: "#8f9bb3",
      yAxisSplitLine: "#edf1f7",
      itemBorderColor: "#8f9bb3",
      lineStyle: "solid",
      lineWidth: "4",
      lineGradFrom: "#8f9bb3",
      lineGradTo: "#8f9bb3",
      lineShadow: "rgba(0, 0, 0, 0)",
      areaGradFrom: "#f7f9fc",
      areaGradTo: "#f7f9fc",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
    },

    // ECharts
    echarts: {
      bg: "#ffffff",
      textColor: "#222b45",
      axisLineColor: "#222b45",
      splitLineColor: "#edf1f7",
      itemHoverShadowColor: "rgba(0, 0, 0, 0.5)",
      tooltipBackgroundColor: "#8f9bb3",
      areaOpacity: "0.7",
    },

    // ChartJS
    chartjs: {
      axisLineColor: "#edf1f7",
      textColor: "#222b45",
    },
  },
};
