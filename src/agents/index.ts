import type { AgentConfig } from "../types";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const AGENTS_DIR_CANDIDATES = [
  import.meta.dir,
  path.join(import.meta.dir, "../../src/agents"),
];

function resolveAgentsDir(): string {
  for (const dir of AGENTS_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return AGENTS_DIR_CANDIDATES[0];
}

function parseAgentMarkdown(filePath: string): AgentConfig | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);

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
    console.error(`Failed to parse agent file: ${filePath}`, error);
    return null;
  }
}

export function loadAgents(): Record<string, AgentConfig> {
  const agents: Record<string, AgentConfig> = {};
  const agentsDir = resolveAgentsDir();

  if (!fs.existsSync(agentsDir)) {
    return agents;
  }

  const files = fs.readdirSync(agentsDir)
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
  const files = fs.readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md") && f !== "AGENTS.md")
    .sort();

  const parts = files.map((file) => {
    const fullPath = path.join(agentsDir, file);
    const stat = fs.statSync(fullPath);
    return `${file}:${stat.mtimeMs}`;
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
