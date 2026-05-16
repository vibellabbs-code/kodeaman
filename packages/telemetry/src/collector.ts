import type { ScanResult } from "@kodeaman/core";
import type { NormalizedFinding, OwaspScanReport, SeverityLevel } from "@kodeaman/schema";
import type { TelemetryEvent, TelemetryInput, TelemetryScanSummary } from "./types.js";

const SEVERITIES: SeverityLevel[] = ["info", "low", "medium", "high", "critical"];

export class TelemetryCollector {
  collect(input: TelemetryInput, metadata?: Record<string, unknown>): TelemetryEvent {
    const findings = extractFindings(input);
    const summary = summarize(input, findings);

    return {
      schemaVersion: "1.0.0",
      eventType: isOwaspReport(input) ? "owasp-scan-report" : "scan-result",
      generatedAt: new Date().toISOString(),
      summary,
      findings,
      metadata,
    };
  }
}

function extractFindings(input: TelemetryInput): NormalizedFinding[] {
  if (Array.isArray(input)) return input;
  if (isOwaspReport(input)) return input.phases.flatMap((phase) => phase.findings);
  return input.findings;
}

function summarize(input: TelemetryInput, findings: NormalizedFinding[]): TelemetryScanSummary {
  const bySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<string, number>;
  const scanners = new Set<string>();

  for (const finding of findings) {
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    scanners.add(finding.source);
  }

  if (!Array.isArray(input) && !isOwaspReport(input)) {
    return {
      totalFindings: input.summary.total,
      bySeverity: { ...bySeverity, ...input.summary.bySeverity },
      scannersUsed: Object.keys(input.timing.adapterTimings),
      scanDurationMs: input.timing.durationMs,
    };
  }

  if (isOwaspReport(input)) {
    for (const phase of input.phases) {
      for (const scanner of phase.scannersUsed) scanners.add(scanner);
    }
    return {
      totalFindings: input.totalFindings,
      bySeverity,
      scannersUsed: [...scanners],
      scanDurationMs: input.scanDurationMs,
    };
  }

  return {
    totalFindings: findings.length,
    bySeverity,
    scannersUsed: [...scanners],
  };
}

function isOwaspReport(input: TelemetryInput): input is OwaspScanReport {
  return !Array.isArray(input) && "phases" in input;
}
