import type { ValueOf } from "@/utils/types";

import en_category from "./en/category.json";
import fr_category from "./fr/category.json";
import zh_category from "./zh/category.json";

// 所有语言包内容
export const RESOURCES = {
  en: {
    category: en_category,
  },
  zh: {
    category: zh_category,
  },
  fr: {
    category: fr_category,
  },
};

// 所有命名空间
export const NAME_SPACES_MAP = {
  category: "category",
};

export const NAME_SPACES = Object.values(NAME_SPACES_MAP);

// 所有语言类型
export const LANGUAGE = {
  EN: "en",
  ZH: "zh",
  FR: "fr",
} as const;

export type Language = ValueOf<typeof LANGUAGE>;
