import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { AuthCategory, AuthSubcategory } from "@/apis/domain";

interface CategoryState {
  subcategory: AuthSubcategory | null;
  category: AuthCategory | null;
  setSubcategory: (subcategory: AuthSubcategory) => void;
  setCategory: (category: AuthCategory) => void;
  clearSubcategory: () => void;
  clearCategory: () => void;
  clearAll: () => void;
}

export const CategoryStore = createStore<CategoryState>()(
    subscribeWithSelector(
        (set) => ({
            subcategory: null,
            category: null,
            setSubcategory: (subcategory: AuthSubcategory) => set({ subcategory }),
            setCategory: (category: AuthCategory) => set({ category }),
            clearSubcategory: () => set({ subcategory: null }),
            clearCategory: () => set({ category: null }),
            clearAll: () => set({ subcategory: null, category: null }),
        })
    )
);

export default CategoryStore;
export const useCategoryStore = <T>(selector: (state: CategoryState) => T) => useStore(CategoryStore, selector);