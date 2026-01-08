import { z } from "zod";

export type SubcategoryFormValues = z.input<typeof SubcategoryFormSchema>;
export const SubcategoryFormSchema = z.object({
  Name: z.string().trim().min(1, "请输入子分类名称"),
  Description: z.string().optional(),
  Key: z.string().trim().min(1, "请输入子分类键值"),
  ParentId: z.string().min(1, "请选择父分类"),
  Image: z.instanceof(File).optional().nullable(),
  Show: z.boolean().default(true),
});

