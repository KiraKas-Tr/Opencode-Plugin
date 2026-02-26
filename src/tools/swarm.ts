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

interface SwarmState {
  planId: string | null;
  tasks: Map<string, SwarmTask>;
  parallelism: number;
}

const swarmState: SwarmState = {
  planId: null,
  tasks: new Map(),
  parallelism: 3,
};

export function swarm(params: unknown): SwarmResult {
  if (!params || typeof params !== "object") {
    return { planId: "none", tasks: [], parallelism: 3, estimatedTime: "0m" } as SwarmPlanResult;
  }
  const p = params as Partial<SwarmParams>;
  
  switch (p.operation) {
    case "plan":
      return swarmPlan(p as SwarmPlanParams);
    case "monitor":
      return swarmMonitor(p as SwarmMonitorParams);
    case "delegate":
      return swarmDelegate(p as SwarmDelegateParams);
    case "abort":
      return swarmAbort(p as SwarmAbortParams);
    default:
      return { planId: "none", tasks: [], parallelism: 3, estimatedTime: "0m" } as SwarmPlanResult;
  }
}

function swarmPlan(params: SwarmPlanParams): SwarmPlanResult {
  const planId = `swarm-${Date.now()}`;
  swarmState.planId = planId;
  swarmState.tasks.clear();
  swarmState.parallelism = params.parallelism || 3;
  
  for (const task of params.tasks) {
    swarmState.tasks.set(task.id, { ...task, status: task.status || "pending" });
  }
  
  const completedDeps = findReadyTasks();
  for (const taskId of completedDeps) {
    const task = swarmState.tasks.get(taskId);
    if (task && task.status === "pending") {
      task.status = "in_progress";
    }
  }
  
  return {
    planId,
    tasks: Array.from(swarmState.tasks.values()),
    parallelism: swarmState.parallelism,
    estimatedTime: estimateTime(params.tasks),
  };
}

function swarmMonitor(params: SwarmMonitorParams): SwarmMonitorResult {
  const tasks = Array.from(swarmState.tasks.values());
  
  if (params.taskId) {
    const task = swarmState.tasks.get(params.taskId);
    if (!task) {
      throw new Error(`Task not found: ${params.taskId}`);
    }
  }
  
  return {
    planId: swarmState.planId || "none",
    totalTasks: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    tasks,
  };
}

function swarmDelegate(params: SwarmDelegateParams): SwarmDelegateResult {
  const task = swarmState.tasks.get(params.taskId);
  
  if (!task) {
    throw new Error(`Task not found: ${params.taskId}`);
  }
  
  task.agentRole = params.agentRole;
  task.status = "in_progress";
  
  return {
    taskId: params.taskId,
    delegatedTo: `@${params.agentRole}`,
    status: "delegated",
  };
}

function swarmAbort(params: SwarmAbortParams): SwarmAbortResult {
  const task = swarmState.tasks.get(params.taskId);
  
  if (!task) {
    throw new Error(`Task not found: ${params.taskId}`);
  }
  
  task.status = "failed";
  
  return {
    taskId: params.taskId,
    aborted: true,
    reason: params.reason,
  };
}

function findReadyTasks(): string[] {
  const ready: string[] = [];
  
  for (const [id, task] of swarmState.tasks) {
    if (task.status !== "pending") continue;
    
    const deps = task.dependencies || [];
    const allDepsComplete = deps.every((depId) => {
      const dep = swarmState.tasks.get(depId);
      return dep && dep.status === "completed";
    });
    
    if (allDepsComplete) {
      ready.push(id);
    }
  }
  
  return ready;
}

function estimateTime(tasks: SwarmTask[]): string {
  const totalTasks = tasks.length;
  const parallelism = swarmState.parallelism;
  const avgTaskTime = 5; // minutes per task
  
  const batches = Math.ceil(totalTasks / parallelism);
  const totalMinutes = batches * avgTaskTime;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  }
}
