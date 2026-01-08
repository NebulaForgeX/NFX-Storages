import type { ProfileFormData } from "../controllers/profileSchema";

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useSelfProfile, useUpdateProfileBasic } from "@/hooks/useProfile";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";

export const useSubmitProfile = () => {
  const navigate = useNavigate();
  const { data: profile } = useSelfProfile();

  const { mutateAsync: updateProfileBasic, isPending } = useUpdateProfileBasic();

  const onSubmit = useCallback(
    async (data: ProfileFormData) => {
      if (!profile) return;

      try {
        // 构建更新对象，只包含有变化的字段
        const updates: Partial<typeof data> = {};

        if (data.firstName.trim() !== (profile.firstName || "")) {
          updates.firstName = data.firstName.trim();
        }

        if (data.lastName.trim() !== (profile.lastName || "")) {
          updates.lastName = data.lastName.trim();
        }

        if (Object.keys(updates).length === 0) {
          showError("未检测到更改");
          return;
        }

        await updateProfileBasic(updates);
        showSuccess("资料更新成功！");
        // Navigate after showing success modal
        setTimeout(() => {
          navigate(ROUTES.PROFILE);
        }, 1500);
      } catch (error) {
        console.error("Failed to update profile:", error);
        showError("更新资料失败，请重试。");
      }
    },
    [profile, updateProfileBasic, navigate],
  );

  return { onSubmit, isPending };
};
