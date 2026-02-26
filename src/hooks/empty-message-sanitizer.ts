/**
 * Empty Message Sanitizer Hook
 *
 * Prevents API errors caused by empty tool outputs.
 * Detects and replaces empty content with a placeholder.
 */

type TextPart = { type: "text"; text: string };
type ToolResultPart = { type: "tool_result"; content: unknown };
type ContentPart = TextPart | ToolResultPart | { type: string; [key: string]: unknown };

export function isEmptyContent(content: unknown): boolean {
  if (content === null || content === undefined) {
    return true;
  }

  if (typeof content === "string") {
    return content.trim() === "";
  }

  if (Array.isArray(content)) {
    if (content.length === 0) {
      return true;
    }
    return content.every((part) => isEmptyPart(part));
  }

  if (typeof content === "object") {
    const obj = content as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string") {
      return obj.text.trim() === "";
    }
    if ("content" in obj) {
      return isEmptyContent(obj.content);
    }
  }

  return false;
}

function isEmptyPart(part: unknown): boolean {
  if (part === null || part === undefined) {
    return true;
  }

  if (typeof part === "string") {
    return part.trim() === "";
  }

  if (typeof part !== "object") {
    return false;
  }

  const p = part as ContentPart;

  // Check text parts
  if ("text" in p && typeof p.text === "string") {
    return p.text.trim() === "";
  }

  // Check tool_result parts
  if (p.type === "tool_result" && "content" in p) {
    return isEmptyContent((p as ToolResultPart).content);
  }

  return false;
}

export function sanitizeContent(
  content: unknown,
  placeholder: string = "(No output)"
): unknown {
  if (!isEmptyContent(content)) {
    return content;
  }

  if (typeof content === "string" || content === null || content === undefined) {
    return placeholder;
  }

  if (Array.isArray(content)) {
    if (content.length === 0) {
      return [{ type: "text", text: placeholder }];
    }

    return content.map((part) => {
      if (isEmptyPart(part)) {
        if (typeof part === "object" && part !== null && "type" in part) {
          const p = part as ContentPart;
          if (p.type === "text" || "text" in p) {
            return { type: "text", text: placeholder };
          }
        }
        return { type: "text", text: placeholder };
      }
      return part;
    });
  }

  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string" && obj.text.trim() === "") {
      return { ...obj, text: placeholder };
    }
    if ("content" in obj && isEmptyContent(obj.content)) {
      return { ...obj, content: placeholder };
    }
  }

  return content;
}
