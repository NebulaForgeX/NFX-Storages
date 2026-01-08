import type { AuthCategory } from "@/apis/domain";
import type { CategoryFormValues } from "../controllers/categorySchema";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CategoryFormSchema } from "../controllers/categorySchema";

export default function useInitCategoryForm(category?: AuthCategory | null) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    mode: "onChange",
    defaultValues: category
      ? {
          Name: category.name,
          Description: category.description || "",
          Key: category.key,
          Image: null,
          Show: category.show,
        }
      : {
          Name: "",
          Description: "",
          Key: "",
          Image: null,
          Show: true,
        },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        Name: category.name,
        Description: category.description || "",
        Key: category.key,
        Image: null,
        Show: category.show,
      });
    }
  }, [category, form]);

  return form;
}

