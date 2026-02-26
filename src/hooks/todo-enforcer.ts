/**
 * Todo Continuation Enforcer Hook
 *
 * Ensures agents complete all todos before finishing a session.
 * Checks on session idle and warns when todos are incomplete.
 */

export interface TodoItem {
  id: string;
  content: string;
  status: "todo" | "in-progress" | "completed";
}

export interface TodoCheckResult {
  complete: boolean;
  incomplete: TodoItem[];
  inProgress: TodoItem[];
}

const EMPTY_RESULT: TodoCheckResult = {
  complete: true,
  incomplete: [],
  inProgress: [],
};

function normalizeTodoItem(value: unknown): TodoItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const status = raw.status;
  if (status !== "todo" && status !== "in-progress" && status !== "in_progress" && status !== "completed") {
    return null;
  }

  return {
    id: typeof raw.id === "string" ? raw.id : "unknown",
    content: typeof raw.content === "string" ? raw.content : "(no content)",
    status: status === "in_progress" ? "in-progress" : status,
  };
}

function normalizeTodoResult(result: unknown): TodoCheckResult {
  if (!result || typeof result !== "object") {
    return EMPTY_RESULT;
  }

  const raw = result as Partial<TodoCheckResult>;
  const incomplete = Array.isArray(raw.incomplete)
    ? raw.incomplete.map(normalizeTodoItem).filter((item): item is TodoItem => !!item)
    : [];
  const inProgress = Array.isArray(raw.inProgress)
    ? raw.inProgress.map(normalizeTodoItem).filter((item): item is TodoItem => !!item)
    : [];

  return {
    complete: incomplete.length === 0 && inProgress.length === 0,
    incomplete,
    inProgress,
  };
}

export function checkTodoCompletion(todos: unknown): TodoCheckResult {
  if (!Array.isArray(todos)) {
    return EMPTY_RESULT;
  }

  const normalized = todos
    .map(normalizeTodoItem)
    .filter((item): item is TodoItem => !!item);
  const incomplete = normalized.filter((t) => t.status === "todo");
  const inProgress = normalized.filter((t) => t.status === "in-progress");

  return {
    complete: incomplete.length === 0 && inProgress.length === 0,
    incomplete,
    inProgress,
  };
}

export function formatIncompleteWarning(
  result: TodoCheckResult | unknown,
  sessionId?: string
): string {
  const safeResult = normalizeTodoResult(result);
  const lines: string[] = [];
  
  if (sessionId) {
    lines.push(`[CliKit] Incomplete todos in session ${sessionId}:`);
  } else {
    lines.push("[CliKit] Incomplete todos detected:");
  }

  if (safeResult.inProgress.length > 0) {
    lines.push("  In Progress:");
    safeResult.inProgress.forEach((t) => lines.push(`    - [${t.id}] ${t.content}`));
  }

  if (safeResult.incomplete.length > 0) {
    lines.push("  Not Started:");
    safeResult.incomplete.forEach((t) => lines.push(`    - [${t.id}] ${t.content}`));
  }

  lines.push("");
  lines.push("  Complete all todos before finishing.");

  return lines.join("\n");
}
