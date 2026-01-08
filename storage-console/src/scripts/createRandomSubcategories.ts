import { AddSubcategory } from "@/apis/subcategory.api";
import { GetCategoryListAuth } from "@/apis/category.api";
import { AuthStore } from "@/stores/authStore";
import { getRandomName, getRandomString } from "./name";

/**
 * 为每个分类创建随机数量的子分类
 * @param min 最小子分类数量
 * @param max 最大子分类数量
 */
export const createRandomSubcategories = async (min: number, max: number): Promise<void> => {
  const currentUserId = AuthStore.getState().getCurrentUserId();
  if (!currentUserId) {
    throw new Error("用户未登录");
  }

  // 获取所有分类
  const { categories } = await GetCategoryListAuth({ offset: 0, limit: 1000 });

  if (categories.length === 0) {
    throw new Error("没有可用的分类，请先创建分类");
  }

  const promises = [];
  let totalCount = 0;

  for (const category of categories) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    
    for (let i = 0; i < count; i++) {
      const nameSuffixLength = Math.floor(Math.random() * 6) + 10; // 10-15 字符
      const randomNameSuffix = getRandomString(nameSuffixLength);
      const descriptionLength = Math.floor(Math.random() * 51) + 100; // 100-150 字
      const randomDescription = getRandomName(descriptionLength);
      const timestamp = Date.now();
      const randomKey = getRandomString(4);
      
      const subcategoryData = {
        name: `${category.name}${randomNameSuffix}`,
        description: randomDescription,
        key: `subcat-${timestamp}-${randomKey}`,
        parentId: category.id,
        editorId: currentUserId,
      };

      promises.push(AddSubcategory(subcategoryData));
      totalCount++;      
      // 确保每个 key 都是唯一的，添加小延迟
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  await Promise.all(promises);
  console.log(`✅ 为 ${categories.length} 个分类创建了总共 ${totalCount} 个子分类`);
};

