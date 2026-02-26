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
export declare function checkTodoCompletion(todos: unknown): TodoCheckResult;
export declare function formatIncompleteWarning(result: TodoCheckResult | unknown, sessionId?: string): string;
//# sourceMappingURL=todo-enforcer.d.ts.map