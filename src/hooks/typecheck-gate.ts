/**
 * TypeCheck Gate Hook
 *
 * Runs TypeScript type checking after .ts/.tsx file edits.
 * Reports type errors inline so agents can fix them immediately.
 * Runs on tool.execute.after for edit/write tools.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface TypeCheckConfig {
  enabled?: boolean;
  tsconfig?: string;
  log?: boolean;
  block_on_error?: boolean;
}

export interface TypeDiagnostic {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

export interface TypeCheckResult {
  clean: boolean;
  errors: TypeDiagnostic[];
  checkedFile: string;
}

function normalizeTypeCheckResult(result: unknown): TypeCheckResult {
  if (!result || typeof result !== "object") {
    return { clean: true, errors: [], checkedFile: "" };
  }

  const raw = result as { clean?: unknown; errors?: unknown; checkedFile?: unknown };
  const errors = Array.isArray(raw.errors)
    ? raw.errors
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          file: typeof item.file === "string" ? item.file : "",
          line: typeof item.line === "number" ? item.line : 0,
          column: typeof item.column === "number" ? item.column : 0,
          code: typeof item.code === "string" ? item.code : "TS0000",
          message: typeof item.message === "string" ? item.message : "Unknown typecheck error",
        }))
    : [];

  const checkedFile = typeof raw.checkedFile === "string" ? raw.checkedFile : "";
  const clean = typeof raw.clean === "boolean" ? raw.clean : errors.length === 0;

  return { clean, errors, checkedFile };
}

const TS_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"];

export function isTypeScriptFile(filePath: unknown): boolean {
  if (typeof filePath !== "string") return false;
  return TS_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

export function findTsConfig(projectDir: unknown, override?: string): string | undefined {
  const safeDir = typeof projectDir === "string" && projectDir ? projectDir : process.cwd();
  if (override) {
    const overridePath = path.resolve(safeDir, override);
    return fs.existsSync(overridePath) ? overridePath : undefined;
  }

  const candidates = ["tsconfig.json", "tsconfig.build.json"];
  for (const candidate of candidates) {
    const fullPath = path.join(safeDir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

export function hasTscInstalled(projectDir: unknown): boolean {
  const safeDir = typeof projectDir === "string" && projectDir ? projectDir : process.cwd();
  try {
    execSync("npx tsc --version", {
      cwd: safeDir,
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

export function runTypeCheck(
  filePath: unknown,
  projectDir: unknown,
  config?: TypeCheckConfig
): TypeCheckResult {
  const safePath = typeof filePath === "string" && filePath ? filePath : "";
  const safeDir = typeof projectDir === "string" && projectDir ? projectDir : process.cwd();
  const tsConfig = findTsConfig(safeDir, config?.tsconfig);

  if (!tsConfig) {
    return { clean: true, errors: [], checkedFile: safePath };
  }

  try {
    const tscCmd = `npx tsc --noEmit --pretty false -p "${tsConfig}"`;

    execSync(tscCmd, {
      cwd: safeDir,
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf-8",
    });

    return { clean: true, errors: [], checkedFile: safePath };
  } catch (err) {
    const output = err instanceof Error && "stdout" in err
      ? String((err as { stdout: unknown }).stdout)
      : "";

    const errors = parseTscOutput(output, safePath);

    return {
      clean: errors.length === 0,
      errors,
      checkedFile: safePath,
    };
  }
}

function parseTscOutput(output: unknown, filterFile?: string): TypeDiagnostic[] {
  if (typeof output !== "string") return [];
  const diagnostics: TypeDiagnostic[] = [];
  const lines = output.split("\n");

  // tsc output format: file(line,col): error TSxxxx: message
  const pattern = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const [, file, lineNum, col, code, message] = match;
      const diagnostic: TypeDiagnostic = {
        file: file.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        code,
        message: message.trim(),
      };

      // If filtering, only include errors in the edited file
      if (filterFile) {
        const normalizedFilter = path.resolve(filterFile);
        const normalizedDiag = path.resolve(diagnostic.file);
        if (normalizedDiag === normalizedFilter) {
          diagnostics.push(diagnostic);
        }
      } else {
        diagnostics.push(diagnostic);
      }
    }
  }

  return diagnostics;
}

export function formatTypeCheckWarning(result: TypeCheckResult | unknown): string {
  const safeResult = normalizeTypeCheckResult(result);
  if (safeResult.clean) {
    return `[CliKit:typecheck] ${safeResult.checkedFile} — no type errors`;
  }

  const lines = [`[CliKit:typecheck] ${safeResult.errors.length} type error(s) in ${safeResult.checkedFile}:`];
  for (const err of safeResult.errors.slice(0, 10)) {
    lines.push(`  ${err.file}:${err.line}:${err.column} ${err.code}: ${err.message}`);
  }

  if (safeResult.errors.length > 10) {
    lines.push(`  ... and ${safeResult.errors.length - 10} more`);
  }

  return lines.join("\n");
}
