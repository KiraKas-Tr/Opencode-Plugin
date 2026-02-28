/**
 * Hook Error Logger
 *
 * Centralized error logging helper for hook execution paths.
 * Logs structured context to make runtime hook failures easier to debug.
 */

const BLOCKED_TOOL_ERROR_PREFIX = "[CliKit] Blocked tool execution:";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && typeof error.stack === "string") {
    return error.stack;
  }
  return undefined;
}

export function isBlockedToolExecutionError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(BLOCKED_TOOL_ERROR_PREFIX);
}

export function formatHookErrorLog(
  hookName: string,
  error: unknown,
  context?: Record<string, unknown>
): string {
  const message = getErrorMessage(error);
  const contextPart = context && Object.keys(context).length > 0
    ? ` context=${JSON.stringify(context)}`
    : "";
  const stack = getErrorStack(error);

  return [
    `[CliKit:${hookName}] Hook error: ${message}${contextPart}`,
    ...(stack ? [stack] : []),
  ].join("\n");
}

export function logHookError(
  hookName: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error(formatHookErrorLog(hookName, error, context));
}
