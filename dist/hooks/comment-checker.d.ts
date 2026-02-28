/**
 * Comment Checker Hook
 *
 * Detects excessive AI-generated comments in code output.
 * AI code should be indistinguishable from human-written code.
 * Runs on tool.execute.after for edit/write tools.
 */
export interface CommentCheckResult {
    excessive: boolean;
    count: number;
    totalLines: number;
    ratio: number;
}
export declare function checkCommentDensity(content: unknown, threshold?: number): CommentCheckResult;
export declare function hasExcessiveAIComments(content: unknown): boolean;
export declare function formatCommentWarning(result: CommentCheckResult): string;
//# sourceMappingURL=comment-checker.d.ts.map