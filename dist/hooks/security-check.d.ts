/**
 * Security Check Hook
 *
 * Scans for secrets, credentials, and sensitive data before git commits.
 * Runs on tool.execute.before for bash tool (git commit).
 */
export interface SecurityFinding {
    type: string;
    file?: string;
    line?: number;
    snippet?: string;
}
export interface SecurityCheckResult {
    safe: boolean;
    findings: SecurityFinding[];
}
export declare function scanContentForSecrets(content: string, filename?: string): SecurityCheckResult;
export declare function isSensitiveFile(filepath: string): boolean;
export declare function formatSecurityWarning(result: SecurityCheckResult | unknown): string;
//# sourceMappingURL=security-check.d.ts.map