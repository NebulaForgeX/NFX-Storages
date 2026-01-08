import type { FieldErrors } from "react-hook-form";
import type { CategoryFormValues } from "../controllers/categorySchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { AddCategory } from "@/apis/category.api";
import { AuthStore } from "@/stores/authStore";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useSubmitCategory = () => {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: { values: CategoryFormValues; imageFile?: File }) => {
      const currentUserId = AuthStore.getState().getCurrentUserId();
      if (!currentUserId) {
        throw new Error("用户未登录");
      }

      // 一次性创建分类并上传图片（后端支持 multipart/form-data）
      const category = await AddCategory({
        name: data.values.Name.trim(),
        description: data.values.Description || "",
        key: data.values.Key.trim(),
        show: data.values.Show,
        editorId: currentUserId,
      }, data.imageFile);

      return category;
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      showSuccess({
        message: "分类创建成功！",
        onClick: () => navigate(ROUTES.CATEGORY_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "创建分类失败");
    },
  });

  const onSubmit = useCallback(
    async (values: CategoryFormValues) => {
      try {
        await mutateAsync({
          values,
          imageFile: values.Image || undefined,
        });
      } catch (error) {
        console.error("Submit category error:", error);
      }
    },
    [mutateAsync],
  );

  const onSubmitError = useCallback(
    (errors: FieldErrors<CategoryFormValues>) => {
      console.error("Form validation errors:", errors);
      const firstError = Object.values(errors)[0];
      showError(firstError?.message || "请检查表单错误");
    },
    [],
  );

  return {
    onSubmit,
    onSubmitError,
    isPending,
  };
};

export default useSubmitCategory;

