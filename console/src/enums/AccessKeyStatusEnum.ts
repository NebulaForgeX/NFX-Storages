export const AccessKeyStatusEnum = {
  ENABLED: "enabled",
  DISABLED: "disabled",
} as const;

export type AccessKeyStatus = (typeof AccessKeyStatusEnum)[keyof typeof AccessKeyStatusEnum];
