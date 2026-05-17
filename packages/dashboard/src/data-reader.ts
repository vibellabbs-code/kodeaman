import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NormalizedFinding, SeverityLevel } from "@kodeaman/schema";
import type { TelemetryEvent } from "@kodeaman/telemetry";

const SEVERITIES: SeverityLevel[] = ["critical", "high", "medium", "low", "info"];
const OWASP_CATEGORIES = [
  "A01:2021",
  "A02:2021",
  "A03:2021",
  "A04:2021",
  "A05:2021",
  "A06:2021",
  "A07:2021",
  "A08:2021",
  "A09:2021",
  "A10:2021",
];

export interface DashboardScanEntry {
  scanId: string;
  generatedAt: string;
  scannerNames: string[];
  totalFindings: number;
  bySeverity: Record<string, number>;
  owaspCoverage: Record<string, boolean>;
  findings: NormalizedFinding[];
  metadata?: Record<string, unknown>;
}

export interface DashboardScanSummary {
  scanId: string;
  generatedAt: string;
  scannerNames: string[];
  totalFindings: number;
  bySeverity: Record<string, number>;
  owaspCoverage: Record<string, boolean>;
}

export interface DashboardTrendPoint {
  period: string;
  scanCount: number;
  totalFindings: number;
  bySeverity: Record<string, number>;
}

export class TelemetryReader {
  private entries: DashboardScanEntry[] = [];

  async readScanLogs(dataDir: string): Promise<DashboardScanEntry[]> {
    const files = await listJsonlFiles(dataDir);
    const entries: DashboardScanEntry[] = [];

    for (const file of files) {
      const content = await readFile(file, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parsed = JSON.parse(trimmed) as TelemetryEvent;
        if (parsed.eventType !== "scan-result" && parsed.eventType !== "owasp-scan-report") {
          continue;
        }
        entries.push(toDashboardEntry(parsed));
      }
    }

    entries.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
    this.entries = entries;
    return entries;
  }

  aggregateTrends(entries = this.entries, periodDays = 1): DashboardTrendPoint[] {
    const buckets = new Map<string, DashboardTrendPoint>();

    for (const entry of entries) {
      const period = formatPeriod(entry.generatedAt, periodDays);
      const bucket = buckets.get(period) ?? {
        period,
        scanCount: 0,
        totalFindings: 0,
        bySeverity: emptySeverityCounts(),
      };

      bucket.scanCount += 1;
      bucket.totalFindings += entry.totalFindings;
      for (const severity of SEVERITIES) {
        bucket.bySeverity[severity] = (bucket.bySeverity[severity] ?? 0) + (entry.bySeverity[severity] ?? 0);
      }
      buckets.set(period, bucket);
    }

    return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
  }

  getRecentScans(limit = 20): DashboardScanSummary[] {
    return this.entries.slice(0, limit).map(({ findings: _findings, ...summary }) => summary);
  }

  getFindings(scanId: string): NormalizedFinding[] {
    return this.entries.find((entry) => entry.scanId === scanId)?.findings ?? [];
  }
}

async function listJsonlFiles(dataDir: string): Promise<string[]> {
  try {
    const dirents = await readdir(dataDir, { withFileTypes: true });
    const files = await Promise.all(dirents.map(async (dirent) => {
      const fullPath = join(dataDir, dirent.name);
      if (dirent.isDirectory()) return listJsonlFiles(fullPath);
      if (dirent.isFile() && dirent.name.endsWith(".jsonl")) return [fullPath];
      return [];
    }));
    return files.flat();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function toDashboardEntry(event: TelemetryEvent): DashboardScanEntry {
  const findings = event.findings ?? [];
  const bySeverity = { ...emptySeverityCounts(), ...event.summary.bySeverity };
  const generatedAt = event.generatedAt;
  const metadataScanId = typeof event.metadata?.scanId === "string" ? event.metadata.scanId : undefined;

  return {
    scanId: metadataScanId ?? `${generatedAt}-${hashFindings(findings)}`,
    generatedAt,
    scannerNames: event.summary.scannersUsed ?? [...new Set(findings.map((finding) => finding.source))],
    totalFindings: event.summary.totalFindings ?? findings.length,
    bySeverity,
    owaspCoverage: buildOwaspCoverage(findings),
    findings,
    metadata: event.metadata,
  };
}

function emptySeverityCounts(): Record<string, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function buildOwaspCoverage(findings: NormalizedFinding[]): Record<string, boolean> {
  const coverage = Object.fromEntries(OWASP_CATEGORIES.map((category) => [category, false]));
  for (const finding of findings) {
    if (finding.owaspCategory) {
      coverage[finding.owaspCategory] = true;
    }
  }
  return coverage;
}

function formatPeriod(timestamp: string, periodDays: number): string {
  const date = new Date(timestamp);
  if (periodDays <= 1) {
    return date.toISOString().slice(0, 10);
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const bucket = Math.floor(day / periodDays) * periodDays;
  start.setUTCDate(start.getUTCDate() + bucket);
  return start.toISOString().slice(0, 10);
}

function hashFindings(findings: NormalizedFinding[]): string {
  const input = findings.map((finding) => finding.findingId).join("|");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
