import type { ScanResult } from "@kodeaman/core";
import type { NormalizedFinding, OwaspScanReport } from "@kodeaman/schema";

export type TelemetryFormat = "json" | "jsonl";

export interface TelemetryWriterOptions {
  outputPath: string;
  format?: TelemetryFormat;
  append?: boolean;
}

export interface TelemetryScanSummary {
  totalFindings: number;
  bySeverity: Record<string, number>;
  scannersUsed: string[];
  scanDurationMs?: number;
}

export interface TelemetryEvent {
  schemaVersion: "1.0.0";
  eventType: "scan-result" | "owasp-scan-report";
  generatedAt: string;
  summary: TelemetryScanSummary;
  findings: NormalizedFinding[];
  metadata?: Record<string, unknown>;
}

export type TelemetryInput = ScanResult | OwaspScanReport | NormalizedFinding[];
