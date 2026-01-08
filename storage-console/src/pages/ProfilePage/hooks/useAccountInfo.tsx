import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { CreditCard, Shield } from "@/assets/icons/lucide";

import { useSelfProfile } from "@/hooks/useProfile";

export const useAccountInfo = () => {
  const { data: profile } = useSelfProfile();

  const roleId = profile?.roleId;
  const createdAt = profile?.createdAt;
  const updatedAt = profile?.updatedAt;

  return useMemo<InfoItem[]>(
    () => [
      {
        icon: <CreditCard size={20} />,
        label: "角色ID",
        value: roleId || "未设置",
      },
      {
        icon: <Shield size={20} />,
        label: "创建时间",
        value: createdAt ? new Date(createdAt).toLocaleString("zh-CN") : "未设置",
      },
      {
        icon: <Shield size={20} />,
        label: "更新时间",
        value: updatedAt ? new Date(updatedAt).toLocaleString("zh-CN") : "未设置",
      },
    ],
    [roleId, createdAt, updatedAt],
  );
};
