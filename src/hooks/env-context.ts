/**
 * Environment Context Hook
 *
 * Injects project structure, git branch, build system, and runtime
 * environment details into session prompts. Provides agents with
 * awareness of the development environment.
 * Runs on session.created event.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface EnvContextConfig {
  enabled?: boolean;
  include_git?: boolean;
  include_package?: boolean;
  include_structure?: boolean;
  max_depth?: number;
}

export interface EnvInfo {
  platform: string;
  nodeVersion: string;
  cwd: string;
  git?: GitInfo;
  package?: PackageInfo;
  structure?: string[];
}

export interface GitInfo {
  branch: string;
  hasChanges: boolean;
  remoteUrl?: string;
  lastCommit?: string;
}

export interface PackageInfo {
  name?: string;
  version?: string;
  packageManager?: string;
  scripts?: string[];
  framework?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function runSilent(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 5000, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

export function getGitInfo(cwd: string): GitInfo | undefined {
  const branch = runSilent("git rev-parse --abbrev-ref HEAD", cwd);
  if (!branch) return undefined;

  const status = runSilent("git status --porcelain", cwd);
  const remoteUrl = runSilent("git remote get-url origin", cwd);
  const lastCommit = runSilent("git log -1 --format=%s", cwd);

  return {
    branch,
    hasChanges: !!status && status.length > 0,
    remoteUrl: remoteUrl || undefined,
    lastCommit: lastCommit || undefined,
  };
}

export function getPackageInfo(cwd: string): PackageInfo | undefined {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) return undefined;

  try {
    const parsed = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const pkg = isRecord(parsed) ? parsed : {};
    const scriptsObj = isRecord(pkg.scripts) ? pkg.scripts : {};
    const scripts = Object.keys(scriptsObj);

    let packageManager: string | undefined;
    if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) {
      packageManager = "bun";
    } else if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
      packageManager = "pnpm";
    } else if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
      packageManager = "yarn";
    } else if (fs.existsSync(path.join(cwd, "package-lock.json"))) {
      packageManager = "npm";
    }

    let framework: string | undefined;
    const deps = isRecord(pkg.dependencies) ? pkg.dependencies : {};
    const devDeps = isRecord(pkg.devDependencies) ? pkg.devDependencies : {};
    const allDeps = { ...deps, ...devDeps };
    if (allDeps["next"]) framework = "Next.js";
    else if (allDeps["nuxt"]) framework = "Nuxt";
    else if (allDeps["@angular/core"]) framework = "Angular";
    else if (allDeps["svelte"]) framework = "Svelte";
    else if (allDeps["vue"]) framework = "Vue";
    else if (allDeps["react"]) framework = "React";
    else if (allDeps["express"]) framework = "Express";
    else if (allDeps["fastify"]) framework = "Fastify";
    else if (allDeps["hono"]) framework = "Hono";

    return {
      name: typeof pkg.name === "string" ? pkg.name : undefined,
      version: typeof pkg.version === "string" ? pkg.version : undefined,
      packageManager,
      scripts,
      framework,
    };
  } catch {
    return undefined;
  }
}

export function getTopLevelStructure(cwd: string, maxDepth: number = 2): string[] {
  const entries: string[] = [];

  function walk(dir: string, depth: number, prefix: string) {
    if (depth > maxDepth) return;

    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const filtered = items
        .filter((i) => !i.name.startsWith(".") && i.name !== "node_modules" && i.name !== "dist" && i.name !== "__pycache__")
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

      for (const item of filtered.slice(0, 20)) {
        const suffix = item.isDirectory() ? "/" : "";
        entries.push(`${prefix}${item.name}${suffix}`);
        if (item.isDirectory() && depth < maxDepth) {
          walk(path.join(dir, item.name), depth + 1, prefix + "  ");
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  walk(cwd, 1, "");
  return entries;
}

export function collectEnvInfo(cwd: unknown, config?: EnvContextConfig): EnvInfo {
  const safeCwd = typeof cwd === "string" && cwd ? cwd : process.cwd();
  const info: EnvInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    cwd: safeCwd,
  };

  if (config?.include_git !== false) {
    info.git = getGitInfo(safeCwd);
  }

  if (config?.include_package !== false) {
    info.package = getPackageInfo(safeCwd);
  }

  if (config?.include_structure !== false) {
    info.structure = getTopLevelStructure(safeCwd, config?.max_depth ?? 2);
  }

  return info;
}

export function buildEnvBlock(info: EnvInfo): string {
  const lines: string[] = ["<env-context>"];

  lines.push(`Platform: ${info.platform}`);
  lines.push(`Node: ${info.nodeVersion}`);
  lines.push(`CWD: ${info.cwd}`);

  if (info.git) {
    lines.push(`\nGit:`);
    lines.push(`  Branch: ${info.git.branch}`);
    lines.push(`  Dirty: ${info.git.hasChanges}`);
    if (info.git.remoteUrl) lines.push(`  Remote: ${info.git.remoteUrl}`);
    if (info.git.lastCommit) lines.push(`  Last commit: ${info.git.lastCommit}`);
  }

  if (info.package) {
    lines.push(`\nPackage:`);
    if (info.package.name) lines.push(`  Name: ${info.package.name}`);
    if (info.package.version) lines.push(`  Version: ${info.package.version}`);
    if (info.package.packageManager) lines.push(`  Package manager: ${info.package.packageManager}`);
    if (info.package.framework) lines.push(`  Framework: ${info.package.framework}`);
    if (info.package.scripts?.length) {
      lines.push(`  Scripts: ${info.package.scripts.join(", ")}`);
    }
  }

  if (info.structure?.length) {
    lines.push(`\nProject structure:`);
    for (const entry of info.structure) {
      lines.push(`  ${entry}`);
    }
  }

  lines.push("</env-context>");
  return lines.join("\n");
}

export function formatEnvSummary(info: EnvInfo): string {
  const parts = [`${info.platform}/${info.nodeVersion}`];
  if (info.git) parts.push(`branch:${info.git.branch}`);
  if (info.package?.framework) parts.push(info.package.framework);
  if (info.package?.packageManager) parts.push(info.package.packageManager);
  return `[CliKit:env-context] ${parts.join(", ")}`;
}
