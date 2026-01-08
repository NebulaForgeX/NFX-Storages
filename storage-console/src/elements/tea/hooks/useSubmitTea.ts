import type { FieldErrors } from "react-hook-form";
import type { TeaFormValues } from "../controllers/teaSchema";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { CreateTea } from "@/apis/tea.api";
import { showError, showSuccess } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";
import { DEFAULT_TEA_STATUS } from "@/apis/types/enums";

export const useSubmitTea = () => {
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

      const tea = await CreateTea({
        name: data.values.Name.trim(),
        description: data.values.Description.trim(),
        categoryId: data.values.CategoryId,
        subcategoryId: data.values.SubcategoryId,
        price: data.values.Price,
        originalPrice: data.values.OriginalPrice ?? undefined,
        stock: data.values.Stock,
        show: data.values.Show ?? true,
        year: data.values.Year ?? 2020,
        origin: data.values.Origin.trim(),
        treeType: data.values.TreeType.trim(),
        form: data.values.Form.trim(),
        weight: data.values.Weight,
        batch: data.values.Batch?.trim() ?? "",
        storage: data.values.Storage.trim(),
        tags,
        status: data.values.Status ?? DEFAULT_TEA_STATUS,
        attributes: attributesObject,
        images: data.values.Images,
      });

      return tea;
    },
    onSuccess: () => {
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEAS);
      showSuccess({
        message: "茶叶创建成功！",
        onClick: () => navigate(ROUTES.TEA_LIST),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "创建茶叶失败");
    },
  });

  const onSubmit = useCallback(
    async (values: TeaFormValues) => {
      try {
        await mutateAsync({ values });
      } catch (error) {
        console.error("Submit tea error:", error);
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

export default useSubmitTea;