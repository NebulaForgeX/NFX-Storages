import { z } from "zod";

export type CategoryFormValues = z.input<typeof CategoryFormSchema>;
export const CategoryFormSchema = z.object({
  Name: z.string().trim().min(1, "请输入分类名称"),
  Description: z.string().optional(),
  Key: z.string().trim().min(1, "请输入分类键值"),
  Image: z.instanceof(File).optional().nullable(),
  Show: z.boolean().default(true),
});

