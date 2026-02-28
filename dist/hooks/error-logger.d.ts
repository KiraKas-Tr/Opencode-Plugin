/**
 * Hook Error Logger
 *
 * Centralized error logging helper for hook execution paths.
 * Logs structured context to make runtime hook failures easier to debug.
 */
export declare function isBlockedToolExecutionError(error: unknown): boolean;
export declare function formatHookErrorLog(hookName: string, error: unknown, context?: Record<string, unknown>): string;
export declare function logHookError(hookName: string, error: unknown, context?: Record<string, unknown>): void;
//# sourceMappingURL=error-logger.d.ts.map