import axios from "axios";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteTea } from "@/apis/tea.api";
import { showConfirm, showSuccess, showError } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";
import type { AuthTea } from "@/apis/domain";
import { cacheEventEmitter, cacheEvents } from "@/events/cache";

export const useActionTeaItem = () => {
  const navigate = useNavigate();

  const handleEdit = useCallback(
    (tea: AuthTea) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.TEA_EDIT.replace(":teaId", tea.id));
    },
    [navigate],
  );

  const handleView = useCallback(
    (tea: AuthTea) => (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(ROUTES.TEA_DETAIL.replace(":teaId", tea.id));
    },
    [navigate],
  );

  const handleDelete = useCallback(
    (tea: AuthTea) => (e: React.MouseEvent) => {
      e.stopPropagation();
      showConfirm({
        title: "删除茶叶",
        message: `确定要删除茶叶「${tea.name}」吗？此操作不可撤销。`,
        confirmText: "删除",
        cancelText: "取消",
        onConfirm: async () => {
          try {
            await DeleteTea(tea.id);
            // 触发缓存失效事件
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEAS);
            cacheEventEmitter.emit(cacheEvents.INVALIDATE_TEA, tea.id);
            showSuccess({ message: "茶叶删除成功" });
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
            console.error("Delete tea error:", error);
            showError(message);
          }
        },
      });
    },
    [navigate],
  );

  return { handleEdit, handleView, handleDelete };
};

export default useActionTeaItem;