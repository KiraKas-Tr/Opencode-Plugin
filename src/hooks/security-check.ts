/**
 * Security Check Hook
 *
 * Scans for secrets, credentials, and sensitive data before git commits.
 * Runs on tool.execute.before for bash tool (git commit).
 */

const SECRET_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}/i, type: "API Key" },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}/i, type: "Secret/Password" },
  { pattern: /(?:access[_-]?token|auth[_-]?token)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}/i, type: "Access Token" },
  { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*["']?AK[A-Z0-9]{18}/i, type: "AWS Access Key" },
  { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9/+=]{40}/i, type: "AWS Secret Key" },
  { pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/, type: "Private Key" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, type: "GitHub Personal Access Token" },
  { pattern: /sk-[a-zA-Z0-9]{32,}/, type: "OpenAI API Key" },
  { pattern: /xox[bporas]-[a-zA-Z0-9\-]+/, type: "Slack Token" },
];

const SENSITIVE_FILES = [
  /\.env$/,
  /\.env\.\w+$/,
  /credentials\.json$/,
  /service[_-]?account.*\.json$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa$/,
  /id_ed25519$/,
];

export interface SecurityFinding {
  type: string;
  file?: string;
  line?: number;
  snippet?: string;
}

export interface SecurityCheckResult {
  safe: boolean;
  findings: SecurityFinding[];
}

function normalizeSecurityResult(result: unknown): SecurityCheckResult {
  if (!result || typeof result !== "object") {
    return { safe: true, findings: [] };
  }

  const raw = result as { safe?: unknown; findings?: unknown };
  const findings = Array.isArray(raw.findings)
    ? raw.findings
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((record) => {
          return {
            type: typeof record.type === "string" ? record.type : "Unknown",
            file: typeof record.file === "string" ? record.file : undefined,
            line: typeof record.line === "number" ? record.line : undefined,
            snippet: typeof record.snippet === "string" ? record.snippet : undefined,
          };
        })
    : [];

  return {
    safe: typeof raw.safe === "boolean" ? raw.safe : findings.length === 0,
    findings,
  };
}

export function scanContentForSecrets(content: string, filename?: string): SecurityCheckResult {
  if (typeof content !== "string") return { safe: true, findings: [] };
  const findings: SecurityFinding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, type } of SECRET_PATTERNS) {
      if (pattern.test(lines[i])) {
        findings.push({
          type,
          file: filename,
          line: i + 1,
          snippet: lines[i].substring(0, 80).trim(),
        });
      }
    }
  }

  return { safe: findings.length === 0, findings };
}

export function isSensitiveFile(filepath: string): boolean {
  return SENSITIVE_FILES.some((pattern) => pattern.test(filepath));
}

export function formatSecurityWarning(result: SecurityCheckResult | unknown): string {
  const safeResult = normalizeSecurityResult(result);
  const lines = ["[CliKit:security] Potential secrets detected:"];
  for (const f of safeResult.findings) {
    lines.push(`  - ${f.type}${f.file ? ` in ${f.file}` : ""}${f.line ? `:${f.line}` : ""}`);
    if (f.snippet) {
      lines.push(`    ${f.snippet.substring(0, 60)}...`);
    }
  }
  lines.push("  Review before committing.");
  return lines.join("\n");
}
