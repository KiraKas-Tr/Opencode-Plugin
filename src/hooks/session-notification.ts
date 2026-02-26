/**
 * Session Notification Hook
 *
 * Sends desktop notifications when sessions complete or go idle.
 * Uses platform-native notification commands (notify-send, osascript, powershell).
 * Runs on session.idle event.
 */

import { execSync } from "child_process";

export interface SessionNotificationConfig {
  enabled?: boolean;
  on_idle?: boolean;
  on_error?: boolean;
  title_prefix?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  urgency?: "low" | "normal" | "critical";
}

function escapeSingleQuotes(str: string): string {
  return str.replace(/'/g, "'\\''");
}

function getNotifyCommand(payload: NotificationPayload): string | null {
  const { title, body, urgency } = payload;
  const safeTitle = typeof title === "string" ? title : "Notification";
  const safeBody = typeof body === "string" ? body : "";
  const escapedTitle = safeTitle.replace(/"/g, '\\"');
  const escapedBody = safeBody.replace(/"/g, '\\"');

  switch (process.platform) {
    case "linux":
      return `notify-send "${escapedTitle}" "${escapedBody}" --urgency=${urgency || "normal"}`;

    case "darwin":
      return `osascript -e 'display notification "${escapedBody}" with title "${escapedTitle}"'`;

    case "win32":
      return `powershell -command "[void] [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(5000, '${escapeSingleQuotes(safeTitle)}', '${escapeSingleQuotes(safeBody)}', [System.Windows.Forms.ToolTipIcon]::Info)"`;

    default:
      return null;
  }
}

export function sendNotification(payload: NotificationPayload): boolean {
  const cmd = getNotifyCommand(payload);
  if (!cmd) return false;

  try {
    execSync(cmd, { timeout: 5000, stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    // WSL fallback: try wsl-notify-send or powershell.exe
    if (process.platform === "linux") {
      try {
        const wslTitle = escapeSingleQuotes(typeof payload.title === "string" ? payload.title : "Notification");
        const wslBody = escapeSingleQuotes(typeof payload.body === "string" ? payload.body : "");
        const wslCmd = `powershell.exe -command "[void] [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(5000, '${wslTitle}', '${wslBody}', [System.Windows.Forms.ToolTipIcon]::Info)"`;
        execSync(wslCmd, { timeout: 5000, stdio: ["pipe", "pipe", "pipe"] });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function buildIdleNotification(
  sessionId?: unknown,
  prefix?: string
): NotificationPayload {
  const titlePrefix = prefix || "OpenCode";
  const sid = typeof sessionId === "string" ? sessionId : undefined;
  return {
    title: `${titlePrefix} — Task Complete`,
    body: sid
      ? `Session ${sid.substring(0, 8)} is idle and waiting for input.`
      : "Session is idle and waiting for input.",
    urgency: "normal",
  };
}

export function buildErrorNotification(
  error: unknown,
  sessionId?: unknown,
  prefix?: string
): NotificationPayload {
  const titlePrefix = prefix || "OpenCode";
  const errorStr = typeof error === "string" 
    ? error 
    : error instanceof Error 
      ? error.message 
      : String(error);
  const sid = typeof sessionId === "string" ? sessionId : undefined;
  return {
    title: `${titlePrefix} — Error`,
    body: sid
      ? `Session ${sid.substring(0, 8)}: ${errorStr.substring(0, 100)}`
      : errorStr.substring(0, 120),
    urgency: "critical",
  };
}

export function formatNotificationLog(payload: NotificationPayload, sent: boolean): string {
  return sent
    ? `[CliKit:notification] Sent: "${payload.title}"`
    : `[CliKit:notification] Failed to send notification (platform: ${process.platform})`;
}
