/**
 * Tilth-First Guard Hook
 *
 * Hard-enforces explicit tilth CLI usage for the Explore agent before it can
 * fall back to read/grep/glob.
 */

const EXPLORE_AGENT = "explore";
const FALLBACK_TOOLS = new Set(["read", "grep", "glob"]);
const EXPLICIT_TILTH_COMMAND = /^(?:npx\s+)?tilth(?:\s|$)/i;

export interface TilthFirstGuardState {
  sawTilthAttempt: boolean;
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isExploreAgent(agent: unknown): boolean {
  return normalize(agent) === EXPLORE_AGENT;
}

export function isFallbackNavigationTool(toolName: unknown): boolean {
  return FALLBACK_TOOLS.has(normalize(toolName));
}

export function isExplicitTilthCommand(command: unknown): boolean {
  return typeof command === "string" && EXPLICIT_TILTH_COMMAND.test(command.trim());
}

export function markTilthAttempt(state?: TilthFirstGuardState): TilthFirstGuardState {
  return {
    ...(state || {}),
    sawTilthAttempt: true,
  };
}

export function shouldBlockTilthFallback(
  agent: unknown,
  toolName: unknown,
  state?: TilthFirstGuardState
): boolean {
  if (!isExploreAgent(agent)) {
    return false;
  }

  if (!isFallbackNavigationTool(toolName)) {
    return false;
  }

  return state?.sawTilthAttempt !== true;
}

export function formatTilthFirstGuardWarning(toolName: string): string {
  return `[CliKit:tilth-first-guard] Blocked @explore from using ${toolName} before an explicit tilth CLI attempt.`;
}

export function formatTilthFirstGuardReason(toolName: string): string {
  return `@explore must call 'tilth <path>' before using ${toolName}. read/grep/glob are fallback tools only.`;
}

export function formatTilthFirstGuardPass(command: string): string {
  return `[CliKit:tilth-first-guard] Recorded tilth attempt for @explore: ${command}`;
}
