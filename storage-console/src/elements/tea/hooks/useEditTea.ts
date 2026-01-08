import type { FieldErrors } from "react-hook-form";
import type { TeaFormValues } from "../controllers/teaSchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { UpdateTea, UpdateTeaImages } from "@/apis/tea.api";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useEditTea = (teaId: string) => {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: { values: TeaFormValues }) => {
      const tags = data.values.Tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) ?? [];
      const attributesObject =
        data.values.Attributes?.reduce<Record<string, unknown>>((acc, attr) => {
          const key = attr.key.trim();
          const value = attr.value.trim();
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {}) ?? {};

      // 更新基础信息
      await UpdateTea(teaId, {
        name: data.values.Name.trim(),
        description: data.values.Description.trim(),
        categoryId: data.values.CategoryId,
        subcategoryId: data.values.SubcategoryId,
        price: data.values.Price,
        originalPrice: data.values.OriginalPrice ?? undefined,
        stock: data.values.Stock,
        show: data.values.Show ?? true,
        year: data.values.Year,
        origin: data.values.Origin.trim(),
        treeType: data.values.TreeType.trim(),
        form: data.values.Form.trim(),
        weight: data.values.Weight,
        batch: data.values.Batch?.trim() ?? "",
        storage: data.values.Storage.trim(),
        tags,
        status: data.values.Status,
        attributes: attributesObject,
      });

      // 更新图片
      if (data.values.Images && data.values.Images.length > 0) {
        await UpdateTeaImages(teaId, {
          images: data.values.Images,
        });
      }
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEAS);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEA, teaId);
      showSuccess({
        message: "茶叶更新成功！",
        onClick: () => navigate(ROUTES.TEA_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "更新茶叶失败");
    },
  });

  const onSubmit = useCallback(
    async (values: TeaFormValues) => {
      try {
        await mutateAsync({ values });
      } catch (error) {
        console.error("Edit tea error:", error);
      }
    },
    [mutateAsync]
  );

  const onSubmitError = useCallback((errors: FieldErrors<TeaFormValues>) => {
    console.error("Form validation errors:", errors);
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showError(firstError.message);
    }
  }, []);

  return { onSubmit, onSubmitError, isPending };
};

export default useEditTea;