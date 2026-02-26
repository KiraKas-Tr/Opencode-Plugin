/**
 * Auto-Format Hook
 *
 * Runs the project's formatter after file edits.
 * Detects prettier, biome, dprint, or other formatters from project config.
 * Runs on tool.execute.after for edit/write tools.
 */
export interface AutoFormatConfig {
    enabled?: boolean;
    formatter?: string;
    extensions?: string[];
    log?: boolean;
}
export interface FormatResult {
    formatted: boolean;
    file: string;
    formatter: string;
    error?: string;
}
type FormatterEntry = {
    name: string;
    configFiles: string[];
    command: (file: string) => string;
};
export declare function detectFormatter(projectDir: string): FormatterEntry | undefined;
export declare function shouldFormat(filePath: unknown, extensions?: string[]): boolean;
export declare function runFormatter(filePath: unknown, projectDir: unknown, formatterOverride?: string): FormatResult;
export declare function formatAutoFormatLog(result: FormatResult): string;
export {};
//# sourceMappingURL=auto-format.d.ts.map