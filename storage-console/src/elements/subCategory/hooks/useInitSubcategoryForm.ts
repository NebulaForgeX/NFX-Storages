import type { AuthSubcategory } from "@/apis/domain";
import type { SubcategoryFormValues } from "../controllers/subcategorySchema";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCategory } from "@/hooks";

import { SubcategoryFormSchema } from "../controllers/subcategorySchema";
import CategoryStore from "../stores/categoryStore";

export default function useInitSubcategoryForm(subcategory?: AuthSubcategory | null) {
  const setCategory = CategoryStore.getState().setCategory;

  const { data: category } = useCategory(
    ["category", subcategory?.parentId],
    { id: subcategory?.parentId ?? "" },
  );

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(SubcategoryFormSchema),
    mode: "onChange",
    defaultValues: subcategory
      ? {
          Name: subcategory.name,
          Description: subcategory.description || "",
          Key: subcategory.key,
          ParentId: subcategory.parentId,
          Image: null,
          Show: subcategory.show,
        }
      : {
          Name: "",
          Description: "",
          Key: "",
          ParentId: "",
          Image: null,
          Show: true,
        },
  });

  useEffect(() => {
    if (subcategory) {
      form.reset({
        Name: subcategory.name,
        Description: subcategory.description || "",
        Key: subcategory.key,
        ParentId: subcategory.parentId,
        Image: null,
        Show: subcategory.show,
      });
      setCategory(category);
    }
  }, [subcategory, form, category, setCategory]);

  return form;
}

