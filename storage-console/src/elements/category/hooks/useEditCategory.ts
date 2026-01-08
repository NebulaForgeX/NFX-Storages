import type { FieldErrors } from "react-hook-form";
import type { CategoryFormValues } from "../controllers/categorySchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { UpdateCategory, UpdateCategoryImage } from "@/apis/category.api";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useEditCategory = (categoryId: string) => {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: { values: CategoryFormValues; imageFile?: File }) => {
      await UpdateCategory(categoryId, {
        name: data.values.Name.trim(),
        description: data.values.Description || "",
        key: data.values.Key.trim(),
        show: data.values.Show,
      });

      // 如果有图片，上传图片
      if (data.imageFile) {
        await UpdateCategoryImage(categoryId, data.imageFile);
      }
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORY, categoryId);
      showSuccess({
        message: "分类更新成功！",
        onClick: () => navigate(ROUTES.CATEGORY_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "更新分类失败");
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
        console.error("Edit category error:", error);
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

export default useEditCategory;

