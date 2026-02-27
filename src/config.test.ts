import { describe, expect, it } from "bun:test";
import { filterSkills, type CliKitConfig } from "./config";
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
});
