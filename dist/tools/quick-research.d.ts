import { type MemorySearchResult } from "./memory";
export interface QuickResearchParams {
    query: string;
    sources?: ("memory" | "context7" | "github")[];
    language?: string;
    limit?: number;
}
export interface QuickResearchResult {
    query: string;
    memory?: MemorySearchResult[];
    context7Hint?: string;
    githubHint?: string;
    suggestion: string;
}
export declare function quickResearch(params: unknown): QuickResearchResult;
//# sourceMappingURL=quick-research.d.ts.map