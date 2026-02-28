import { Database } from "bun:sqlite";
export interface MemoryDbPaths {
    memoryDir: string;
    memoryDbPath: string;
}
export interface OpenMemoryDbOptions {
    projectDir?: string;
    readonly?: boolean;
}
export declare function getMemoryPaths(projectDir?: string): MemoryDbPaths;
export declare function openMemoryDb(options?: OpenMemoryDbOptions): Database;
//# sourceMappingURL=memory-db.d.ts.map