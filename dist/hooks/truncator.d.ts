/**
 * Truncator Hook
 *
 * Dynamic output truncation when tool output is too large.
 * Prevents context window overflow by intelligently trimming
 * large outputs while preserving key information.
 * Runs on tool.execute.after for bash/read tools.
 */
export interface TruncatorConfig {
    enabled?: boolean;
    max_output_chars?: number;
    max_output_lines?: number;
    preserve_head_lines?: number;
    preserve_tail_lines?: number;
    log?: boolean;
}
export interface TruncateResult {
    truncated: boolean;
    originalLength: number;
    truncatedLength: number;
    originalLines: number;
    truncatedLines: number;
    content: string;
}
export declare function shouldTruncate(content: string, config?: TruncatorConfig): boolean;
export declare function truncateOutput(content: string, config?: TruncatorConfig): TruncateResult;
export declare function formatTruncationLog(result: TruncateResult): string;
//# sourceMappingURL=truncator.d.ts.map