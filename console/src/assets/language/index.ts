import type { CreateI18nResourcesResult, NameSpacesMap, Resources } from "nfx-ui/languages";

import enHooks from "./en/hooks.json";
import enLanguage from "./en/language.json";
import enAuthShell from "./en/pages/Account/AuthShell.json";
import enLogin from "./en/pages/Account/Login.json";
import enSignup from "./en/pages/Account/Signup.json";
import enUserProfileEdit from "./en/pages/User/Profile/Edit.json";
import enUserProfileIdentities from "./en/pages/User/Profile/Identities.json";
import enUserProfileOverview from "./en/pages/User/Profile/Overview.json";
import enUserSetting from "./en/pages/User/Setting.json";
import enCommon from "./en/common.json";
import enComponents from "./en/components.json";
import enEditPreference from "./en/EditPreferencePage.json";

import frHooks from "./fr/hooks.json";
import frLanguage from "./fr/language.json";
import frAuthShell from "./fr/pages/Account/AuthShell.json";
import frLogin from "./fr/pages/Account/Login.json";
import frSignup from "./fr/pages/Account/Signup.json";
import frUserProfileEdit from "./fr/pages/User/Profile/Edit.json";
import frUserProfileIdentities from "./fr/pages/User/Profile/Identities.json";
import frUserProfileOverview from "./fr/pages/User/Profile/Overview.json";
import frUserSetting from "./fr/pages/User/Setting.json";
import frCommon from "./fr/common.json";
import frComponents from "./fr/components.json";
import frEditPreference from "./fr/EditPreferencePage.json";

import zhHooks from "./zh/hooks.json";
import zhLanguage from "./zh/language.json";
import zhAuthShell from "./zh/pages/Account/AuthShell.json";
import zhLogin from "./zh/pages/Account/Login.json";
import zhSignup from "./zh/pages/Account/Signup.json";
import zhUserProfileEdit from "./zh/pages/User/Profile/Edit.json";
import zhUserProfileIdentities from "./zh/pages/User/Profile/Identities.json";
import zhUserProfileOverview from "./zh/pages/User/Profile/Overview.json";
import zhUserSetting from "./zh/pages/User/Setting.json";
import zhCommon from "./zh/common.json";
import zhComponents from "./zh/components.json";
import zhEditPreference from "./zh/EditPreferencePage.json";

const PAGE = {
  AuthShell: "pages.Account.AuthShell",
  Login: "pages.Account.Login",
  Signup: "pages.Account.Signup",
  UserSetting: "pages.User.Setting",
  UserProfileOverview: "pages.User.Profile.Overview",
  UserProfileEdit: "pages.User.Profile.Edit",
  UserProfileIdentities: "pages.User.Profile.Identities",
} as const;

const BUILTIN_I18N_NAMESPACES_MAP: NameSpacesMap = {
  language: "language",
  hooks: "hooks",
  ...PAGE,
  common: "common",
  components: "components",
  EditPreferencePage: "EditPreferencePage",
};

export function getBuiltinI18nBundles(): CreateI18nResourcesResult {
  const RESOURCES: Resources = {
    en: {
      language: enLanguage,
      hooks: enHooks,
      [PAGE.AuthShell]: enAuthShell,
      [PAGE.Login]: enLogin,
      [PAGE.Signup]: enSignup,
      [PAGE.UserSetting]: enUserSetting,
      [PAGE.UserProfileOverview]: enUserProfileOverview,
      [PAGE.UserProfileEdit]: enUserProfileEdit,
      [PAGE.UserProfileIdentities]: enUserProfileIdentities,
      common: enCommon,
      components: enComponents,
      EditPreferencePage: enEditPreference,
    },
    zh: {
      language: zhLanguage,
      hooks: zhHooks,
      [PAGE.AuthShell]: zhAuthShell,
      [PAGE.Login]: zhLogin,
      [PAGE.Signup]: zhSignup,
      [PAGE.UserSetting]: zhUserSetting,
      [PAGE.UserProfileOverview]: zhUserProfileOverview,
      [PAGE.UserProfileEdit]: zhUserProfileEdit,
      [PAGE.UserProfileIdentities]: zhUserProfileIdentities,
      common: zhCommon,
      components: zhComponents,
      EditPreferencePage: zhEditPreference,
    },
    fr: {
      language: frLanguage,
      hooks: frHooks,
      [PAGE.AuthShell]: frAuthShell,
      [PAGE.Login]: frLogin,
      [PAGE.Signup]: frSignup,
      [PAGE.UserSetting]: frUserSetting,
      [PAGE.UserProfileOverview]: frUserProfileOverview,
      [PAGE.UserProfileEdit]: frUserProfileEdit,
      [PAGE.UserProfileIdentities]: frUserProfileIdentities,
      common: frCommon,
      components: frComponents,
      EditPreferencePage: frEditPreference,
    },
  };
  return {
    RESOURCES,
    NAME_SPACES_MAP: BUILTIN_I18N_NAMESPACES_MAP,
    NAME_SPACES: Object.values(BUILTIN_I18N_NAMESPACES_MAP),
  };
}
