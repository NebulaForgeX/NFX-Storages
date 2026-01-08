import type { Language } from "./i18nResources";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { NAME_SPACES, RESOURCES } from "./i18nResources";

// 所有语言和命名空间资源
const fallbackLng = "en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: RESOURCES,
    lng: "en", // 默认使用英文
    fallbackLng,
    ns: NAME_SPACES,
    defaultNS: NAME_SPACES[0],
    interpolation: {
      escapeValue: false,
    },
    keySeparator: ".",
    detection: {
      order: ["navigator", "htmlTag", "path", "subdomain"],
    },
  });

export default i18n;

// 切换语言方法
export const ChangeLanguage = (lng: Language) => {
  i18n.changeLanguage(lng);
};
