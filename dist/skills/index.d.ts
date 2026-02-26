export interface SkillConfig {
    name: string;
    description: string;
    content: string;
    location: string;
}
export declare function getBuiltinSkills(): Record<string, SkillConfig>;
export declare function findSkill(skills: Record<string, SkillConfig>, query: string): SkillConfig | null;
//# sourceMappingURL=index.d.ts.map