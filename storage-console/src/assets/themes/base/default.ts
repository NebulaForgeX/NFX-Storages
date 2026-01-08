import type { Theme } from "../types";

// 基于 ReX-App 的 light.ts 红色系配色创建的 default 主题
export const defaultTheme: Theme = {
  name: "default",
  displayName: "Default",
  variables: {
    // 基础颜色 - 红色系
    primary: "rgb(250, 30, 22)", // #FA1E16 鲜红色
    primaryLight: "rgb(255, 120, 120)", // 浅红色
    success: "rgb(62, 168, 30)", // 浅绿色（对比色）
    successLight: "rgb(220, 255, 210)",
    info: "rgb(255, 160, 150)", // 亮橙红
    infoLight: "rgb(255, 200, 180)",
    warning: "rgb(248, 104, 7)", // 明亮橙色
    warningLight: "rgb(255, 140, 60)",
    danger: "rgb(211, 17, 11)", // 深红色
    dangerLight: "rgb(243, 70, 64)",

    // 背景色 - 浅色系
    bg: "rgb(250, 250, 250)", // 纯白
    bg2: "rgb(245, 245, 245)",
    bg3: "rgb(226, 224, 224)",
    bg4: "rgb(207, 207, 207)",

    // 边框色
    border: "rgb(250, 250, 250)",
    border2: "rgb(245, 245, 245)",
    border3: "rgb(226, 224, 224)",
    border4: "rgb(207, 207, 207)",
    border5: "rgb(136, 136, 136)",

    // 文字色
    fg: "rgb(136, 136, 136)", // 灰色文字
    fgText: "rgb(22, 21, 21)", // 黑色文字
    fgHeading: "rgb(0, 0, 0)", // 纯黑标题
    fgHighlight: "rgb(250, 30, 22)", // 红色高亮

    // 分隔符
    separator: "rgb(226, 224, 224)",

    // 扩展配置 - Temperature
    temperature: {
      arcFill: [
        "rgb(255, 210, 210)", // 非常浅的淡红
        "rgb(255, 200, 160)", // 柔和杏色
        "rgb(255, 160, 150)", // 更偏亮橙红
        "rgb(255, 120, 120)", // 浅红
        "rgb(250, 30, 22)", // 主红色
      ],
      arcEmpty: "rgb(245, 245, 245)",
      thumbBg: "rgb(245, 245, 245)",
      thumbBorder: "rgb(250, 30, 22)",
    },

    // Solar
    solar: {
      gradientLeft: "rgb(250, 30, 22)",
      gradientRight: "rgb(248, 104, 7)",
      shadowColor: "rgba(250, 30, 22, 0.1)",
      secondSeriesFill: "rgb(245, 245, 245)",
      radius: ["80%", "90%"],
    },

    // Traffic
    traffic: {
      tooltipBg: "rgb(250, 250, 250)",
      tooltipBorderColor: "rgb(245, 245, 245)",
      tooltipExtraCss: "border-radius: 10px; padding: 4px 16px;",
      tooltipTextColor: "rgb(22, 21, 21)",
      tooltipFontWeight: "normal",
      yAxisSplitLine: "rgb(226, 224, 224)",
      lineBg: "rgb(207, 207, 207)",
      lineShadowBlur: "1",
      itemColor: "rgb(207, 207, 207)",
      itemBorderColor: "rgb(207, 207, 207)",
      itemEmphasisBorderColor: "rgb(250, 30, 22)",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
      shadowLineShadow: "rgba(0, 0, 0, 0)",
      gradFrom: "rgb(245, 245, 245)",
      gradTo: "rgb(245, 245, 245)",
    },

    // Electricity
    electricity: {
      tooltipBg: "rgb(250, 250, 250)",
      tooltipLineColor: "rgb(22, 21, 21)",
      tooltipLineWidth: "0",
      tooltipBorderColor: "rgb(245, 245, 245)",
      tooltipExtraCss: "border-radius: 10px; padding: 8px 24px;",
      tooltipTextColor: "rgb(22, 21, 21)",
      tooltipFontWeight: "normal",
      axisLineColor: "rgb(226, 224, 224)",
      xAxisTextColor: "rgb(136, 136, 136)",
      yAxisSplitLine: "rgb(226, 224, 224)",
      itemBorderColor: "rgb(250, 30, 22)",
      lineStyle: "solid",
      lineWidth: "4",
      lineGradFrom: "rgb(250, 30, 22)",
      lineGradTo: "rgb(248, 104, 7)",
      lineShadow: "rgba(250, 30, 22, 0.2)",
      areaGradFrom: "rgba(250, 30, 22, 0.1)",
      areaGradTo: "rgba(250, 30, 22, 0.05)",
      shadowLineDarkBg: "rgba(0, 0, 0, 0)",
    },

    // ECharts
    echarts: {
      bg: "rgb(250, 250, 250)",
      textColor: "rgb(22, 21, 21)",
      axisLineColor: "rgb(136, 136, 136)",
      splitLineColor: "rgb(226, 224, 224)",
      itemHoverShadowColor: "rgba(250, 30, 22, 0.3)",
      tooltipBackgroundColor: "rgb(250, 30, 22)",
      areaOpacity: "0.7",
    },

    // ChartJS
    chartjs: {
      axisLineColor: "rgb(226, 224, 224)",
      textColor: "rgb(22, 21, 21)",
    },
  },
};
