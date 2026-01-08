import type { QuickAction } from "@/elements/profile";

import { useMemo } from "react";
import { Edit, Shield } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";

export const useQuickAction = () => {
  const navigate = useNavigate();

  return useMemo<QuickAction[]>(
    () => [
      {
        icon: <Edit size={20} />,
        label: "编辑资料",
        onClick: () => navigate(ROUTES.EDIT_PROFILE),
      },
      {
        icon: <Shield size={20} />,
        label: "账户安全",
        onClick: () => navigate(ROUTES.ACCOUNT_SECURITY),
      },
    ],
    [navigate],
  );
};
