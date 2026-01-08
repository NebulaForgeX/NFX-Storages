import type { AuthCategory } from "@/apis/domain";

import axios from "axios";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/types/navigation";
import { DeleteCategory } from "@/apis/category.api";
import { showConfirm, showSuccess, showError } from "@/stores/modalStore";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

/**
 * CategoryListItem 操作 Hook
 * 封装分类列表项的所有操作逻辑
 */
export const useActionCategoryItem = () => {
  const navigate = useNavigate();

  /**
   * 编辑分类
   */
  const handleEdit = useCallback(
    (category: AuthCategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.CATEGORY_EDIT.replace(":categoryId", category.id));
    },
    [navigate],
  );

  /**
   * 查看分类详情
   */
  const handleView = useCallback(
    (category: AuthCategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.CATEGORY_DETAIL.replace(":categoryId", category.id));
    },
    [navigate],
  );

  /**
   * 添加子分类
   */
  const handleAddSubcategory = useCallback(
    (category: AuthCategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.SUBCATEGORY_ADD, { state: { parentCategoryId: category.id } });
    },
    [navigate],
  );

  /**
   * 删除分类
   */
  const handleDelete = useCallback(
    (category: AuthCategory) => (e: React.MouseEvent) => {
      e.stopPropagation();
      showConfirm({
        title: "删除分类",
        message: `确定要删除分类「${category.name}」吗？此操作不可撤销。`,
        confirmText: "删除",
        cancelText: "取消",
        onConfirm: async () => {
          try {
            await DeleteCategory(category.id);
            // 触发缓存失效事件
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORIES);
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_CATEGORY, category.id);
            showSuccess({ message: "分类删除成功" });
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
            console.error("Delete category error:", error);
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
    handleAddSubcategory,
    handleDelete,
  };
};

export default useActionCategoryItem;

