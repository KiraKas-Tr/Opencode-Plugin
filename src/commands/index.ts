import type { CommandConfig } from "../types";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const COMMANDS_DIR_CANDIDATES = [
  path.join(import.meta.dir, "../command"),
  path.join(import.meta.dir, "../../command"),
  path.join(import.meta.dir, "../../../command"),
];

function resolveCommandsDir(): string {
  for (const dir of COMMANDS_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return COMMANDS_DIR_CANDIDATES[0];
}

function parseCommandMarkdown(filePath: string): CommandConfig | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);

    const config: CommandConfig = {
      description: frontmatter.description || "",
      template: body.trim(),
    };

    if (frontmatter.agent) {
      config.agent = frontmatter.agent;
    }
    if (frontmatter.subtask !== undefined) {
      config.subtask = frontmatter.subtask;
    }
    if (frontmatter.model) {
      config.model = frontmatter.model;
    }

    return config;
  } catch (error) {
    console.error(`Failed to parse command file: ${filePath}`, error);
    return null;
  }
}

export function loadCommands(): Record<string, CommandConfig> {
  const commands: Record<string, CommandConfig> = {};
  const commandsDir = resolveCommandsDir();

  if (!fs.existsSync(commandsDir)) {
    return commands;
  }

  const files = fs.readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  for (const file of files) {
    const commandName = path.basename(file, ".md");
    const commandPath = path.join(commandsDir, file);
    const command = parseCommandMarkdown(commandPath);

    if (command) {
      commands[commandName] = command;
    }
  }

  return commands;
}

let _cachedCommands: Record<string, CommandConfig> | null = null;
let _cachedCommandsFingerprint = "";

function getCommandsFingerprint(commandsDir: string): string {
  const files = fs.readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parts = files.map((file) => {
    const fullPath = path.join(commandsDir, file);
    const stat = fs.statSync(fullPath);
    return `${file}:${stat.mtimeMs}`;
  });

  return parts.join("|");
}

export function getBuiltinCommands(): Record<string, CommandConfig> {
  try {
    const commandsDir = resolveCommandsDir();
    const fingerprint = getCommandsFingerprint(commandsDir);
    if (_cachedCommands && _cachedCommandsFingerprint === fingerprint) return _cachedCommands;
    _cachedCommands = loadCommands();
    _cachedCommandsFingerprint = fingerprint;
    return _cachedCommands;
  } catch {
    return _cachedCommands ?? loadCommands();
  }
}
