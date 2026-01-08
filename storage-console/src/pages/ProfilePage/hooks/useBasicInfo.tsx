import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { Hash, Mail, Phone, User } from "@/assets/icons/lucide";

import { useSelfProfile } from "@/hooks/useProfile";

export const useBasicInfo = () => {
  const { data: profile } = useSelfProfile();

  const id = profile?.id;
  const firstName = profile?.firstName;
  const lastName = profile?.lastName;
  const email = profile?.email;
  const phone = profile?.phone;

  return useMemo<InfoItem[]>(
    () => [
      {
        icon: <Hash size={20} />,
        label: "用户ID",
        value: id || "未设置",
      },
      {
        icon: <User size={20} />,
        label: "名字",
        value: firstName || "未设置",
      },
      {
        icon: <User size={20} />,
        label: "姓氏",
        value: lastName || "未设置",
      },
      {
        icon: <Mail size={20} />,
        label: "邮箱",
        value: email || "未设置",
      },
      {
        icon: <Phone size={20} />,
        label: "手机号",
        value: phone || "未设置",
      },
    ],
    [id, firstName, lastName, email, phone],
  );
};
