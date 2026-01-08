import { AddCategory } from "@/apis/category.api";
import { AuthStore } from "@/stores/authStore";
import { getRandomName, getRandomString } from "./name";

/**
 * 创建随机分类
 * @param count 要创建的分类数量
 */
export const createRandomCategories = async (count: number): Promise<void> => {
  const currentUserId = AuthStore.getState().getCurrentUserId();
  if (!currentUserId) {
    throw new Error("用户未登录");
  }

  const categorySuffixes = [
    "绿茶", "红茶", "乌龙茶", "白茶", "黄茶", "普洱茶", 
    "花茶", "果茶", "草本茶", "调配茶", "名优茶", "特色茶"
  ];

  const promises = [];
  for (let i = 0; i < count; i++) {
    const suffix = categorySuffixes[Math.floor(Math.random() * categorySuffixes.length)];
    const randomName = getRandomName(3);
    const descriptionLength = Math.floor(Math.random() * 51) + 100; // 100-150 字
    const randomDescription = getRandomName(descriptionLength);
    const timestamp = Date.now();
    const randomKey = getRandomString(4);
    
    const categoryData = {
      name: `${randomName}${suffix}`,
      description: randomDescription,
      key: `cat-${timestamp}-${randomKey}`,
      show: Math.random() > 0.2, // 80% 显示
      editorId: currentUserId,
    };

    promises.push(AddCategory(categoryData));
    
    // 确保每个 key 都是唯一的，添加小延迟
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  await Promise.all(promises);
  console.log(`✅ 成功创建 ${count} 个分类`);
};

