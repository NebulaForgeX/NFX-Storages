import fs from "node:fs";
import path from "node:path";
import type { Alias, Plugin } from "vite";

/** Minimal KEY=VALUE parser (no extra dep); skips blanks/comments, strips surrounding quotes. */
export function parseEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq === -1) continue;
    const key = s.slice(0, eq).trim();
    let val = s.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Pick the env file by mode (mirrors PulsoLink-WEB): secure → .secure.env, else → .env.
 * Console lives under the product root; product .env then console .env.
 * process.env VITE_* wins so Docker `--build-arg VITE_API_URL` keeps overriding.
 */
export function loadNfxConsoleEnv(consoleRoot: string, mode: string): Record<string, string> {
  const productRoot = path.resolve(consoleRoot, "..");
  const file = mode === "secure" ? ".secure.env" : ".env";
  const merged = {
    ...parseEnvFile(path.join(productRoot, file)),
    ...parseEnvFile(path.join(consoleRoot, file)),
  };
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("VITE_") && v !== undefined) merged[k] = v;
  }
  return merged;
}

/** Local NFX-UI root: NFX_UI_PATH → product .env → sibling repo → node_modules. */
export function resolveNfxUiRoot(consoleRoot: string): string {
  const productRoot = path.resolve(consoleRoot, "..");
  const fromProcess = process.env.NFX_UI_PATH?.trim();
  if (fromProcess) return path.isAbsolute(fromProcess) ? fromProcess : path.resolve(consoleRoot, fromProcess);
  const fromFile = parseEnvFile(path.join(productRoot, ".env")).NFX_UI_PATH?.trim();
  if (fromFile) return path.isAbsolute(fromFile) ? fromFile : path.resolve(productRoot, fromFile);
  const sibling = path.resolve(consoleRoot, "../../NFX-UI");
  if (fs.existsSync(path.join(sibling, "src"))) return sibling;
  return path.resolve(consoleRoot, "node_modules/nfx-ui");
}

export function nfxViteDefine(env: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([k]) => k.startsWith("VITE_"))
      .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
  );
}

/**
 * Own `@/` resolution for both console and NFX-UI.
 * Must NOT use resolve.alias `@` → console src: Vite alias wins over plugins and breaks
 * package-internal `@/` (files under NFX-UI / node_modules/nfx-ui).
 */
export function nfxUiAtAliasPlugin(consoleRoot: string, nfxUiRoot: string): Plugin {
  const hostSrc = path.resolve(consoleRoot, "src");
  const pkgRoot = fs.existsSync(nfxUiRoot) ? fs.realpathSync(path.resolve(nfxUiRoot)) : path.resolve(nfxUiRoot);
  const pkgSrc = path.join(pkgRoot, "src");
  const pkgPrefix = pkgRoot.endsWith(path.sep) ? pkgRoot : `${pkgRoot}${path.sep}`;

  function realpathSafe(p: string): string {
    try {
      return fs.realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  }

  function isNfxUiImporter(importer: string): boolean {
    const clean = importer.replace(/[?#].*$/, "");
    const abs = realpathSafe(clean);
    if (abs.startsWith(pkgPrefix)) return true;
    const norm = clean.replace(/\\/g, "/");
    return /(?:^|\/)(?:nfx-ui|NFX-UI)\//.test(norm);
  }

  function resolveUnder(srcRoot: string, id: string): string | null {
    const base = path.resolve(srcRoot, id.slice(2));
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
      path.join(base, "index.js"),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    return null;
  }

  return {
    name: "nfx-ui-at-alias",
    enforce: "pre",
    resolveId(id, importer) {
      if (!id.startsWith("@/")) return null;
      if (importer && isNfxUiImporter(importer)) return resolveUnder(pkgSrc, id);
      return resolveUnder(hostSrc, id);
    },
  };
}

export function nfxUiViteAliases(consoleRoot: string, nfxUiRoot: string): Alias[] {
  const nm = path.resolve(consoleRoot, "node_modules");
  const aliases: Alias[] = [
    { find: /^nfx-ui\/(.*)/, replacement: path.resolve(nfxUiRoot, "src/$1") },
    { find: /^react$/, replacement: path.resolve(nm, "react") },
    { find: /^react-dom$/, replacement: path.resolve(nm, "react-dom") },
  ];
  if (fs.existsSync(path.join(nm, "@fontsource"))) {
    aliases.push({ find: /^@fontsource\/(.*)/, replacement: `${path.join(nm, "@fontsource")}/$1` });
  }
  if (fs.existsSync(path.join(nm, "@ibm"))) {
    aliases.push({ find: /^@ibm\/(.*)/, replacement: `${path.join(nm, "@ibm")}/$1` });
  }
  const lucideIcons = path.join(nm, "lucide-react/dist/esm/icons");
  if (fs.existsSync(lucideIcons)) {
    aliases.push({ find: "lucide-react/icons", replacement: lucideIcons });
  }
  return aliases;
}

export const nfxUiOptimizeDepsExclude = ["nfx-ui", "templates"];

export const nfxUiDedupe = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react-hook-form",
  "@hookform/resolvers",
  "zod",
  "lucide-react",
  "@tanstack/react-query",
  "zustand",
];
