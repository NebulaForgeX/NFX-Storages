import type { RadixAppearance } from "nfx-ui/themes";

function publicUrl(file: string): string {
  return `${import.meta.env.BASE_URL}${file.replace(/^\//, "")}`;
}

export const LOGO_LIGHT = publicUrl("logo.svg");
export const LOGO_DARK = publicUrl("logo.svg");
export const LOGO_LIGHT_ICO = publicUrl("favicon.ico");
export const LOGO_DARK_ICO = publicUrl("favicon.ico");

export const getLogoSrc = (appearance: RadixAppearance): string => (appearance === "dark" ? LOGO_DARK : LOGO_LIGHT);

export const getLogoIcoSrc = (appearance: RadixAppearance): string => (appearance === "dark" ? LOGO_DARK_ICO : LOGO_LIGHT_ICO);

export const syncDocumentLogo = (appearance: RadixAppearance): void => {
  if (typeof document === "undefined") return;

  const href = getLogoIcoSrc(appearance);
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.type = "image/x-icon";
  try {
    const current = new URL(link.href, document.baseURI).pathname.replace(/\/+$/, "");
    const next = new URL(href, document.baseURI).pathname.replace(/\/+$/, "");
    if (current === next) return;
  } catch {
    /* fall through and set href */
  }
  link.href = href;
};
