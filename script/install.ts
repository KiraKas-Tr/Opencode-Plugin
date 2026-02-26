#!/usr/bin/env bun
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const PLUGIN_NAME = "clikit-plugin";

function getUserConfigDir(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  }
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
}

async function install() {
  const pluginDir = path.join(getUserConfigDir(), "opencode", "plugin");
  const targetPath = path.join(pluginDir, `${PLUGIN_NAME}.js`);

  // Ensure plugin directory exists
  fs.mkdirSync(pluginDir, { recursive: true });

  // Build the plugin first
  console.log("Building plugin...");
  const proc = Bun.spawn(["bun", "run", "build"], {
    cwd: path.join(__dirname, ".."),
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;

  if (proc.exitCode !== 0) {
    console.error("Build failed!");
    process.exit(1);
  }

  // Copy dist/index.js to plugin directory
  const distPath = path.join(__dirname, "..", "dist", "index.js");
  
  if (!fs.existsSync(distPath)) {
    console.error("Build output not found at:", distPath);
    process.exit(1);
  }

  fs.copyFileSync(distPath, targetPath);
  console.log(`✅ Plugin installed to: ${targetPath}`);
  
  // Also copy agents and command directories
  const srcAgentDir = path.join(__dirname, "..", "src", "agents");
  const srcCommandDir = path.join(__dirname, "..", "command");
  const srcMemoryDir = path.join(__dirname, "..", "memory");
  
  const destAgentDir = path.join(getUserConfigDir(), "opencode", "agents");
  const destCommandDir = path.join(getUserConfigDir(), "opencode", "command");
  
  // Symlink or copy agents
  if (fs.existsSync(srcAgentDir)) {
    fs.mkdirSync(destAgentDir, { recursive: true });
    for (const file of fs.readdirSync(srcAgentDir)) {
      const src = path.join(srcAgentDir, file);
      const dest = path.join(destAgentDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`  Copied agent: ${file}`);
      }
    }
  }

  // Symlink or copy commands
  if (fs.existsSync(srcCommandDir)) {
    fs.mkdirSync(destCommandDir, { recursive: true });
    for (const file of fs.readdirSync(srcCommandDir)) {
      const src = path.join(srcCommandDir, file);
      const dest = path.join(destCommandDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`  Copied command: ${file}`);
      }
    }
  }

  console.log("\n✅ Installation complete!");
  console.log("Restart OpenCode to use the plugin.");
}

install().catch(console.error);
