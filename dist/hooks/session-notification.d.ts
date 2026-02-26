/**
 * Session Notification Hook
 *
 * Sends desktop notifications when sessions complete or go idle.
 * Uses platform-native notification commands (notify-send, osascript, powershell).
 * Runs on session.idle event.
 */
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
export declare function sendNotification(payload: NotificationPayload): boolean;
export declare function buildIdleNotification(sessionId?: unknown, prefix?: string): NotificationPayload;
export declare function buildErrorNotification(error: unknown, sessionId?: unknown, prefix?: string): NotificationPayload;
export declare function formatNotificationLog(payload: NotificationPayload, sent: boolean): string;
//# sourceMappingURL=session-notification.d.ts.map