import type { Activity } from "@/elements/profile";

import { useMemo } from "react";
import { Edit, Settings, Shield } from "@/assets/icons/lucide";

export const useRecentActivities = () => {
  // 这里可以后续改为从 API 或 store 获取真实的活动记录
  return useMemo<Activity[]>(
    () => [
      {
        icon: <Edit size={16} />,
        text: "Updated profile information",
        time: "2 hours ago",
      },
      {
        icon: <Settings size={16} />,
        text: "Changed account settings",
        time: "1 day ago",
      },
      {
        icon: <Shield size={16} />,
        text: "Updated privacy settings",
        time: "3 days ago",
      },
    ],
    [],
  );
};
