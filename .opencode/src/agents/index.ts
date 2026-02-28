import type { AgentConfig } from "../types";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const AGENTS_DIR = path.join(import.meta.dir, "../src/agents");

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

  if (!fs.existsSync(AGENTS_DIR)) {
    return agents;
  }

  const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const agentName = path.basename(file, ".md");
    const agentPath = path.join(AGENTS_DIR, file);
    const agent = parseAgentMarkdown(agentPath);

    if (agent) {
      agents[agentName] = agent;
    }
  }

  return agents;
}

export function getBuiltinAgents(): Record<string, AgentConfig> {
  return loadAgents();
}
