/**
 * Hook Error Logger
 *
 * Centralized error logging helper for hook execution paths.
 * - formatHookErrorLog()    → formats error string for cliLog/SDK
 * - writeErrorLog()         → appends structured entry to .opencode/error-log.txt
 * - bufferInitError()       → collect errors from init-time code (no ctx yet)
 * - drainInitErrors()       → flush buffered errors once ctx is available
 * - isBlockedToolExecutionError() → detects intentional plugin blocks vs real bugs
 */

import * as fs from "fs";
import * as path from "path";

const BLOCKED_TOOL_ERROR_PREFIX = "[CliKit] Blocked tool execution:";

// ---------------------------------------------------------------------------
// Init-time error buffer
// Agents / commands / skills / config load synchronously before ctx is ready.
// We buffer their errors here and drain them once the plugin has ctx.
// ---------------------------------------------------------------------------

export interface BufferedError {
  source: string;           // e.g. "agents", "config", "skills"
  level: "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
}

const _initErrorBuffer: BufferedError[] = [];

/**
 * Buffer an error that occurred during plugin init (no ctx available yet).
 * Safe to call from any sync module-level code.
 */
export function bufferInitError(
  source: string,
  level: "warn" | "error",
  message: string,
  context?: Record<string, unknown>
): void {
  _initErrorBuffer.push({ source, level, message, context });
}

/**
 * Return and clear all buffered init errors.
 * Call once from hookErr drain in index.ts after ctx is ready.
 */
export function drainInitErrors(): BufferedError[] {
  return _initErrorBuffer.splice(0, _initErrorBuffer.length);
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && typeof error.stack === "string") {
    return error.stack;
  }
  return undefined;
}

export function isBlockedToolExecutionError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(BLOCKED_TOOL_ERROR_PREFIX);
}

export function formatHookErrorLog(
  hookName: string,
  error: unknown,
  context?: Record<string, unknown>
): string {
  const message = getErrorMessage(error);
  const contextPart = context && Object.keys(context).length > 0
    ? ` context=${JSON.stringify(context)}`
    : "";
  const stack = getErrorStack(error);

  return [
    `[CliKit:${hookName}] Hook error: ${message}${contextPart}`,
    ...(stack ? [stack] : []),
  ].join("\n");
}

/**
 * Appends a structured error entry to .opencode/error-log.txt.
 * Called from hookErr() in index.ts alongside cliLog().
 * Fails silently — never disrupts hook flow.
 */
export function writeErrorLog(
  hookName: string,
  error: unknown,
  projectDir: string,
  context?: Record<string, unknown>
): void {
  try {
    const logDir = path.join(projectDir, ".opencode");
    const logPath = path.join(logDir, "error-log.txt");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const message = getErrorMessage(error);
    const stack = getErrorStack(error);
    const contextStr = context && Object.keys(context).length > 0
      ? `context: ${JSON.stringify(context, null, 2)}`
      : "";

    const entry = [
      `───────────────────────────────────────`,
      `timestamp: ${timestamp}`,
      `hook:      ${hookName}`,
      `error:     ${message}`,
      ...(contextStr ? [contextStr] : []),
      ...(stack ? [`stack:\n${stack}`] : []),
      "",
    ].join("\n");

    fs.appendFileSync(logPath, entry, "utf-8");
  } catch {
    // Never throw from the error logger itself.
  }
}

/**
 * Write a plain buffered init error to error-log.txt.
 * Used by drainInitErrors() flow in index.ts.
 */
export function writeBufferedErrorLog(
  entry: BufferedError,
  projectDir: string,
): void {
  try {
    const logDir = path.join(projectDir, ".opencode");
    const logPath = path.join(logDir, "error-log.txt");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const contextStr = entry.context && Object.keys(entry.context).length > 0
      ? `context: ${JSON.stringify(entry.context, null, 2)}`
      : "";

    const line = [
      `───────────────────────────────────────`,
      `timestamp: ${timestamp}`,
      `source:    ${entry.source} [${entry.level}]`,
      `error:     ${entry.message}`,
      ...(contextStr ? [contextStr] : []),
      "",
    ].join("\n");

    fs.appendFileSync(logPath, line, "utf-8");
  } catch {
    // Never throw from the error logger itself.
  }
}

