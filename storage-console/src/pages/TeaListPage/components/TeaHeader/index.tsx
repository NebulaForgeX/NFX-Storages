import { memo, useState, useCallback } from "react";
import { Plus, Wand2 } from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";
import { pickImagesWithUserGesture } from "@/scripts/";
import { createRandomTeaFromFiles } from "@/scripts/";
import { showError, showSuccess } from "@/stores/modalStore";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

import styles from "./styles.module.css";

const TeaHeader = memo(() => {
  const navigate = useNavigate();
  const [isProcessing, setProcessing] = useState(false);

  const handleAdd = useCallback(() => {
    navigate(ROUTES.TEA_ADD);
  }, [navigate]);

  // ✅ 每次点击都会打开文件选择器
  const handleCreateRandomTea = useCallback(async () => {
    if (isProcessing) return;
    setProcessing(true);
    try {
      const files = await pickImagesWithUserGesture();  // ✅ 永远合法
      if (!files || files.length === 0) {
        showError("未选择图片，已取消。");
        return;
      }
      await createRandomTeaFromFiles(files);
      cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEAS);
      showSuccess({ message: "创建成功" });
    } catch (error) {
      showError(error instanceof Error ? error.message : "创建失败");
    } finally {
      setProcessing(false);
    }
  }, [isProcessing]);

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>茶叶管理</h1>
        <p className={styles.subtitle}>管理所有茶叶产品</p>
      </div>

      <div className={styles.actions}>
        {import.meta.env.DEV && (
          <button
            onClick={handleCreateRandomTea}
            className={styles.randomButton}
            disabled={isProcessing}
          >
            <Wand2 size={20} />
            {isProcessing ? "处理中..." : "随机创建茶叶"}
          </button>
        )}

        <button className={styles.addButton} onClick={handleAdd}>
          <Plus size={20} />
          添加茶叶
        </button>
      </div>
    </div>
  );
});

TeaHeader.displayName = "TeaHeader";

export default TeaHeader;
