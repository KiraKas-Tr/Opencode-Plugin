import type { CommandConfig } from "../types";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const COMMANDS_DIR = path.join(import.meta.dir, "../../command");

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

  if (!fs.existsSync(COMMANDS_DIR)) {
    return commands;
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const commandName = path.basename(file, ".md");
    const commandPath = path.join(COMMANDS_DIR, file);
    const command = parseCommandMarkdown(commandPath);

    if (command) {
      commands[commandName] = command;
    }
  }

  return commands;
}

export function getBuiltinCommands(): Record<string, CommandConfig> {
  return loadCommands();
}
