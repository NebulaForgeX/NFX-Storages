import { memo, useCallback, useState } from "react";
import { Plus, Wand2 } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";
import { createRandomCategories } from "@/scripts";
import { showError, showSuccess } from "@/stores/modalStore";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

import styles from "./styles.module.css";


// 主组件：使用 Suspense 包装
const CategoryHeader = memo(() => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleAdd = useCallback(() => {
    navigate(ROUTES.CATEGORY_ADD);
  }, [navigate]);

  const handleCreateRandom = useCallback(async () => {
    if (isCreating) return;
    
    const count = parseInt(prompt("创建多少个随机分类？", "10") || "0");
    if (count <= 0 || count > 100) {
      showError("请输入 1-100 之间的数字");
      return;
    }

    try {
      setIsCreating(true);
      await createRandomCategories(count);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      showSuccess({ message: `成功创建 ${count} 个随机分类！` });
    } catch (error) {
      showError(error instanceof Error ? error.message : "创建失败");
    } finally {
      setIsCreating(false);
    }
  }, [isCreating]);

  return (
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>分类管理</h1>
          <p className={styles.subtitle}>管理商品分类</p>
        </div>
        <div className={styles.actions}>
          {import.meta.env.DEV && (
            <button 
              className={styles.randomButton} 
              onClick={handleCreateRandom}
              disabled={isCreating}
            >
              <Wand2 size={20} />
              {isCreating ? "创建中..." : "随机分类"}
            </button>
          )}
          <button className={styles.addButton} onClick={handleAdd}>
            <Plus size={20} />
            添加分类
          </button>
        </div>
      </div>
  );
});

CategoryHeader.displayName = "CategoryHeader";

export default CategoryHeader;

