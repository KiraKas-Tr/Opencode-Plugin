export interface RitualPhase {
    name: "discover" | "plan" | "implement" | "verify" | "complete";
    status: "pending" | "in_progress" | "done";
    startedAt?: string;
    completedAt?: string;
}
export interface RitualState {
    taskId?: string;
    phases: RitualPhase[];
    currentPhase: number;
    createdAt: string;
    updatedAt: string;
}
export interface RitualEnforcerConfig {
    enabled?: boolean;
    enforceOrder?: boolean;
    requireApproval?: boolean;
}
export declare function initRitual(taskId?: string): RitualState;
export declare function getCurrentPhase(): RitualPhase | null;
export declare function advancePhase(): RitualState | null;
export declare function completePhase(phaseName: RitualPhase["name"]): RitualState | null;
export declare function checkRitualProgress(): {
    currentPhase: string;
    progress: string;
    canProceed: boolean;
};
export declare function formatRitualStatus(): string;
//# sourceMappingURL=ritual-enforcer.d.ts.map