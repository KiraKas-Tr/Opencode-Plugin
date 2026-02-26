/**
 * Auto-Format Hook
 *
 * Runs the project's formatter after file edits.
 * Detects prettier, biome, dprint, or other formatters from project config.
 * Runs on tool.execute.after for edit/write tools.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface AutoFormatConfig {
  enabled?: boolean;
  formatter?: string;
  extensions?: string[];
  log?: boolean;
}

export interface FormatResult {
  formatted: boolean;
  file: string;
  formatter: string;
  error?: string;
}

type FormatterEntry = {
  name: string;
  configFiles: string[];
  command: (file: string) => string;
};

const FORMATTERS: FormatterEntry[] = [
  {
    name: "prettier",
    configFiles: [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.yaml", ".prettierrc.yml", "prettier.config.js", "prettier.config.cjs"],
    command: (file: string) => `npx prettier --write "${file}"`,
  },
  {
    name: "biome",
    configFiles: ["biome.json", "biome.jsonc"],
    command: (file: string) => `npx @biomejs/biome format --write "${file}"`,
  },
  {
    name: "dprint",
    configFiles: ["dprint.json", ".dprint.json"],
    command: (file: string) => `dprint fmt "${file}"`,
  },
];

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html", ".md", ".yaml", ".yml"];

export function detectFormatter(projectDir: string): FormatterEntry | undefined {
  // Also check package.json for formatter deps
  const pkgPath = path.join(projectDir, "package.json");
  let pkgDeps: Record<string, string> = {};
  try {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkgDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    }
  } catch {
    // ignore
  }

  for (const formatter of FORMATTERS) {
    // Check config files
    for (const configFile of formatter.configFiles) {
      if (fs.existsSync(path.join(projectDir, configFile))) {
        return formatter;
      }
    }
    // Check package.json deps
    if (pkgDeps[formatter.name] || pkgDeps[`@biomejs/${formatter.name}`]) {
      return formatter;
    }
  }

  return undefined;
}

export function shouldFormat(filePath: unknown, extensions?: string[]): boolean {
  if (typeof filePath !== "string") return false;
  const ext = path.extname(filePath).toLowerCase();
  const allowedExts = extensions || DEFAULT_EXTENSIONS;
  return allowedExts.includes(ext);
}

export function runFormatter(
  filePath: unknown,
  projectDir: unknown,
  formatterOverride?: string
): FormatResult {
  const safePath = typeof filePath === "string" && filePath ? filePath : "";
  const safeDir = typeof projectDir === "string" && projectDir ? projectDir : process.cwd();
  const formatter = formatterOverride
    ? FORMATTERS.find((f) => f.name === formatterOverride)
    : detectFormatter(safeDir);

  if (!formatter || !safePath) {
    return {
      formatted: false,
      file: safePath,
      formatter: "none",
      error: formatter ? "No file path provided" : "No formatter detected",
    };
  }

  try {
    const cmd = formatter.command(safePath);
    execSync(cmd, {
      cwd: safeDir,
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      formatted: true,
      file: safePath,
      formatter: formatter.name,
    };
  } catch (err) {
    return {
      formatted: false,
      file: safePath,
      formatter: formatter.name,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatAutoFormatLog(result: FormatResult): string {
  if (result.formatted) {
    return `[CliKit:auto-format] Formatted ${result.file} with ${result.formatter}`;
  }
  return `[CliKit:auto-format] Failed to format ${result.file}: ${result.error}`;
}
