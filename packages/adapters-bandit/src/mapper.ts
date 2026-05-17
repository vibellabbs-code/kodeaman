import type { FindingCategory, OwaspCategory, SeverityLevel } from "@kodeaman/schema";
import { createHash } from "node:crypto";

export function mapSeverity(rawSeverity?: string): SeverityLevel {
  switch ((rawSeverity ?? "").toLowerCase()) {
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
    default: return "info";
  }
}

const banditCweMap: Record<string, string[]> = {
  B101: ["CWE-703"], B102: ["CWE-78"], B103: ["CWE-276"], B104: ["CWE-605"],
  B105: ["CWE-798"], B106: ["CWE-798"], B107: ["CWE-798"], B108: ["CWE-377"],
  B110: ["CWE-703"], B112: ["CWE-703"], B201: ["CWE-89"], B301: ["CWE-502"],
  B302: ["CWE-327"], B303: ["CWE-327"], B304: ["CWE-327"], B305: ["CWE-327"],
  B306: ["CWE-327"], B307: ["CWE-95"], B308: ["CWE-327"], B309: ["CWE-327"],
  B310: ["CWE-20"], B311: ["CWE-327"], B312: ["CWE-327"], B313: ["CWE-611"],
  B314: ["CWE-611"], B315: ["CWE-611"], B316: ["CWE-611"], B317: ["CWE-611"],
  B318: ["CWE-611"], B319: ["CWE-319"], B320: ["CWE-327"], B321: ["CWE-259"],
  B323: ["CWE-295"], B324: ["CWE-327"], B401: ["CWE-78"], B402: ["CWE-78"],
  B403: ["CWE-78"], B404: ["CWE-78"], B405: ["CWE-78"], B406: ["CWE-78"],
  B407: ["CWE-78"], B408: ["CWE-78"], B409: ["CWE-78"], B410: ["CWE-78"],
  B411: ["CWE-78"], B412: ["CWE-78"], B413: ["CWE-78"], B501: ["CWE-295"],
  B502: ["CWE-502"], B503: ["CWE-295"], B504: ["CWE-295"], B505: ["CWE-327"],
  B506: ["CWE-20"], B507: ["CWE-94"], B601: ["CWE-601"], B602: ["CWE-78"],
  B603: ["CWE-78"], B604: ["CWE-78"], B605: ["CWE-78"], B606: ["CWE-78"],
  B607: ["CWE-78"], B608: ["CWE-89"], B609: ["CWE-78"], B610: ["CWE-78"],
  B611: ["CWE-611"], B701: ["CWE-79"], B702: ["CWE-703"], B703: ["CWE-703"],
};

export function mapCwes(testId: string, cweId?: number): string[] {
  if (cweId) return [`CWE-${cweId}`];
  return banditCweMap[testId] ?? [];
}

export function mapCategory(cwes: string[]): FindingCategory {
  if (cwes.some((cwe) => ["CWE-798", "CWE-259"].includes(cwe))) return "secrets";
  if (cwes.includes("CWE-89")) return "sqli";
  if (cwes.includes("CWE-79")) return "xss";
  if (cwes.some((cwe) => ["CWE-78", "CWE-94", "CWE-95"].includes(cwe))) return "rce";
  if (cwes.some((cwe) => ["CWE-200", "CWE-209"].includes(cwe))) return "info-leak";
  if (cwes.includes("CWE-20")) return "input-validation";
  return "sast";
}

export function mapOwaspCategory(cwes: string[]): OwaspCategory {
  if (cwes.some((cwe) => ["CWE-327", "CWE-319", "CWE-295"].includes(cwe))) return "A02-cryptographic-failures";
  if (cwes.some((cwe) => ["CWE-78", "CWE-79", "CWE-89", "CWE-94", "CWE-95"].includes(cwe))) return "A03-injection";
  if (cwes.some((cwe) => ["CWE-798", "CWE-502"].includes(cwe))) return "A08-data-integrity-failures";
  return "A04-insecure-design";
}

export function hashParts(parts: string[], length = 24): string {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex").slice(0, length);
}
