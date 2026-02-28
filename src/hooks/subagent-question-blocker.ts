/**
 * Subagent Question Blocker Hook
 *
 * Prevents subagents from asking questions back to the user.
 * Subagents should execute their task autonomously without clarification.
 * Runs on tool.execute.before for Task tool.
 */

const QUESTION_INDICATORS = [
  "shall i",
  "should i",
  "would you like",
  "do you want",
  "could you clarify",
  "can you confirm",
  "what do you prefer",
  "which approach",
  "before i proceed",
  "please let me know",
  "i need more information",
  "could you provide",
];

export function containsQuestion(text: unknown): boolean {
  if (typeof text !== "string" || !text) {
    return false;
  }
  const lower = text.toLowerCase();
  return QUESTION_INDICATORS.some((indicator) => lower.includes(indicator));
}

export function isSubagentTool(toolName: unknown): boolean {
  return typeof toolName === "string" && (toolName === "task" || toolName === "Task");
}

export function formatBlockerWarning(): string {
  return `[CliKit:subagent-blocker] Subagent attempted to ask clarifying questions. Subagents should execute autonomously.`;
}
