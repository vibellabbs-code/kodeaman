import type { FindingCategory, OwaspCategory, SeverityLevel } from "@kodeaman/schema";
import { createHash } from "node:crypto";

export function mapSeverity(rawSeverity?: string): SeverityLevel {
  switch ((rawSeverity ?? "").toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
    case "error":
      return "high";
    case "medium":
    case "moderate":
    case "warning":
      return "medium";
    case "low":
      return "low";
    case "info":
    case "informational":
      return "info";
    default:
      return "medium";
  }
}

const cweCategoryMap: Record<string, FindingCategory> = {
  "20": "input-validation",
  "22": "file-upload",
  "77": "rce",
  "78": "rce",
  "79": "xss",
  "89": "sqli",
  "200": "info-leak",
  "209": "info-leak",
  "287": "auth",
  "306": "auth",
  "352": "csrf",
  "434": "file-upload",
  "502": "rce",
  "798": "secrets",
  "862": "auth",
  "918": "ssrf",
};

export function mapCategory(cwes: string[]): FindingCategory {
  for (const cwe of cwes) {
    const id = cwe.replace(/^CWE-/i, "");
    if (cweCategoryMap[id]) return cweCategoryMap[id];
  }
  return "sast";
}

export function mapOwaspCategory(cwes: string[]): OwaspCategory {
  const ids = cwes.map((cwe) => cwe.replace(/^CWE-/i, ""));
  if (ids.some((id) => ["22", "352", "862"].includes(id))) return "A01-broken-access-control";
  if (ids.some((id) => ["327", "328"].includes(id))) return "A02-cryptographic-failures";
  if (ids.some((id) => ["20", "77", "78", "79", "89", "918"].includes(id))) return "A03-injection";
  if (ids.some((id) => ["798", "502"].includes(id))) return "A08-data-integrity-failures";
  if (ids.some((id) => ["200", "209"].includes(id))) return "A09-logging-monitoring-failures";
  return "A04-insecure-design";
}

export function hashParts(parts: string[], length = 24): string {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex").slice(0, length);
}
