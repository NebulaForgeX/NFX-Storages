import en_common from "./en/common.json";
import en_components from "./en/components.json";
import en_EditPreferencePage from "./en/EditPreferencePage.json";
import en_LoginPage from "./en/LoginPage.json";
import zh_common from "./zh/common.json";
import zh_components from "./zh/components.json";
import zh_EditPreferencePage from "./zh/EditPreferencePage.json";
import zh_LoginPage from "./zh/LoginPage.json";

export const RESOURCES = {
  en: {
    common: en_common,
    LoginPage: en_LoginPage,
    EditPreferencePage: en_EditPreferencePage,
    components: en_components,
  },
  zh: {
    common: zh_common,
    LoginPage: zh_LoginPage,
    EditPreferencePage: zh_EditPreferencePage,
    components: zh_components,
  },
};

export const NAME_SPACES_MAP = {
  common: "common",
  LoginPage: "LoginPage",
  EditPreferencePage: "EditPreferencePage",
  components: "components",
};

export const NAME_SPACES = Object.values(NAME_SPACES_MAP);

export function getBuiltinI18nBundles() {
  return { RESOURCES, NAME_SPACES_MAP, NAME_SPACES };
}
