import type { AgentConfig } from "../types";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { bufferInitError } from "../hooks/error-logger";

const AGENTS_DIR_CANDIDATES = [
  // Dev: running from src/agents
  import.meta.dir,
  // Packaged plugin: running from dist/, agents live in src/agents/
  path.join(import.meta.dir, "../src/agents"),
  // Additional fallbacks for non-standard layouts
  path.join(import.meta.dir, "../../src/agents"),
  path.join(import.meta.dir, "../agents"),
];

function resolveAgentsDir(): string {
  for (const dir of AGENTS_DIR_CANDIDATES) {
    if (!fs.existsSync(dir)) continue;
    try {
      const hasAgentFiles = fs.readdirSync(dir).some((f) => f.endsWith(".md") && f !== "AGENTS.md");
      if (hasAgentFiles) return dir;
    } catch {
      // Ignore unreadable candidate and continue.
    }
  }
  for (const dir of AGENTS_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return AGENTS_DIR_CANDIDATES[0];
}

const VALID_MODES = new Set(["subagent", "primary", "all"]);

function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  filePath: string,
): string[] {
  const warnings: string[] = [];
  const name = path.basename(filePath, ".md");

  if (!frontmatter.description) {
    warnings.push(`[${name}] Missing 'description' — agent will have empty description`);
  }

  if (!frontmatter.model) {
    warnings.push(`[${name}] Missing 'model' — will use default model`);
  }

  if (frontmatter.mode && !VALID_MODES.has(frontmatter.mode as string)) {
    warnings.push(`[${name}] Invalid mode '${frontmatter.mode}' — must be subagent|primary|all`);
  }

  if (frontmatter.tools && typeof frontmatter.tools !== "object") {
    warnings.push(`[${name}] 'tools' must be an object`);
  }

  if (frontmatter.temperature !== undefined) {
    const temp = frontmatter.temperature as number;
    if (typeof temp !== "number" || temp < 0 || temp > 2) {
      warnings.push(`[${name}] 'temperature' must be a number between 0 and 2`);
    }
  }

  return warnings;
}

function parseAgentMarkdown(filePath: string): AgentConfig | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);

    // Validate frontmatter and log warnings
    const warnings = validateFrontmatter(frontmatter, filePath);
    for (const warning of warnings) {
      bufferInitError("agents", "warn", warning, { file: filePath });
    }

    const config: AgentConfig = {
      description: frontmatter.description || "",
      mode: frontmatter.mode || "subagent",
      model: frontmatter.model,
      temperature: frontmatter.temperature,
      top_p: frontmatter.top_p,
      tools: frontmatter.tools,
      permission: frontmatter.permission,
      color: frontmatter.color,
      maxSteps: frontmatter.maxSteps,
      prompt: body.trim(),
    };

    if (frontmatter.thinking) {
      config.thinking = frontmatter.thinking;
    }
    if (frontmatter.maxTokens) {
      config.maxTokens = frontmatter.maxTokens;
    }

    return config;
  } catch (error) {
    bufferInitError("agents", "error", `Failed to parse agent file: ${filePath}`, {
      file: filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function loadAgents(): Record<string, AgentConfig> {
  const agents: Record<string, AgentConfig> = {};
  const agentsDir = resolveAgentsDir();

  if (!fs.existsSync(agentsDir)) {
    return agents;
  }

  const files = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md") && f !== "AGENTS.md")
    .sort();

  for (const file of files) {
    const agentName = path.basename(file, ".md");
    const agentPath = path.join(agentsDir, file);
    const agent = parseAgentMarkdown(agentPath);

    if (agent) {
      agents[agentName] = agent;
    }
  }

  return agents;
}

let _cachedAgents: Record<string, AgentConfig> | null = null;
let _cachedAgentsFingerprint = "";

function getAgentsFingerprint(agentsDir: string): string {
  const files = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md") && f !== "AGENTS.md")
    .sort();

  const parts = files.map((file) => {
    const fullPath = path.join(agentsDir, file);
    const stat = fs.statSync(fullPath);
    const size = stat.size;
    return `${file}:${stat.mtimeMs}:${size}`;
  });

  return parts.join("|");
}

export function getBuiltinAgents(): Record<string, AgentConfig> {
  try {
    const agentsDir = resolveAgentsDir();
    const fingerprint = getAgentsFingerprint(agentsDir);
    if (_cachedAgents && _cachedAgentsFingerprint === fingerprint) return _cachedAgents;
    _cachedAgents = loadAgents();
    _cachedAgentsFingerprint = fingerprint;
    return _cachedAgents;
  } catch {
    return _cachedAgents ?? loadAgents();
  }
}
