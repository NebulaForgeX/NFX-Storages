import type { InfoItem } from "@/elements/profile";

import { useMemo } from "react";
import { DollarSign, Package, TrendingUp } from "@/assets/icons/lucide";

export const useStatistics = () => {
  // 后端目前没有这些统计字段，显示空数据
  return useMemo<InfoItem[]>(
    () => [
      {
        icon: <DollarSign size={20} />,
        label: "Earned",
        value: "$0",
      },
      {
        icon: <TrendingUp size={20} />,
        label: "Sold",
        value: "0",
      },
      {
        icon: <Package size={20} />,
        label: "Posted",
        value: "0",
      },
    ],
    [],
  );
};
