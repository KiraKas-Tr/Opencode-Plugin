/**
 * Empty Message Sanitizer Hook
 *
 * Prevents API errors caused by empty tool outputs.
 * Detects and replaces empty content with a placeholder.
 */
export declare function isEmptyContent(content: unknown): boolean;
export declare function sanitizeContent(content: unknown, placeholder?: string): unknown;
//# sourceMappingURL=empty-message-sanitizer.d.ts.map