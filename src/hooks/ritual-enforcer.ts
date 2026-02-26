import * as fs from "fs";
import * as path from "path";

const RITUAL_FILE = path.join(process.cwd(), ".opencode", "memory", "ritual-state.json");

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

const PHASE_ORDER: RitualPhase["name"][] = ["discover", "plan", "implement", "verify", "complete"];

export interface RitualEnforcerConfig {
  enabled?: boolean;
  enforceOrder?: boolean;
  requireApproval?: boolean;
}

function buildInitialPhases(): RitualPhase[] {
  return PHASE_ORDER.map((name) => ({ name, status: "pending" as const }));
}

function normalizeRitualState(raw: unknown): RitualState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const rawPhases = Array.isArray(data.phases) ? data.phases : [];
  const phases = buildInitialPhases();

  for (const phase of rawPhases) {
    if (!phase || typeof phase !== "object") {
      continue;
    }
    const entry = phase as Record<string, unknown>;
    const name = entry.name;
    const status = entry.status;
    if (!PHASE_ORDER.includes(name as RitualPhase["name"])) {
      continue;
    }
    if (status !== "pending" && status !== "in_progress" && status !== "done") {
      continue;
    }

    const index = PHASE_ORDER.indexOf(name as RitualPhase["name"]);
    phases[index] = {
      name: name as RitualPhase["name"],
      status: status as RitualPhase["status"],
      startedAt: typeof entry.startedAt === "string" ? entry.startedAt : undefined,
      completedAt: typeof entry.completedAt === "string" ? entry.completedAt : undefined,
    };
  }

  let currentPhase = typeof data.currentPhase === "number" ? data.currentPhase : 0;
  if (!Number.isFinite(currentPhase)) {
    currentPhase = 0;
  }
  currentPhase = Math.max(0, Math.min(PHASE_ORDER.length - 1, Math.floor(currentPhase)));

  const createdAt = typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString();
  const updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : createdAt;
  const taskId = typeof data.taskId === "string" ? data.taskId : undefined;

  return {
    taskId,
    phases,
    currentPhase,
    createdAt,
    updatedAt,
  };
}

function loadRitualState(): RitualState | null {
  if (!fs.existsSync(RITUAL_FILE)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(RITUAL_FILE, "utf-8"));
    return normalizeRitualState(parsed);
  } catch {
    return null;
  }
}

function saveRitualState(state: RitualState): void {
  const dir = path.dirname(RITUAL_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(RITUAL_FILE, JSON.stringify(state, null, 2));
}

export function initRitual(taskId?: string): RitualState {
  const phases: RitualPhase[] = buildInitialPhases();
  phases[0].status = "in_progress";
  phases[0].startedAt = new Date().toISOString();
  
  const state: RitualState = {
    taskId,
    phases,
    currentPhase: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveRitualState(state);
  return state;
}

export function getCurrentPhase(): RitualPhase | null {
  const state = loadRitualState();
  if (!state) return null;
  return state.phases[state.currentPhase] || null;
}

export function advancePhase(): RitualState | null {
  const state = loadRitualState();
  if (!state) return null;
  
  const currentPhase = state.phases[state.currentPhase];
  if (!currentPhase || currentPhase.status !== "done") {
    return state;
  }
  
  if (state.currentPhase < state.phases.length - 1) {
    state.currentPhase++;
    state.phases[state.currentPhase].status = "in_progress";
    state.phases[state.currentPhase].startedAt = new Date().toISOString();
    saveRitualState(state);
  }
  
  return state;
}

export function completePhase(phaseName: RitualPhase["name"]): RitualState | null {
  const state = loadRitualState();
  if (!state) return null;
  
  const phaseIndex = state.phases.findIndex((p) => p.name === phaseName);
  if (phaseIndex === -1) return state;
  
  const phase = state.phases[phaseIndex];
  
  if (phaseIndex > state.currentPhase && phase.status === "pending") {
    console.warn(`[Ritual] Cannot complete phase "${phaseName}" - previous phases not complete`);
    return state;
  }
  
  phase.status = "done";
  phase.completedAt = new Date().toISOString();
  
  if (phaseIndex === state.currentPhase) {
    state.currentPhase = Math.min(state.currentPhase + 1, state.phases.length - 1);
    if (state.currentPhase < state.phases.length) {
      state.phases[state.currentPhase].status = "in_progress";
      state.phases[state.currentPhase].startedAt = new Date().toISOString();
    }
  }
  
  saveRitualState(state);
  return state;
}

export function checkRitualProgress(): {
  currentPhase: string;
  progress: string;
  canProceed: boolean;
} {
  const state = loadRitualState();
  
  if (!state) {
    return {
      currentPhase: "none",
      progress: "No ritual in progress. Use /start to begin.",
      canProceed: true,
    };
  }
  
  const current = state.phases[state.currentPhase];
  const completed = state.phases.filter((p) => p.status === "done").length;
  
  let canProceed = true;
  let warning = "";
  
  if (current.name === "implement" && state.phases[1].status !== "done") {
    canProceed = false;
    warning = "PLAN phase not complete. Complete /plan first.";
  }
  
  if (current.name === "verify" && state.phases[2].status !== "done") {
    canProceed = false;
    warning = "IMPLEMENT phase not complete.";
  }
  
  return {
    currentPhase: current.name,
    progress: `Phase ${completed + 1}/${state.phases.length}: ${current.name.toUpperCase()} (${current.status})`,
    canProceed,
  };
}

export function formatRitualStatus(): string {
  const state = loadRitualState();
  
  if (!state) {
    return `[Ritual] No active ritual. Start with /create or /start`;
  }
  
  const lines = state.phases.map((phase, i) => {
    const icon = phase.status === "done" ? "✓" : phase.status === "in_progress" ? "►" : "○";
    const prefix = i === state.currentPhase ? ">" : " ";
    return `${prefix} ${icon} ${phase.name.toUpperCase()}`;
  });
  
  return `[Ritual] Current: ${state.phases[state.currentPhase].name.toUpperCase()}\n${lines.join("\n")}`;
}
