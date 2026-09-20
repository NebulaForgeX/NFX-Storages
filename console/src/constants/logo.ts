import type { RadixAppearance } from "nfx-ui/themes";

export const LOGO_LIGHT = "/logo.svg";
export const LOGO_DARK = "/logo.svg";
export const LOGO_LIGHT_ICO = "/favicon.ico";
export const LOGO_DARK_ICO = "/favicon.ico";

export const getLogoSrc = (appearance: RadixAppearance): string => (appearance === "dark" ? LOGO_DARK : LOGO_LIGHT);

export const getLogoIcoSrc = (appearance: RadixAppearance): string => (appearance === "dark" ? LOGO_DARK_ICO : LOGO_LIGHT_ICO);

export const syncDocumentLogo = (appearance: RadixAppearance): void => {
  if (typeof document === "undefined") return;

  const href = getLogoIcoSrc(appearance);
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/x-icon";
    document.head.appendChild(link);
  }

  if (link.href.endsWith(href)) return;
  link.href = href;
};
