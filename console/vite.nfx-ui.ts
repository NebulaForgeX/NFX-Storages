import { execFileSync } from "node:child_process";
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

/** Public path on NFX-Edge, e.g. `/console/nfx-identity/`. */
export function nfxConsoleBase(env: Record<string, string>): string {
  let b = (env.VITE_BASE || "/").trim() || "/";
  if (!b.startsWith("/")) b = `/${b}`;
  if (!b.endsWith("/")) b += "/";
  return b;
}

export function nfxPublicOrigin(env: Record<string, string>): string {
  const raw = env.VITE_PUBLIC_ORIGIN?.trim();
  if (raw) return raw.replace(/\/$/, "");
  try {
    return new URL(env.VITE_API_URL).origin;
  } catch {
    return "http://192.168.1.64";
  }
}

/** Vite bind + HMR when the console is reached via Edge `:80` (`DOCKER=1`). */
export function nfxViteDevServer(env: Record<string, string>, port: number) {
  const origin = nfxPublicOrigin(env);
  const u = new URL(origin);
  const behindEdge = process.env.DOCKER === "1";
  return {
    port,
    strictPort: true as const,
    host: "0.0.0.0",
    open: process.env.DOCKER !== "1",
    allowedHosts: true as const,
    ...(behindEdge
      ? {
          origin,
          hmr: {
            protocol: (u.protocol === "https:" ? "wss" : "ws") as "ws" | "wss",
            host: u.hostname,
            clientPort: u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80,
          },
        }
      : {}),
  };
}

export function nfxViteDefine(env: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([k]) => k.startsWith("VITE_"))
      .map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]),
  );
}

/** Vite 8 Rolldown serves CJS `async-retry` without `export default`; wrap as ESM. */
const NFX_ASYNC_RETRY_ID = "\0nfx-ui-async-retry";
const NFX_ASYNC_RETRY_ESM = `export default function retry(fn, opts) {
  return new Promise(function (resolve, reject) {
    var options = opts || {};
    if (!("randomize" in options)) options.randomize = true;
    var retries = options.retries != null ? options.retries : 10;
    var factor = options.factor != null ? options.factor : 2;
    var minTimeout = options.minTimeout != null ? options.minTimeout : 1000;
    var maxTimeout = options.maxTimeout != null ? options.maxTimeout : Infinity;
    var randomize = options.randomize !== false;

    function bail(err) {
      reject(err || new Error("Aborted"));
    }

    function onError(err, num) {
      if (err && err.bail) {
        bail(err);
        return;
      }
      if (num > retries) {
        reject(err);
        return;
      }
      if (options.onRetry) options.onRetry(err, num);
      var noise = randomize ? Math.random() + 1 : 1;
      var ms = Math.min(Math.round(noise * Math.max(minTimeout, 1) * Math.pow(factor, num - 1)), maxTimeout);
      setTimeout(function () { runAttempt(num + 1); }, ms);
    }

    function runAttempt(num) {
      var val;
      try {
        val = fn(bail, num);
      } catch (err) {
        onError(err, num);
        return;
      }
      Promise.resolve(val).then(resolve).catch(function (err) {
        onError(err, num);
      });
    }

    runAttempt(1);
  });
}
`;

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
      if (id === "async-retry") return NFX_ASYNC_RETRY_ID;
      if (!id.startsWith("@/")) return null;
      if (importer && isNfxUiImporter(importer)) return resolveUnder(pkgSrc, id);
      return resolveUnder(hostSrc, id);
    },
    load(id) {
      if (id === NFX_ASYNC_RETRY_ID) return NFX_ASYNC_RETRY_ESM;
      return null;
    },
  };
}

export function nfxUiViteAliases(consoleRoot: string, nfxUiRoot: string): Alias[] {
  const nm = path.resolve(consoleRoot, "node_modules");
  const src = path.resolve(nfxUiRoot, "src");
  const aliases: Alias[] = [
    { find: /^nfx-ui\/icons$/, replacement: path.join(src, "animations/index.ts") },
    { find: /^nfx-ui\/icons\/(.*)/, replacement: path.join(src, "animations/$1") },
    { find: /^nfx-ui\/(.*)/, replacement: path.join(src, "$1") },
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

/** Free `port` before Vite binds (stale host `npm run dev`). Never run in Docker: `fuser -k` / SIGKILL hits this Vite. */
export function killTcpPort(port: number): void {
  if (process.env.DOCKER === "1") return;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return;
  const skip = new Set([1, process.pid, process.ppid].filter((n) => Number.isInteger(n) && n > 0));
  try {
    const out = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    for (const token of out.split(/\s+/).filter(Boolean)) {
      const pid = Number(token);
      if (!Number.isInteger(pid) || skip.has(pid)) continue;
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening, or lsof missing */
  }
}

export function nfxKillListenPortPlugin(port: number): Plugin {
  return {
    name: "nfx-kill-listen-port",
    configureServer() {
      killTcpPort(port);
    },
    configurePreviewServer() {
      killTcpPort(port);
    },
  };
}

export const nfxUiOptimizeDepsExclude = ["nfx-ui", "templates", "async-retry"];

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
