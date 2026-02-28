#!/usr/bin/env bun
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const PLUGIN_NAME = "clikit-plugin";
const VERSION = "0.0.0";

interface ScaffoldStats {
  copied: number;
  skipped: number;
  missingSources: string[];
}


function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);

  if (path.basename(currentDir) === "dist") {
    return path.dirname(currentDir);
  }

  return path.dirname(currentDir);
}

function getPackageVersion(): string {
  const packageJsonPath = path.join(getPackageRoot(), "package.json");
  try {
    const raw = fs.readFileSync(packageJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || VERSION;
  } catch {
    return VERSION;
  }
}

function getPluginEntry(): string {
  return `${PLUGIN_NAME}@latest`;
}


export function resolveProjectDir(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): string {
  const candidates = [env.INIT_CWD, env.PWD, cwd].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    try {
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        return resolved;
      }
    } catch {
      // Skip invalid candidate and continue fallback chain.
    }
  }

  return cwd;
}

export function upsertPluginEntry(existingPlugins: string[], pluginEntry: string): string[] {
  const pluginName = pluginEntry.split("@")[0] || pluginEntry;
  const filteredPlugins = existingPlugins.filter(
    (p) => p !== pluginName && !p.startsWith(`${pluginName}@`)
  );
  filteredPlugins.push(pluginEntry);
  return filteredPlugins;
}

function copyFileIfMissing(sourcePath: string, targetPath: string, stats: ScaffoldStats): void {
  if (!fs.existsSync(sourcePath)) {
    stats.missingSources.push(sourcePath);
    return;
  }

  if (fs.existsSync(targetPath)) {
    stats.skipped += 1;
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  stats.copied += 1;
}

function copyDirectoryFilesIfMissing(sourceDir: string, targetDir: string, stats: ScaffoldStats): void {
  if (!fs.existsSync(sourceDir)) {
    stats.missingSources.push(sourceDir);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryFilesIfMissing(sourcePath, targetPath, stats);
      continue;
    }

    if (entry.isFile()) {
      copyFileIfMissing(sourcePath, targetPath, stats);
    }
  }
}

export function scaffoldProjectOpencode(projectDir: string, packageRoot = getPackageRoot()): ScaffoldStats {
  const projectOpencodeDir = path.join(projectDir, ".opencode");
  const stats: ScaffoldStats = {
    copied: 0,
    skipped: 0,
    missingSources: [],
  };

  fs.mkdirSync(projectOpencodeDir, { recursive: true });

  copyFileIfMissing(
    path.join(packageRoot, "AGENTS.md"),
    path.join(projectOpencodeDir, "AGENTS.md"),
    stats
  );

  copyDirectoryFilesIfMissing(
    path.join(packageRoot, "command"),
    path.join(projectOpencodeDir, "command"),
    stats
  );

  copyDirectoryFilesIfMissing(
    path.join(packageRoot, "skill"),
    path.join(projectOpencodeDir, "skill"),
    stats
  );

  copyDirectoryFilesIfMissing(
    path.join(packageRoot, "memory", "_templates"),
    path.join(projectOpencodeDir, "memory", "_templates"),
    stats
  );

  copyDirectoryFilesIfMissing(
    path.join(packageRoot, "src", "agents"),
    path.join(projectOpencodeDir, "src", "agents"),
    stats
  );

  copyFileIfMissing(
    path.join(packageRoot, "README.md"),
    path.join(projectOpencodeDir, "README-clikit.md"),
    stats
  );

  const indexPath = path.join(projectOpencodeDir, "index.ts");
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      `import CliKitPlugin from "${PLUGIN_NAME}";\n\nexport default CliKitPlugin;\n`
    );
    stats.copied += 1;
  } else {
    stats.skipped += 1;
  }

  return stats;
}

function removeLegacyGlobalPluginAssets(configDir: string): void {
  const legacyPluginPath = path.join(configDir, "plugins", "clikit.js");
  const legacyAgentsDir = path.join(configDir, "plugins", "agents");
  const legacyCommandDir = path.join(configDir, "command");
  const legacyStatusPath = path.join(legacyCommandDir, "status.md");

  if (fs.existsSync(legacyPluginPath)) {
    fs.rmSync(legacyPluginPath, { force: true });
    console.log(`✓ Removed legacy local plugin file: ${legacyPluginPath}`);
  }

  if (fs.existsSync(legacyAgentsDir)) {
    fs.rmSync(legacyAgentsDir, { recursive: true, force: true });
    console.log(`✓ Removed legacy local agents directory: ${legacyAgentsDir}`);
  }

  if (fs.existsSync(legacyStatusPath)) {
    fs.rmSync(legacyStatusPath, { force: true });
    console.log(`✓ Removed legacy command file: ${legacyStatusPath}`);
  }
}

function getRealHome(): string {
  // Priority 1: SNAP_REAL_HOME is set by snap to the actual home
  if (process.env.SNAP_REAL_HOME) {
    return process.env.SNAP_REAL_HOME;
  }
  
  const home = os.homedir();
  
  // Priority 2: Detect snap home pattern and extract real home
  // Snap paths look like: /home/username/snap/appname/revision/
  const snapMatch = home.match(/^(\/home\/[^/]+)\/snap\//);
  if (snapMatch) {
    return snapMatch[1];
  }
  
  // Priority 3: Fall back to os.homedir()
  return home;
}

function getConfigDir(): string {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return process.env.OPENCODE_CONFIG_DIR;
  }

  const home = getRealHome();
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "opencode");
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "opencode");
}

function getConfigPath(): string {
  const configDir = getConfigDir();
  const jsonPath = path.join(configDir, "opencode.json");
  const jsoncPath = path.join(configDir, "opencode.jsonc");

  if (fs.existsSync(jsoncPath)) return jsoncPath;
  if (fs.existsSync(jsonPath)) return jsonPath;
  return jsonPath;
}

function getCliKitConfigPath(configDir = getConfigDir()): string {
  const candidates = ["clikit.jsonc", "clikit.json", "clikit.config.json"];

  for (const name of candidates) {
    const fullPath = path.join(configDir, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return path.join(configDir, "clikit.json");
}

function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function parseConfig(configPath: string): { config: Record<string, unknown>; raw: string; parseError: string | null } {
  try {
    if (!fs.existsSync(configPath)) {
      return { config: {}, raw: "", parseError: null };
    }
    const content = fs.readFileSync(configPath, "utf-8");
    
    // Try parsing as-is first (standard JSON)
    try {
      const parsed = JSON.parse(content);
      return { config: parsed, raw: content, parseError: null };
    } catch {
      // Try JSONC: remove block comments and trailing commas
      // Note: We don't strip // comments because they appear in URLs
      const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, "");
      const cleanedTrailing = cleaned.replace(/,\s*([}\]])/g, "$1");
      const parsed = JSON.parse(cleanedTrailing);
      return { config: parsed, raw: content, parseError: null };
    }
  } catch (err) {
    const raw = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf-8") : "";
    return { config: {}, raw, parseError: String(err) };
  }
}

function writeConfig(configPath: string, config: Record<string, unknown>): void {
  ensureConfigDir();
  const tmpPath = `${configPath}.tmp`;
  const content = JSON.stringify(config, null, 2) + "\n";
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, configPath);
}

interface InstallOptions {
  includeProjectScaffold: boolean;
}

async function install(options: InstallOptions): Promise<number> {
  const pluginEntry = getPluginEntry();

  try {
    ensureConfigDir();

    const configPath = getConfigPath();
    const result = parseConfig(configPath);
    if (result.parseError && result.raw.trim()) {
      console.error(`✗ Config file has syntax errors and cannot be safely modified.`);
      console.error(`  Error: ${result.parseError}`);
      console.error(`  Please fix the config file manually.`);
      return 1;
    }

    const config = result.config;
    const existingPlugins = Array.isArray(config.plugin)
      ? config.plugin.filter((p): p is string => typeof p === "string")
      : [];
    const filteredPlugins = upsertPluginEntry(existingPlugins, pluginEntry);
    const pluginMergedConfig = { ...config, plugin: filteredPlugins };
    writeConfig(configPath, pluginMergedConfig);

    if (options.includeProjectScaffold) {
      const projectDir = resolveProjectDir();
      scaffoldProjectOpencode(projectDir);
    }

    removeLegacyGlobalPluginAssets(getConfigDir());

    const memoryDir = path.join(getConfigDir(), "memory");
    const memorySubdirs = ["specs", "plans", "research", "reviews", "handoffs", "beads", "prds"];
    for (const subdir of memorySubdirs) {
      const dir = path.join(memoryDir, subdir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const clikitConfigPath = getCliKitConfigPath();
    if (!fs.existsSync(clikitConfigPath)) {
      const defaultConfig = {
        "$schema": `https://unpkg.com/${PLUGIN_NAME}@latest/schema.json`,
        "disabled_agents": [],
        "disabled_commands": [],
        "disabled_skills": [],
        "agents": {},
        "commands": {},
        "skills": {
          "enable": [],
          "disable": []
        },
        "hooks": {}
      };
      writeConfig(clikitConfigPath, defaultConfig);
    }

    console.log(`✓ CliKit installed (${pluginEntry})`);
    console.log(`✓ Config: ${configPath}`);
    console.log("✓ Restart OpenCode");
    return 0;
  } catch (err) {
    console.error(`✗ Install failed: ${err}`);
    return 1;
  }
}

function help(): void {
  console.log(`
CliKit - OpenCode Plugin

Usage:
  bun x clikit-plugin <command>

Commands:
  install     Install CliKit globally for OpenCode
  help        Show this help message
  version     Show version

Install options:
  --project   Also scaffold project .opencode files (default: disabled)

Examples:
  bun x clikit-plugin install
  bun x clikit-plugin install --project
`);
}

function version(): void {
  console.log(`clikit-plugin v${getPackageVersion()}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const flags = args.slice(1);

  let exitCode = 0;

  switch (command) {
    case "install":
    case "i":
      exitCode = await install({
        includeProjectScaffold: flags.includes("--project"),
      });
      break;
    case "help":
    case "-h":
    case "--help":
      help();
      break;
    case "version":
    case "-v":
    case "--version":
      version();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      help();
      exitCode = 1;
  }

  process.exit(exitCode);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
