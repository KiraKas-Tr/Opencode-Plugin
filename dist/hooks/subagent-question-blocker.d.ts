/**
 * Subagent Question Blocker Hook
 *
 * Prevents subagents from asking questions back to the user.
 * Subagents should execute their task autonomously without clarification.
 * Runs on tool.execute.before for Task tool.
 */
export declare function containsQuestion(text: unknown): boolean;
export declare function isSubagentTool(toolName: unknown): boolean;
export declare function formatBlockerWarning(): string;
//# sourceMappingURL=subagent-question-blocker.d.ts.map