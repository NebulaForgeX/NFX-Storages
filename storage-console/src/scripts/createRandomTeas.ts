// /src/scripts/createRandomTeas.ts
import type { AuthCategory, AuthSubcategory } from "@/apis/domain";
import type { TeaImageEditable } from "@/apis/domain/tea.domain";

import { CreateTea, UploadTempTeaImage } from "@/apis/tea.api";
import { GetCategoryListAuth } from "@/apis/category.api";
import { GetSubcategoryListAuth } from "@/apis/subcategory.api";
import { AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";

import { getRandomName, getRandomString } from "./name";
import { TeaStatusEnum } from "@/apis/types/enums";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ✅ 确保有 UUID */
const ensureUuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : uuidv4();

/* ✅ File Explorer（用户必须点击按钮时触发） */
export function pickImagesWithUserGesture(): Promise<File[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = () => {
      resolve(input.files ? Array.from(input.files) : null);
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click(); // ✅ 用户点击按钮触发，不被浏览器拦截
  });
}

/* ✅ 随机值工具 */
function randomPrice(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomStock(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const origins = ["云南", "勐海", "普洱", "凤凰山", "武夷山", "台湾", "西双版纳"];
const treeTypes = ["古树", "乔木", "台地"];
const forms = ["茶饼", "茶砖", "散茶", "茶柱"];
const storages = ["干仓", "湿仓", "石仓", "恒温仓"];
const tagsPool = ["红茶", "生普", "熟普", "古树红茶", "头春", "一级", "特级", "限量"];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomTags = () =>
  Array.from(new Set(Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => pick(tagsPool))));
const randomAttributes = () => ({
  等级: pick(["特级", "一级", "二级"]),
  香型: pick(["花香", "蜜香", "兰香", "果香"]),
  工艺: pick(["手工", "机器压制"]),
});

/* ✅ 确保子分类缓存 */
async function ensureSubcategories(
  category: AuthCategory,
  cache: Map<string, AuthSubcategory[]>,
) {
  if (cache.has(category.id)) return cache.get(category.id)!;

  const { subcategories } = await GetSubcategoryListAuth({
    parentId: category.id,
    limit: 1000,
  });
  cache.set(category.id, subcategories);
  return subcategories;
}

/* ✅ 主逻辑（无限次可行） */
export async function createRandomTeas(count: number) {
  if (count <= 0) return { created: 0, skipped: 0 };

  const { categories } = await GetCategoryListAuth({ limit: 1000, offset: 0 });
  if (!categories.length) throw new Error("未找到分类，请先创建分类和子分类");

  const subCache = new Map<string, AuthSubcategory[]>();
  const failures: string[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < count; i++) {
    // ✅ 第一次：直接弹窗口（用户点击按钮后的 await，不会被拦截）
    let files: File[] | null = null;

    if (i === 0) {
      alert("请选择第一批茶叶图片（最多 10 张）");
      files = await pickImagesWithUserGesture();
    } else {
      // ✅ 第二次以后：必须要用户点击按钮才能打开文件选择器
      const shouldContinue = confirm(
        `第 ${i + 1} 个茶叶：需要选择下一批图片吗？`
      );
      if (!shouldContinue) {
        skipped++;
        continue;
      }

      alert("请点击“确定”后，再选择图片（浏览器要求必须由用户触发）");
      files = await pickImagesWithUserGesture(); // ✅ 用户手动触发 → 合法
    }

    if (!files || files.length === 0) {
      skipped++;
      continue;
    }
    if (files.length > 10) {
      failures.push(`第 ${i + 1} 次：选择的图片超过 10 张，已跳过`);
      skipped++;
      continue;
    }

    // ✅ 过滤非图片文件
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) {
      skipped++;
      continue;
    }

    /* ✅ 随机分类 + 子分类 */
    let pickedCategory: AuthCategory | null = null;
    let pickedSub: AuthSubcategory | null = null;

    const catPool = [...categories];
    while (catPool.length) {
      const c = catPool.splice(Math.floor(Math.random() * catPool.length), 1)[0];
      const subs = await ensureSubcategories(c, subCache);
      if (subs.length > 0) {
        pickedCategory = c;
        pickedSub = subs[Math.floor(Math.random() * subs.length)];
        break;
      }
    }

    if (!pickedCategory || !pickedSub) {
      failures.push(`第 ${i + 1} 次：未找到有效子分类`);
      skipped++;
      continue;
    }

    /* ✅ 上传图片 */
    const images: TeaImageEditable[] = [];

    for (let j = 0; j < imgs.length; j++) {
      const file = imgs[j];

      try {
        const { tempFilename } = await UploadTempTeaImage(file);
        images.push({
          id: ensureUuid(),
          imageFile: tempFilename,
          index: j,
          isTemp: true,
        });
      } catch (err) {
        images.length = 0;
        failures.push(`第 ${i + 1} 次：上传文件 ${file.name} 失败`);
        break;
      }

      await sleep(50);
    }

    if (!images.length) {
      skipped++;
      continue;
    }

    /* ✅ 提交茶叶 */
    const price = randomPrice(29, 299);
    const originalPrice = price + randomPrice(10, 80);

    try {
      await CreateTea({
        name: `${getRandomName(2)} ${getRandomString(3)}茶`,
        description: getRandomName(Math.floor(Math.random() * 50) + 100),
        categoryId: pickedCategory.id,
        subcategoryId: pickedSub.id,
        price,
        originalPrice,
        stock: randomStock(20, 500),
        show: Math.random() > 0.1,
        year: Math.floor(Math.random() * 40) + 1980,
        origin: pick(origins),
        treeType: pick(treeTypes),
        form: pick(forms),
        weight: Math.floor(Math.random() * 400) + 100,
        batch: `批次 ${Math.floor(Math.random() * 9999)}`,
        storage: pick(storages),
        tags: randomTags(),
        status: pick([
          TeaStatusEnum.ON_SHELF,
          TeaStatusEnum.OFF_SHELF,
          TeaStatusEnum.SOLD_OUT,
          TeaStatusEnum.RESTOCKING,
        ]),
        attributes: randomAttributes(),
        images,
      });
      created++;
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.message ?? "请求错误"
          : err instanceof Error
          ? err.message
          : String(err);

      failures.push(`第 ${i + 1} 次：创建茶叶失败 (${msg})`);
    }

    await sleep(150);
  }

  // ✅ 返回结果
  if (failures.length) {
    throw new Error(failures.join("\n"));
  }

  return { created, skipped };
}
