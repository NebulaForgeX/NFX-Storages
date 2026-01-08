import type { FieldErrors } from "react-hook-form";
import type { SubcategoryFormValues } from "../controllers/subcategorySchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { UpdateSubcategory, UpdateSubcategoryImage } from "@/apis/subcategory.api";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useEditSubcategory = (subcategoryId: string) => {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: { values: SubcategoryFormValues; imageFile?: File }) => {
      await UpdateSubcategory(subcategoryId, {
        name: data.values.Name.trim(),
        description: data.values.Description || "",
        key: data.values.Key.trim(),
        parentId: data.values.ParentId,
      });

      // 如果有图片，上传图片
      if (data.imageFile) {
        await UpdateSubcategoryImage(subcategoryId, data.imageFile);
      }
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORIES);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORY, subcategoryId);
      // 需要刷新父分类的子分类列表（可能改变了父分类）
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      showSuccess({
        message: "子分类更新成功！",
        onClick: () => navigate(ROUTES.SUBCATEGORY_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "更新子分类失败");
    },
  });

  const onSubmit = useCallback(
    async (values: SubcategoryFormValues) => {
      try {
        await mutateAsync({
          values,
          imageFile: values.Image || undefined,
        });
      } catch (error) {
        console.error("Edit subcategory error:", error);
      }
    },
    [mutateAsync],
  );

  const onSubmitError = useCallback(
    (errors: FieldErrors<SubcategoryFormValues>) => {
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

export default useEditSubcategory;

