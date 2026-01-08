import type { AuthTea } from "@/apis/domain";
import type { TeaFormValues } from "../controllers/teaSchema";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { DEFAULT_TEA_STATUS } from "@/apis/types/enums";

import { TeaFormSchema } from "../controllers/teaSchema";

export default function useInitTeaForm(tea?: AuthTea | null) {
  const form = useForm<TeaFormValues>({
    resolver: zodResolver(TeaFormSchema),
    mode: "onChange",
    defaultValues: tea
      ? {
          Name: tea.name,
          Description: tea.description || "",
          CategoryId: tea.categoryId,
          SubcategoryId: tea.subcategoryId,
          Price: tea.price,
          OriginalPrice: tea.originalPrice ?? null,
          Stock: tea.stock,
          Show: tea.show,
          Year: tea.year,
          Origin: tea.origin ?? "",
          TreeType: tea.treeType ?? "",
          Form: tea.form ?? "",
          Weight: tea.weight,
          Batch: tea.batch ?? "",
          Storage: tea.storage ?? "",
          Tags: tea.tags ?? [],
          Status: tea.status ?? DEFAULT_TEA_STATUS,
          Attributes: tea.attributes
            ? Object.entries(tea.attributes).map(([key, value]) => ({
                key,
                value: value === null || value === undefined ? "" : String(value),
              }))
            : [],
          Images: tea.images.map(img => ({ ...img, isTemp: false })), // 现有图片标记为非临时
        }
      : {
          Name: "",
          Description: "",
          CategoryId: "",
          SubcategoryId: "",
          Price: undefined as unknown as number,
          OriginalPrice: null,
          Stock: undefined as unknown as number,
          Show: true,
          Year: 2020,
          Origin: "",
          TreeType: "",
          Form: "",
          Weight: undefined as unknown as number,
          Batch: "",
          Storage: "",
          Tags: [],
          Status: DEFAULT_TEA_STATUS,
          Attributes: [],
          Images: [],
        },
  });

  useEffect(() => {
    if (tea) {
      form.reset({
        Name: tea.name,
        Description: tea.description || "",
        CategoryId: tea.categoryId,
        SubcategoryId: tea.subcategoryId,
        Price: tea.price,
        OriginalPrice: tea.originalPrice ?? null,
        Stock: tea.stock,
        Show: tea.show,
        Year: tea.year,
        Origin: tea.origin ?? "",
        TreeType: tea.treeType ?? "",
        Form: tea.form ?? "",
        Weight: tea.weight,
        Batch: tea.batch ?? "",
        Storage: tea.storage ?? "",
        Tags: tea.tags ?? [],
        Status: tea.status ?? DEFAULT_TEA_STATUS,
        Attributes: tea.attributes
          ? Object.entries(tea.attributes).map(([key, value]) => ({
              key,
              value: value === null || value === undefined ? "" : String(value),
            }))
          : [],
        Images: tea.images.map(img => ({ ...img, isTemp: false })), // 现有图片标记为非临时
      });
    }
  }, [tea, form]);

  return form;
}

