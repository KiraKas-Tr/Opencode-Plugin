import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { filterSkills, loadCliKitConfig, type CliKitConfig } from "./config";
import type { SkillConfig } from "./skills";

function baseSkills(): Record<string, SkillConfig> {
  return {
    alpha: {
      name: "alpha",
      description: "Alpha skill",
      content: "alpha content",
      location: "/tmp/alpha",
    },
    beta: {
      name: "beta",
      description: "Beta skill",
      content: "beta content",
      location: "/tmp/beta",
    },
  };
}

describe("filterSkills", () => {
  it("supports object override fields including template and metadata", () => {
    const config: CliKitConfig = {
      skills: {
        alpha: {
          description: "Overridden description",
          template: "overridden content",
          from: "./custom/alpha.md",
          model: "openai/gpt-4o",
          agent: "build",
          subtask: true,
          "argument-hint": "task-id",
          license: "MIT",
          compatibility: "opencode>=1",
          metadata: { owner: "team-a" },
          "allowed-tools": ["Read", "Grep"],
        },
      },
    };

    const filtered = filterSkills(baseSkills(), config);
    const alpha = filtered.alpha;

    expect(alpha).toBeDefined();
    expect(alpha.description).toBe("Overridden description");
    expect(alpha.content).toBe("overridden content");
    expect(alpha.from).toBe("./custom/alpha.md");
    expect(alpha.model).toBe("openai/gpt-4o");
    expect(alpha.agent).toBe("build");
    expect(alpha.subtask).toBe(true);
    expect(alpha["argument-hint"]).toBe("task-id");
    expect(alpha.license).toBe("MIT");
    expect(alpha.compatibility).toBe("opencode>=1");
    expect(alpha.metadata).toEqual({ owner: "team-a" });
    expect(alpha["allowed-tools"]).toEqual(["Read", "Grep"]);
  });

  it("disables skill when override sets disable=true", () => {
    const config: CliKitConfig = {
      skills: {
        beta: {
          disable: true,
        },
      },
    };

    const filtered = filterSkills(baseSkills(), config);
    expect(filtered.beta).toBeUndefined();
    expect(filtered.alpha).toBeDefined();
  });

  it("merges disabled_skills and skills.disable instead of replacing", () => {
    const config: CliKitConfig = {
      disabled_skills: ["alpha"],
      skills: {
        disable: ["beta"],
      },
    };

    const filtered = filterSkills(baseSkills(), config);
    expect(filtered.alpha).toBeUndefined();
    expect(filtered.beta).toBeUndefined();
  });
});

describe("loadCliKitConfig", () => {
  it("loads project config from project root when present", () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "clikit-project-"));
    const globalConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), "clikit-global-"));
    const prevConfigDir = process.env.OPENCODE_CONFIG_DIR;

    try {
      process.env.OPENCODE_CONFIG_DIR = globalConfigDir;
      fs.writeFileSync(
        path.join(projectDir, "clikit.config.json"),
        JSON.stringify({ disabled_agents: ["review"] }),
        "utf-8"
      );

      const config = loadCliKitConfig(projectDir);
      expect(config.disabled_agents).toEqual(["review"]);
    } finally {
      if (prevConfigDir === undefined) {
        delete process.env.OPENCODE_CONFIG_DIR;
      } else {
        process.env.OPENCODE_CONFIG_DIR = prevConfigDir;
      }
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(globalConfigDir, { recursive: true, force: true });
    }
  });
});
