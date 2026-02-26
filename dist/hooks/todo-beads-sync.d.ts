export interface OpenCodeTodo {
    id: string;
    content: string;
    status: string;
    priority?: string;
}
export interface TodoBeadsSyncConfig {
    enabled?: boolean;
    close_missing?: boolean;
    log?: boolean;
}
export interface TodoBeadsSyncResult {
    synced: boolean;
    sessionID: string;
    totalTodos: number;
    created: number;
    updated: number;
    closed: number;
    skippedReason?: string;
}
export declare function syncTodosToBeads(projectDirectory: string, sessionID: string, todos: OpenCodeTodo[], config?: TodoBeadsSyncConfig): TodoBeadsSyncResult;
export declare function formatTodoBeadsSyncLog(result: TodoBeadsSyncResult): string;
//# sourceMappingURL=todo-beads-sync.d.ts.map