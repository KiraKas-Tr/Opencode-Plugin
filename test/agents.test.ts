import { describe, expect, it } from "bun:test";
import { getBuiltinAgents } from "../src/agents/index";
import type { AgentConfig } from "../src/types";

describe("builtin agent permission semantics", () => {
  it("loads plan with edit permission and write capability", () => {
    const agents = getBuiltinAgents();
    const plan = agents.plan as AgentConfig | undefined;

    expect(plan).toBeDefined();
    expect(plan?.tools?.write).toBe(true);
    expect(plan?.tools?.edit).toBe(true);
    expect(plan?.permission?.edit).toBe("allow");
    expect("write" in (plan?.permission ?? {})).toBe(false);
    expect(plan?.prompt).toContain("write planning artifacts");
  });

  it("keeps review as the contrasting capability-vs-permission example", () => {
    const agents = getBuiltinAgents();
    const review = agents.review as AgentConfig | undefined;

    expect(review).toBeDefined();
    expect(review?.tools?.write).toBe(true);
    expect(review?.permission?.edit).toBe("deny");
  });
});
