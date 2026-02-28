/**
 * Environment Context Hook
 *
 * Injects project structure, git branch, build system, and runtime
 * environment details into session prompts. Provides agents with
 * awareness of the development environment.
 * Runs on session.created event.
 */
export interface EnvContextConfig {
    enabled?: boolean;
    include_git?: boolean;
    include_package?: boolean;
    include_structure?: boolean;
    max_depth?: number;
}
export interface EnvInfo {
    platform: string;
    nodeVersion: string;
    cwd: string;
    git?: GitInfo;
    package?: PackageInfo;
    structure?: string[];
}
export interface GitInfo {
    branch: string;
    hasChanges: boolean;
    remoteUrl?: string;
    lastCommit?: string;
}
export interface PackageInfo {
    name?: string;
    version?: string;
    packageManager?: string;
    scripts?: string[];
    framework?: string;
}
export declare function getGitInfo(cwd: string): GitInfo | undefined;
export declare function getPackageInfo(cwd: string): PackageInfo | undefined;
export declare function getTopLevelStructure(cwd: string, maxDepth?: number): string[];
export declare function collectEnvInfo(cwd: unknown, config?: EnvContextConfig): EnvInfo;
export declare function buildEnvBlock(info: EnvInfo): string;
export declare function formatEnvSummary(info: EnvInfo): string;
//# sourceMappingURL=env-context.d.ts.map