/**
 * TypeCheck Gate Hook
 *
 * Runs TypeScript type checking after .ts/.tsx file edits.
 * Reports type errors inline so agents can fix them immediately.
 * Runs on tool.execute.after for edit/write tools.
 */
export interface TypeCheckConfig {
    enabled?: boolean;
    tsconfig?: string;
    log?: boolean;
    block_on_error?: boolean;
}
export interface TypeDiagnostic {
    file: string;
    line: number;
    column: number;
    code: string;
    message: string;
}
export interface TypeCheckResult {
    clean: boolean;
    errors: TypeDiagnostic[];
    checkedFile: string;
}
export declare function isTypeScriptFile(filePath: unknown): boolean;
export declare function findTsConfig(projectDir: unknown, override?: string): string | undefined;
export declare function hasTscInstalled(projectDir: unknown): boolean;
export declare function runTypeCheck(filePath: unknown, projectDir: unknown, config?: TypeCheckConfig): TypeCheckResult;
export declare function formatTypeCheckWarning(result: TypeCheckResult | unknown): string;
//# sourceMappingURL=typecheck-gate.d.ts.map