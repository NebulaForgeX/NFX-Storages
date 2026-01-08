import { create, useStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

interface LayoutState {
  sidebarOpen: boolean;
  layoutMode: "show" | "hide"; // show = SideShowLayout, hide = SideHideLayout
}

interface LayoutActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setLayoutMode: (mode: "show" | "hide") => void;
}

// 默认状态
const defaultState: LayoutState = {
  sidebarOpen: false,
  layoutMode: "show",
};

export const LayoutStore = create<LayoutState & LayoutActions>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...defaultState,

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        closeSidebar: () => set({ sidebarOpen: false }),

        setLayoutMode: (mode) => set({ layoutMode: mode }),
      }),
      {
        name: "layout-storage",
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          layoutMode: state.layoutMode,
        }),
      },
    ),
  ),
);

export default LayoutStore;
export const useLayoutStore = <T>(selector: (state: LayoutState & LayoutActions) => T) =>
  useStore(LayoutStore, selector);
