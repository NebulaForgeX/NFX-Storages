// 茶叶相关枚举
export enum TeaStatusEnum {
  ON_SHELF = "on_shelf",
  OFF_SHELF = "off_shelf",
  SOLD_OUT = "sold_out",
  RESTOCKING = "restocking",
}

export const DEFAULT_TEA_STATUS = TeaStatusEnum.ON_SHELF;

export const TeaStatusLabelMap: Record<TeaStatusEnum, string> = {
  [TeaStatusEnum.ON_SHELF]: "上架",
  [TeaStatusEnum.OFF_SHELF]: "下架",
  [TeaStatusEnum.SOLD_OUT]: "售空",
  [TeaStatusEnum.RESTOCKING]: "补货",
};
