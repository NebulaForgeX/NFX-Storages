import type { Theme } from "../types";

export const cosmicTheme: Theme = {
  name: "cosmic",
  displayName: "Cosmic",
  variables: {
    // 基础颜色
    primary: "#a16eff",
    primaryLight: "#b489ff",
    success: "#00d68f",
    successLight: "#33dfaa",
    info: "#0095ff",
    infoLight: "#33a7ff",
    warning: "#ffaa00",
    warningLight: "#ffbb33",
    danger: "#ff3d71",
    dangerLight: "#ff6491",

    // 背景色
    bg: "#323259",
    bg2: "#2a2a48",
    bg3: "#272741",
    bg4: "#1f1f3a",

    // 边框色
    border: "#323259",
    border2: "#2a2a48",
    border3: "#272741",
    border4: "#1f1f3a",
    border5: "#1f1f3a",

    // 文字色
    fg: "#b4b4db",
    fgText: "#ffffff",
    fgHeading: "#ffffff",
    fgHighlight: "#a16eff",

    // 分隔符
    separator: "#2a2a48",

    // 扩展配置 - Temperature
    temperature: {
      arcFill: ["#2ec7fe", "#31ffad", "#7bff24", "#fff024", "#f7bd59"],
      arcEmpty: "#2a2a48",
      thumbBg: "#ffffff",
      thumbBorder: "#ffffff",
    },

    // Solar
    solar: {
      gradientLeft: "#a16eff",
      gradientRight: "#a16eff",
      shadowColor: "rgba(0, 0, 0, 0)",
      secondSeriesFill: "#2a2a48",
      radius: ["70%", "90%"],
    },

    // Traffic
    traffic: {
      tooltipBg: "#323259",
      tooltipBorderColor: "#2a2a48",
      tooltipExtraCss: "box-shadow: 0px 2px 46px 0 rgba(50, 50, 89); border-radius: 10px; padding: 4px 16px;",
      tooltipTextColor: "#ffffff",
      tooltipFontWeight: "normal",
      yAxisSplitLine: "#2a2a48",
      lineBg: "#2a2a48",
      lineShadowBlur: "14",
      itemColor: "#2a2a48",
      itemBorderColor: "#2a2a48",
      itemEmphasisBorderColor: "#a16eff",
      shadowLineDarkBg: "#272741",
      shadowLineShadow: "#272741",
      gradFrom: "#323259",
      gradTo: "#2a2a48",
    },

    // Electricity
    electricity: {
      tooltipBg: "#323259",
      tooltipLineColor: "#ffffff",
      tooltipLineWidth: "0",
      tooltipBorderColor: "#2a2a48",
      tooltipExtraCss: "box-shadow: 0px 2px 46px 0 rgba(0, 255, 170, 0.35); border-radius: 10px; padding: 8px 24px;",
      tooltipTextColor: "#ffffff",
      tooltipFontWeight: "normal",
      axisLineColor: "#272741",
      xAxisTextColor: "#b4b4db",
      yAxisSplitLine: "#2a2a48",
      itemBorderColor: "#2a2a48",
      lineStyle: "dotted",
      lineWidth: "6",
      lineGradFrom: "#00d68f",
      lineGradTo: "#ffaa00",
      lineShadow: "#1f1f3a",
      areaGradFrom: "#2a2a48",
      areaGradTo: "#272741",
      shadowLineDarkBg: "#272741",
    },

    // ECharts
    echarts: {
      bg: "#323259",
      textColor: "#ffffff",
      axisLineColor: "#ffffff",
      splitLineColor: "#2a2a48",
      itemHoverShadowColor: "rgba(0, 0, 0, 0.5)",
      tooltipBackgroundColor: "#a16eff",
      areaOpacity: "1",
    },

    // ChartJS
    chartjs: {
      axisLineColor: "#2a2a48",
      textColor: "#ffffff",
    },
  },
};
