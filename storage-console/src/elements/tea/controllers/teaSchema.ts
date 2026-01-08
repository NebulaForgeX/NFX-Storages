import { z } from "zod";

import { DEFAULT_TEA_STATUS, TeaStatusEnum } from "@/apis/types/enums";

const TeaAttributeSchema = z.object({
  key: z.string().trim().min(1, "请输入属性名"),
  value: z.string().trim().min(1, "请输入属性值"),
});

export type TeaFormValues = z.input<typeof TeaFormSchema>;
export const TeaFormSchema = z.object({
  Name: z.string().trim().min(1, "请输入茶叶名称"),
  Description: z.string().trim().min(1, "请输入茶叶描述"),
  CategoryId: z.string().min(1, "请选择分类"),
  SubcategoryId: z.string().min(1, "请选择子分类"),
  Price: z.number().positive("价格必须大于0"),
  OriginalPrice: z.number().positive("原价必须大于0").optional().nullable(),
  Stock: z.number().int("库存必须是整数").min(0, "库存不能为负数"),
  Show: z.boolean().default(true),
  // Year 生产年份
  Year: z
    .number()
    .int("生产年份必须是整数")
    .min(1000, "生产年份不能小于1000")
    .default(2020),
  // Origin 产地 例如：冰岛、小户赛、勐库
  Origin: z.string().trim().min(1, "请输入产地"),
  // TreeType 树种类型 古树、乔木、台地
  TreeType: z.string().trim().min(1, "请输入树种类型"),
  // Form 茶叶形态 饼茶、砖茶、沱茶、散茶
  Form: z.string().trim().min(1, "请输入茶叶形态"),
  // Weight 重量 单位：克
  Weight: z.number().min(0, "重量不能为负数"),
  Batch: z.string().trim().default(""),
  // Storage 仓储信息 干仓、湿仓、石仓
  Storage: z.string().trim().min(1, "请输入仓储信息"),
  // Tags 标签数组 用于前台检索
  Tags: z.array(z.string().trim().min(1, "标签内容不能为空")).default([]),
  // Status 茶叶状态 上架/下架/售空/补货
  Status: z.nativeEnum(TeaStatusEnum).default(DEFAULT_TEA_STATUS),
  // Attributes 附加属性键值对
  Attributes: z.array(TeaAttributeSchema).default([]),
  Images: z
    .array(
      z.object({
        id: z.string(),
        imageFile: z.string(),
        index: z.number(),
      })
    )
    .min(1, "至少上传1张图片")
    .max(10, "最多上传10张图片"),
});
