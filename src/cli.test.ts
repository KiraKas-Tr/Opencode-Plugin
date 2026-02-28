import { describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import {
  resolveProjectDir,
  scaffoldProjectOpencode,
  upsertPluginEntry,
} from "./cli";

describe("upsertPluginEntry", () => {
  it("replaces existing plugin variants with versioned entry", () => {
    const next = upsertPluginEntry(
      ["foo", "clikit-plugin", "clikit-plugin@0.1.0", "bar"],
      "clikit-plugin",
      "0.2.20"
    );

    expect(next).toEqual(["foo", "bar", "clikit-plugin@0.2.20"]);
  });
});

describe("scaffoldProjectOpencode", () => {
  it("copies bundled assets and creates index.ts", () => {
    const root = mkdtempSync(path.join(tmpdir(), "clikit-scaffold-"));
    const pkgRoot = path.join(root, "pkg");
    const projectDir = path.join(root, "project");

    mkdirSync(path.join(pkgRoot, "command"), { recursive: true });
    mkdirSync(path.join(pkgRoot, "skill"), { recursive: true });
    mkdirSync(path.join(pkgRoot, "memory", "_templates"), { recursive: true });
    mkdirSync(path.join(pkgRoot, "src", "agents"), { recursive: true });
    mkdirSync(projectDir, { recursive: true });

    writeFileSync(path.join(pkgRoot, "AGENTS.md"), "# Agents\n");
    writeFileSync(path.join(pkgRoot, "README.md"), "# CliKit\n");
    writeFileSync(path.join(pkgRoot, "command", "start.md"), "start\n");
    writeFileSync(path.join(pkgRoot, "skill", "build.md"), "build\n");
    writeFileSync(path.join(pkgRoot, "memory", "_templates", "plan.md"), "plan\n");
    writeFileSync(path.join(pkgRoot, "src", "agents", "build.md"), "agent\n");

    const stats = scaffoldProjectOpencode(projectDir, pkgRoot);

    expect(stats.missingSources).toEqual([]);
    expect(readFileSync(path.join(projectDir, ".opencode", "AGENTS.md"), "utf8")).toContain("# Agents");
    expect(readFileSync(path.join(projectDir, ".opencode", "README-clikit.md"), "utf8")).toContain("# CliKit");
    expect(readFileSync(path.join(projectDir, ".opencode", "command", "start.md"), "utf8")).toBe("start\n");
    expect(readFileSync(path.join(projectDir, ".opencode", "skill", "build.md"), "utf8")).toBe("build\n");
    expect(readFileSync(path.join(projectDir, ".opencode", "memory", "_templates", "plan.md"), "utf8")).toBe("plan\n");
    expect(readFileSync(path.join(projectDir, ".opencode", "src", "agents", "build.md"), "utf8")).toBe("agent\n");
    expect(readFileSync(path.join(projectDir, ".opencode", "index.ts"), "utf8")).toContain(
      'import CliKitPlugin from "clikit-plugin";'
    );
    expect(stats.copied).toBeGreaterThan(0);

    const second = scaffoldProjectOpencode(projectDir, pkgRoot);
    expect(second.skipped).toBeGreaterThan(0);
  });
});

describe("global install mode", () => {
  it("uses npm plugin and does not require copied local plugin files", () => {
    const root = mkdtempSync(path.join(tmpdir(), "clikit-global-mode-"));
    const configDir = path.join(root, "config");
    mkdirSync(path.join(configDir, "plugins"), { recursive: true });
    writeFileSync(path.join(configDir, "plugins", "clikit.js"), "legacy\n");

    expect(existsSync(path.join(configDir, "plugins", "clikit.js"))).toBe(true);
  });
});

describe("resolveProjectDir", () => {
  it("prefers INIT_CWD when available", () => {
    const root = mkdtempSync(path.join(tmpdir(), "clikit-resolve-"));
    const init = path.join(root, "init");
    const pwd = path.join(root, "pwd");
    const cwd = path.join(root, "cwd");
    mkdirSync(init, { recursive: true });
    mkdirSync(pwd, { recursive: true });
    mkdirSync(cwd, { recursive: true });

    expect(resolveProjectDir({ INIT_CWD: init, PWD: pwd }, cwd)).toBe(init);
  });

  it("falls back to PWD then cwd", () => {
    const root = mkdtempSync(path.join(tmpdir(), "clikit-resolve-"));
    const pwd = path.join(root, "pwd");
    const cwd = path.join(root, "cwd");
    mkdirSync(pwd, { recursive: true });
    mkdirSync(cwd, { recursive: true });

    expect(resolveProjectDir({ PWD: pwd }, cwd)).toBe(pwd);
    expect(resolveProjectDir({}, cwd)).toBe(cwd);
  });
});
