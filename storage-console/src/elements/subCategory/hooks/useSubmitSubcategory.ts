import type { FieldErrors } from "react-hook-form";
import type { SubcategoryFormValues } from "../controllers/subcategorySchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { AddSubcategory, UpdateSubcategoryImage } from "@/apis/subcategory.api";
import { AuthStore } from "@/stores/authStore";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useSubmitSubcategory = () => {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: { values: SubcategoryFormValues; imageFile?: File }) => {
      const currentUserId = AuthStore.getState().getCurrentUserId();
      if (!currentUserId) {
        throw new Error("用户未登录");
      }

      const subcategory = await AddSubcategory({
        name: data.values.Name.trim(),
        description: data.values.Description || "",
        key: data.values.Key.trim(),
        parentId: data.values.ParentId,
        editorId: currentUserId,
      });

      // 如果有图片，上传图片
      if (data.imageFile) {
        await UpdateSubcategoryImage(subcategory.id, data.imageFile);
      }

      return subcategory;
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORIES);
      // 需要刷新父分类的子分类列表
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      showSuccess({
        message: "子分类创建成功！",
        onClick: () => navigate(ROUTES.SUBCATEGORY_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "创建子分类失败");
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
        console.error("Submit subcategory error:", error);
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

export default useSubmitSubcategory;

