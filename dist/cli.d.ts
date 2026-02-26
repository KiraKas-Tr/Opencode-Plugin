#!/usr/bin/env bun
interface ScaffoldStats {
    copied: number;
    skipped: number;
    missingSources: string[];
}
export declare function resolveProjectDir(env?: NodeJS.ProcessEnv, cwd?: string): string;
export declare function upsertPluginEntry(existingPlugins: string[], pluginEntry: string): string[];
export declare function scaffoldProjectOpencode(projectDir: string, packageRoot?: string): ScaffoldStats;
export {};
//# sourceMappingURL=cli.d.ts.map