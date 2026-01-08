import type { AuthSubcategory } from "@/apis/domain";

import axios from "axios";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";
import { DeleteSubcategory } from "@/apis/subcategory.api";
import { showConfirm, showSuccess, showError } from "@/stores/modalStore";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

/**
 * SubcategoryListItem 操作 Hook
 * 封装子分类列表项的所有操作逻辑
 */
export const useActionSubcategoryItem = () => {
  const navigate = useNavigate();

  /**
   * 编辑子分类
   */
  const handleEdit = useCallback(
    (subcategory: AuthSubcategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.SUBCATEGORY_EDIT.replace(":subcategoryId", subcategory.id));
    },
    [navigate],
  );

  /**
   * 查看子分类详情
   */
  const handleView = useCallback(
    (subcategory: AuthSubcategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.SUBCATEGORY_DETAIL.replace(":subcategoryId", subcategory.id));
    },
    [navigate],
  );

  /**
   * 删除子分类
   */
  const handleDelete = useCallback(
    (subcategory: AuthSubcategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      showConfirm({
        title: "删除子分类",
        message: `确定要删除子分类「${subcategory.name}」吗？此操作不可撤销。`,
        confirmText: "删除",
        cancelText: "取消",
        onConfirm: async () => {
          try {
            await DeleteSubcategory(subcategory.id);
            // 触发缓存失效事件
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORIES);
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_SUBCATEGORY, subcategory.id);
            showSuccess({ message: "子分类删除成功" });
          } catch (error) {
            let message = "删除失败，请稍后重试";
            if (axios.isAxiosError(error)) {
              const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
              if (serverMessage) {
                message = serverMessage;
              }
            } else if (error instanceof Error && error.message) {
              message = error.message;
            }
            console.error("Delete subcategory error:", error);
            showError(message);
          }
        },
      });
    },
    [],
  );

  return {
    handleEdit,
    handleView,
    handleDelete,
  };
};

export default useActionSubcategoryItem;

