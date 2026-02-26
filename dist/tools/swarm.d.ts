export interface SwarmPlanParams {
    operation: "plan";
    tasks: SwarmTask[];
    parallelism?: number;
}
export interface SwarmMonitorParams {
    operation: "monitor";
    taskId?: string;
}
export interface SwarmDelegateParams {
    operation: "delegate";
    taskId: string;
    agentRole: "fe" | "be" | "mobile" | "devops" | "qa";
}
export interface SwarmAbortParams {
    operation: "abort";
    taskId: string;
    reason: string;
}
export type SwarmParams = SwarmPlanParams | SwarmMonitorParams | SwarmDelegateParams | SwarmAbortParams;
export interface SwarmTask {
    id: string;
    title: string;
    description: string;
    dependencies?: string[];
    agentRole?: "fe" | "be" | "mobile" | "devops" | "qa";
    files?: string[];
    status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
}
export interface SwarmPlanResult {
    planId: string;
    tasks: SwarmTask[];
    parallelism: number;
    estimatedTime: string;
}
export interface SwarmMonitorResult {
    planId: string;
    totalTasks: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    tasks: SwarmTask[];
}
export interface SwarmDelegateResult {
    taskId: string;
    delegatedTo: string;
    status: string;
}
export interface SwarmAbortResult {
    taskId: string;
    aborted: boolean;
    reason: string;
}
export type SwarmResult = SwarmPlanResult | SwarmMonitorResult | SwarmDelegateResult | SwarmAbortResult;
export declare function swarm(params: unknown): SwarmResult;
//# sourceMappingURL=swarm.d.ts.map