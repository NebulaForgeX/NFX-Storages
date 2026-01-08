import type { Theme, ThemeName } from "../types";

import { corporateTheme } from "./corporate";
import { cosmicTheme } from "./cosmic";
import { darkTheme } from "./dark";
import { defaultTheme } from "./default";
import { lightTheme } from "./light";

export const themes: Record<ThemeName, Theme> = {
  default: defaultTheme,
  light: lightTheme,
  dark: darkTheme,
  cosmic: cosmicTheme,
  corporate: corporateTheme,
};

export { defaultTheme, lightTheme, darkTheme, cosmicTheme, corporateTheme };
