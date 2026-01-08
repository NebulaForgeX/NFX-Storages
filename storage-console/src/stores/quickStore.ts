import { createStore, useStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

import { ROUTES } from "@/types/navigation";

export interface QuickNavItem {
  id: string;
  title: string;
  description: string;
  icon: string; // 存储icon名称，组件中动态渲染
  route: string;
  color: string;
}

// 所有可用的快速导航项（只包含实际存在的路由）
export const ALL_AVAILABLE_ITEMS: QuickNavItem[] = [
  // 个人中心
  {
    id: "profile",
    title: "个人资料",
    description: "查看账户设置和信息",
    icon: "User",
    route: ROUTES.PROFILE,
    color: "var(--color-primary)",
  },
  {
    id: "edit-profile",
    title: "编辑资料",
    description: "更新个人资料信息",
    icon: "Edit",
    route: ROUTES.EDIT_PROFILE,
    color: "var(--color-success)",
  },
  {
    id: "account-security",
    title: "账户安全",
    description: "管理密码和安全设置",
    icon: "Shield",
    route: ROUTES.ACCOUNT_SECURITY,
    color: "var(--color-warning)",
  },
  // 分类管理
  {
    id: "category-panel",
    title: "分类面板",
    description: "查看所有分类和子分类",
    icon: "LayoutGrid",
    route: ROUTES.CATEGORY_PANEL,
    color: "var(--color-info)",
  },
  {
    id: "category-list",
    title: "分类列表",
    description: "管理所有茶叶分类",
    icon: "Package",
    route: ROUTES.CATEGORY_LIST,
    color: "var(--color-primary)",
  },
  {
    id: "category-add",
    title: "添加分类",
    description: "创建新的茶叶分类",
    icon: "FolderPlus",
    route: ROUTES.CATEGORY_ADD,
    color: "var(--color-success)",
  },
  // 子分类管理
  {
    id: "subcategory-list",
    title: "子分类列表",
    description: "管理所有子分类",
    icon: "FolderTree",
    route: ROUTES.SUBCATEGORY_LIST,
    color: "var(--color-info)",
  },
  {
    id: "subcategory-add",
    title: "添加子分类",
    description: "创建新的子分类",
    icon: "FolderPlus",
    route: ROUTES.SUBCATEGORY_ADD,
    color: "var(--color-warning)",
  },
  // 茶叶管理
  {
    id: "tea-list",
    title: "茶叶列表",
    description: "管理所有茶叶产品",
    icon: "Leaf",
    route: ROUTES.TEA_LIST,
    color: "var(--color-success)",
  },
  {
    id: "tea-add",
    title: "添加茶叶",
    description: "创建新的茶叶产品",
    icon: "Plus",
    route: ROUTES.TEA_ADD,
    color: "var(--color-primary)",
  },
];

interface QuickState {
  isEditMode: boolean;
  items: QuickNavItem[];
}

interface QuickActions {
  setEditMode: (editMode: boolean) => void;
  toggleEditMode: () => void;
  addItem: (item: QuickNavItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, item: Partial<QuickNavItem>) => void;
  reorderItems: (items: QuickNavItem[]) => void;
  resetItems: () => void;
}

// 默认快速导航项（从所有可用项中选择前7个）
const defaultItems: QuickNavItem[] = ALL_AVAILABLE_ITEMS.slice(0, 7);

const defaultState: QuickState = {
  isEditMode: false,
  items: defaultItems,
};

export const QuickStore = createStore<QuickState & QuickActions>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...defaultState,

        setEditMode: (editMode) => set({ isEditMode: editMode }),

        toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

        addItem: (item) =>
          set((state) => ({
            items: [...state.items, item],
          })),

        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          })),

        updateItem: (id, updatedItem) =>
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)),
          })),

        reorderItems: (items) => set({ items }),

        resetItems: () => set({ items: defaultItems }),
      }),
      {
        name: "quick-nav-storage",
        version: 2, // 版本号，修改后会清除旧数据
        partialize: (state) => ({
          items: state.items,
        }),
        migrate: (persistedState: any, version: number) => {
          // 如果版本不匹配，返回默认状态
          if (version < 2) {
            return { items: defaultItems };
          }
          return persistedState as QuickState;
        },
      },
    ),
  ),
);

export default QuickStore;
export const useQuickStore = <T>(selector: (state: QuickState & QuickActions) => T) => useStore(QuickStore, selector);
