import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const SKILLS_DIR_CANDIDATES = [
  path.join(import.meta.dir, "../skill"),
  path.join(import.meta.dir, "../../skill"),
  path.join(import.meta.dir, "../../../skill"),
];

export function resolveSkillsDir(): string {
  for (const dir of SKILLS_DIR_CANDIDATES) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return SKILLS_DIR_CANDIDATES[0];
}

export interface SkillConfig {
  name: string;
  description: string;
  content: string;
  location: string;
  from?: string;
  model?: string;
  agent?: string;
  subtask?: boolean;
  "argument-hint"?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, unknown>;
  "allowed-tools"?: string[];
}

export function getBuiltinSkills(): Record<string, SkillConfig> {
  const skills: Record<string, SkillConfig> = {};
  const skillsDir = resolveSkillsDir();

  if (!fs.existsSync(skillsDir)) {
    console.warn("[CliKit] Skills directory not found:", skillsDir);
    return skills;
  }

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const dirent of skillDirs) {
    if (!dirent.isDirectory()) continue;

    const skillName = dirent.name;
    const skillPath = path.join(skillsDir, skillName);
    const skillMdPath = path.join(skillPath, "SKILL.md");

    if (!fs.existsSync(skillMdPath)) {
      console.warn(`[CliKit] Missing SKILL.md for skill: ${skillName}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(skillMdPath, "utf-8");
      const { data, content } = matter(fileContent);

      skills[skillName] = {
        name: data.name || skillName,
        description: data.description || "",
        content: content.trim(),
        location: skillPath,
      };
    } catch (err) {
      console.warn(`[CliKit] Failed to parse skill ${skillName}:`, err);
    }
  }

  return skills;
}

export function findSkill(skills: Record<string, SkillConfig>, query: string): SkillConfig | null {
  if (typeof query !== "string") {
    return null;
  }

  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) {
    return null;
  }

  // Exact match
  if (skills[lowerQuery]) {
    return skills[lowerQuery];
  }

  // Partial match on name
  for (const [name, skill] of Object.entries(skills)) {
    const skillName = (skill.name || "").toLowerCase();
    if (name.toLowerCase().includes(lowerQuery) || skillName.includes(lowerQuery)) {
      return skill;
    }
  }

  // Match in description (starts with "Use when")
  for (const skill of Object.values(skills)) {
    const description = (skill.description || "").toLowerCase();
    if (description.includes(lowerQuery)) {
      return skill;
    }
  }

  return null;
}
