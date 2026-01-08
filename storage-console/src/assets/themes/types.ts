// 基础颜色变量类型
export interface BaseThemeVariables {
  // 主要颜色
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;

  // 背景色
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;

  // 边框色
  border: string;
  border2: string;
  border3: string;
  border4: string;
  border5: string;

  // 文字色
  fg: string;
  fgText: string;
  fgHeading: string;
  fgHighlight: string;

  // 分隔符
  separator: string;
}

// 扩展颜色变量（图表等）
export interface ExtendedThemeVariables extends BaseThemeVariables {
  temperature: {
    arcFill: string[];
    arcEmpty: string;
    thumbBg: string;
    thumbBorder: string;
  };

  solar: {
    gradientLeft: string;
    gradientRight: string;
    shadowColor: string;
    secondSeriesFill: string;
    radius: [string, string];
  };

  traffic: {
    tooltipBg: string;
    tooltipBorderColor: string;
    tooltipExtraCss: string;
    tooltipTextColor: string;
    tooltipFontWeight: string;
    yAxisSplitLine: string;
    lineBg: string;
    lineShadowBlur: string;
    itemColor: string;
    itemBorderColor: string;
    itemEmphasisBorderColor: string;
    shadowLineDarkBg: string;
    shadowLineShadow: string;
    gradFrom: string;
    gradTo: string;
  };

  electricity: {
    tooltipBg: string;
    tooltipLineColor: string;
    tooltipLineWidth: string;
    tooltipBorderColor: string;
    tooltipExtraCss: string;
    tooltipTextColor: string;
    tooltipFontWeight: string;
    axisLineColor: string;
    xAxisTextColor: string;
    yAxisSplitLine: string;
    itemBorderColor: string;
    lineStyle: string;
    lineWidth: string;
    lineGradFrom: string;
    lineGradTo: string;
    lineShadow: string;
    areaGradFrom: string;
    areaGradTo: string;
    shadowLineDarkBg: string;
  };

  echarts: {
    bg: string;
    textColor: string;
    axisLineColor: string;
    splitLineColor: string;
    itemHoverShadowColor: string;
    tooltipBackgroundColor: string;
    areaOpacity: string;
  };

  chartjs: {
    axisLineColor: string;
    textColor: string;
  };
}

// 主题配置
export interface Theme {
  name: string;
  displayName: string;
  variables: ExtendedThemeVariables;
}

// 主题名称类型
export type ThemeName = "default" | "light" | "dark" | "cosmic" | "corporate";
