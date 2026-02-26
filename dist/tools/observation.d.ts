export interface ObservationParams {
    type: "learning" | "decision" | "blocker" | "progress" | "handoff";
    narrative: string;
    facts?: string[];
    confidence?: number;
    files_read?: string[];
    files_modified?: string[];
    bead_id?: string;
    concepts?: string[];
    expires_at?: string;
}
export interface ObservationResult {
    id: number;
    type: string;
    narrative: string;
    facts: string[];
    confidence: number;
    files_read: string[];
    files_modified: string[];
    concepts: string[];
    bead_id?: string;
    created_at: string;
}
export declare function createObservation(params: unknown): ObservationResult | null;
export declare function getObservationsByType(type: string, limit?: number): ObservationResult[];
export declare function getObservationsByBead(beadId: string): ObservationResult[];
export declare function linkObservations(observationId: number, concept: string): void;
//# sourceMappingURL=observation.d.ts.map