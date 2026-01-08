import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { Calendar } from "@/assets/icons/lucide";

import { useSelfProfile } from "@/hooks/useProfile";
import { formatDisplayDate, formatRelativeTime } from "@/utils/time";

export const useTimestamps = () => {
  const { data: profile } = useSelfProfile();

  const createdAt = profile?.createdAt;
  const updatedAt = profile?.updatedAt;

  return useMemo<InfoItem[]>(
    () => [
      {
        icon: <Calendar size={20} />,
        label: "创建时间",
        value: createdAt ? `${formatDisplayDate(createdAt)} (${formatRelativeTime(createdAt)})` : "不可用",
      },
      {
        icon: <Calendar size={20} />,
        label: "更新时间",
        value: updatedAt ? `${formatDisplayDate(updatedAt)} (${formatRelativeTime(updatedAt)})` : "不可用",
      },
    ],
    [createdAt, updatedAt],
  );
};
