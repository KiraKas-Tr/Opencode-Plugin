/**
 * Git Guard Hook
 *
 * Blocks dangerous git commands: force push, hard reset, rm -rf.
 * Runs on tool.execute.before for bash tool.
 */
export interface GitGuardResult {
    blocked: boolean;
    command: string;
    reason?: string;
}
export declare function checkDangerousCommand(command: unknown, allowForceWithLease?: boolean): GitGuardResult;
export declare function formatBlockedWarning(result: GitGuardResult): string;
//# sourceMappingURL=git-guard.d.ts.map