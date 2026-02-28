export declare function resolveSkillsDir(): string;
export interface SkillConfig {
    name: string;
    description: string;
    content: string;
    location: string;
    from?: string;
    model?: string;
    agent?: string;
    subtask?: boolean;
    "argument-hint"?: string;
    license?: string;
    compatibility?: string;
    metadata?: Record<string, unknown>;
    "allowed-tools"?: string[];
}
export declare function getBuiltinSkills(): Record<string, SkillConfig>;
export declare function findSkill(skills: Record<string, SkillConfig>, query: string): SkillConfig | null;
//# sourceMappingURL=index.d.ts.map