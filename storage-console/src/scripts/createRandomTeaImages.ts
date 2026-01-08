import { UploadTempTeaImage, CreateTea } from "@/apis/tea.api";
import { GetCategoryListAuth } from "@/apis/category.api";
import { GetSubcategoryListAuth } from "@/apis/subcategory.api";
import { v4 as uuidv4 } from "uuid";

import { TeaStatusEnum } from "@/apis/types/enums";

export function ensureUuid(): string {
  const c = (globalThis as any)?.crypto;

  if (c?.randomUUID) {
    return c.randomUUID();
  }

  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  return uuidv4();
}


export async function createRandomTeaFromFiles(files: File[]) {
  if (!files.length) return null;

  // ✅ 过滤掉非图片文件
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) return null;

  // ✅ 上传图片
  const images = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const { tempFilename } = await UploadTempTeaImage(file);

    images.push({
      id: ensureUuid(),
      imageFile: tempFilename,
      index: i,
      isTemp: true,
    });
  }

  // ✅ 分类随机
  const { categories } = await GetCategoryListAuth({ limit: 1000 });
  const category = categories[Math.floor(Math.random() * categories.length)];

  const { subcategories } = await GetSubcategoryListAuth({
    parentId: category.id,
    limit: 1000,
  });
  const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];

  // ✅ 创建茶叶
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomYear = () => Math.floor(Math.random() * 40) + 1980;
  const origins = ["云南", "福建", "台湾", "西双版纳", "凤凰山", "大红山", "易武", "勐海"];
  const treeTypes = ["古树", "乔木", "台地", "灌木"];
  const forms = ["茶饼", "茶砖", "散茶", "茶柱"];
  const storages = ["干仓", "湿仓", "石仓", "恒温仓"];
  const tagsPool = ["红茶", "生普", "熟普", "古树红茶", "头春", "一级", "特级", "限量"];
  const attributes = {
    等级: pick(["特级", "一级", "二级"]),
    香型: pick(["花香", "蜜香", "兰香", "果香"]),
    工艺: pick(["手工", "机器压制"]),
  };
  const randomTags = () =>
    Array.from(new Set(Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => pick(tagsPool))));

  await CreateTea({
    name: `随机茶叶 ${Math.floor(Math.random() * 9999)}`,
    description: "随机描述内容",
    price: Math.floor(Math.random() * 200) + 29,
    originalPrice: Math.floor(Math.random() * 200) + 89,
    stock: Math.floor(Math.random() * 300) + 50,
    
    show: true,
    year: randomYear(),
    origin: pick(origins),
    treeType: pick(treeTypes),
    form: pick(forms),
    weight: Math.floor(Math.random() * 500) + 100,
    batch: `批次 ${Math.floor(Math.random() * 9999)}`,
    storage: pick(storages),
    tags: randomTags(),
    status: pick([
      TeaStatusEnum.ON_SHELF,
      TeaStatusEnum.OFF_SHELF,
      TeaStatusEnum.SOLD_OUT,
      TeaStatusEnum.RESTOCKING,
    ]),
    attributes,
    categoryId: category.id,
    subcategoryId: subcategory.id,
    images,
  });

  return true;
}
