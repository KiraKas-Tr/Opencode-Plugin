import { describe, expect, it } from "bun:test";
import {
  sendNotification,
  buildIdleNotification,
  buildErrorNotification,
} from "./session-notification";

describe("session-notification", () => {
  it("handles undefined title gracefully", () => {
    // Should not throw even with undefined title
    const payload = { title: undefined as any, body: "test" };
    expect(() => sendNotification(payload)).not.toThrow();
  });

  it("handles null title gracefully", () => {
    const payload = { title: null as any, body: "test" };
    expect(() => sendNotification(payload)).not.toThrow();
  });

  it("handles undefined body gracefully", () => {
    const payload = { title: "Test", body: undefined as any };
    expect(() => sendNotification(payload)).not.toThrow();
  });

  it("builds idle notification with correct title", () => {
    const payload = buildIdleNotification("session-123", "CliKit");
    expect(payload.title).toBe("CliKit — Task Complete");
    expect(payload.body).toContain("session-");  // Only first 8 chars of session ID
    expect(payload.urgency).toBe("normal");
  });

  it("builds error notification with correct title", () => {
    const payload = buildErrorNotification(new Error("Test error"), "session-456", "CliKit");
    expect(payload.title).toBe("CliKit — Error");
    expect(payload.body).toContain("Test error");
    expect(payload.urgency).toBe("critical");
  });

  it("uses default prefix when not provided", () => {
    const idlePayload = buildIdleNotification("session-123");
    expect(idlePayload.title).toBe("OpenCode — Task Complete");

    const errorPayload = buildErrorNotification("error");
    expect(errorPayload.title).toBe("OpenCode — Error");
  });
});
