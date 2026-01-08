import { z } from "zod";

export const ProfileSchema = z.object({
  firstName: z.string().min(1, "名字是必填项").max(50, "名字不能超过50个字符"),
  lastName: z.string().min(1, "姓氏是必填项").max(50, "姓氏不能超过50个字符"),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;
