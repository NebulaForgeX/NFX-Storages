import { memo, useCallback, useState } from "react";
import { Plus, Wand2 } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";
import { createRandomSubcategories } from "@/scripts";
import { showError, showSuccess } from "@/stores/modalStore";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

import styles from "./styles.module.css";

const SubcategoryHeader = memo(() => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleAdd = useCallback(() => {
    navigate(ROUTES.SUBCATEGORY_ADD);
  }, [navigate]);

  const handleCreateRandom = useCallback(async () => {
    if (isCreating) return;
    
    const input = prompt("为每个分类创建多少个子分类？格式: min,max (例如: 3,5)", "3,5");
    if (!input) return;
    
    const [minStr, maxStr] = input.split(",").map(s => s.trim());
    const min = parseInt(minStr);
    const max = parseInt(maxStr);
    
    if (!min || !max || min < 1 || max > 20 || min > max) {
      showError("请输入有效范围，格式: min,max (1-20)");
      return;
    }

    try {
      setIsCreating(true);
      await createRandomSubcategories(min, max);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORIES);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
      showSuccess({ message: `成功为所有分类创建子分类！` });
    } catch (error) {
      showError(error instanceof Error ? error.message : "创建失败");
    } finally {
      setIsCreating(false);
    }
  }, [isCreating]);

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>子分类管理</h1>
        <p className={styles.subtitle}>管理商品子分类</p>
      </div>
      <div className={styles.actions}>
        {import.meta.env.DEV && (
          <button 
            className={styles.randomButton} 
            onClick={handleCreateRandom}
            disabled={isCreating}
          >
            <Wand2 size={20} />
            {isCreating ? "创建中..." : "随机子分类"}
          </button>
        )}
        <button className={styles.addButton} onClick={handleAdd}>
          <Plus size={20} />
          添加子分类
        </button>
      </div>
    </div>
  );
});

SubcategoryHeader.displayName = "SubcategoryHeader";

export default SubcategoryHeader;

