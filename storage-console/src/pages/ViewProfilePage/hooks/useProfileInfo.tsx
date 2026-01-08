import type { User } from "@/apis/domain";
import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { Calendar, CreditCard, Hash, Mail, Phone, UserRound, UserRoundSearch } from "@/assets/icons/lucide";

export const useProfileInfo = (profile: User | null | undefined) => {
  const basicInfo: InfoItem[] = useMemo(() => {
    if (!profile) return [];

    return [
      {
        icon: <Hash size={18} />,
        label: "用户ID",
        value: profile.id || "未设置",
      },
      {
        icon: <UserRound size={18} />,
        label: "名字",
        value: profile.firstName || "未设置",
      },
      {
        icon: <UserRoundSearch size={18} />,
        label: "姓氏",
        value: profile.lastName || "未设置",
      },
      {
        icon: <Mail size={18} />,
        label: "邮箱",
        value: profile.email || "未设置",
      },
      {
        icon: <Phone size={18} />,
        label: "手机号",
        value: profile.phone || "未设置",
      },
    ];
  }, [profile]);

  const accountInfo: InfoItem[] = useMemo(() => {
    if (!profile) return [];

    return [
      {
        icon: <CreditCard size={18} />,
        label: "角色ID",
        value: profile.roleId || "未设置",
      },
      {
        icon: <Calendar size={18} />,
        label: "创建时间",
        value: profile.createdAt ? new Date(profile.createdAt).toLocaleString("zh-CN") : "未设置",
      },
      {
        icon: <Calendar size={18} />,
        label: "更新时间",
        value: profile.updatedAt ? new Date(profile.updatedAt).toLocaleString("zh-CN") : "未设置",
      },
    ];
  }, [profile]);

  return { basicInfo, accountInfo };
};
