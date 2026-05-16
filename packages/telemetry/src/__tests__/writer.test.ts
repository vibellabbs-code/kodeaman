import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { TelemetryCollector, TelemetryWriter } from "../index.js";
import type { ScanResult } from "@kodeaman/core";
import type { NormalizedFinding } from "@kodeaman/schema";

const tempDirs: string[] = [];

function makeFinding(overrides: Partial<NormalizedFinding> = {}): NormalizedFinding {
  return {
    schemaVersion: "1.0.0",
    findingId: "finding-1",
    dedupeKey: "dedupe-1",
    source: "semgrep",
    category: "sqli",
    surface: "source-code",
    severity: "high",
    confidence: "high",
    status: "open",
    title: "SQL injection",
    description: "Unsafely concatenated SQL",
    location: { filePath: "src/db.ts", startLine: 12 },
    evidence: [],
    classification: { cwe: ["CWE-89"] },
    raw: { tool: "semgrep" },
    prioritization: {
      baseSeverity: "high",
      adjustedSeverity: "high",
      priorityScore: 80,
      confidenceScore: 90,
      reasons: [],
    },
    coaching: {
      titleEn: "SQL injection",
      titleId: "SQL injection",
      summaryEn: "Unsafe SQL",
      summaryId: "SQL tidak aman",
      whyItMattersEn: "Attackers can access data",
      whyItMattersId: "Penyerang bisa mengakses data",
      remediationEn: ["Use parameterized queries"],
      remediationId: ["Gunakan parameterized queries"],
    },
    gamification: { issueFamily: "injection" },
    detectedAt: "2026-05-16T00:00:00.000Z",
    ...overrides,
  };
}

function makeScanResult(findings: NormalizedFinding[]): ScanResult {
  return {
    findings,
    summary: {
      total: findings.length,
      bySeverity: { info: 0, low: 0, medium: 0, high: findings.length, critical: 0 },
      byCategory: { sqli: findings.length },
      topFindings: findings,
      xpEarned: 0,
      badgesAwarded: [],
    },
    timing: {
      startedAt: "2026-05-16T00:00:00.000Z",
      completedAt: "2026-05-16T00:00:00.125Z",
      durationMs: 125,
      adapterTimings: { semgrep: 125 },
    },
  };
}

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "kodeaman-telemetry-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("TelemetryWriter", () => {
  it("writes scan results as JSON", async () => {
    const outputPath = join(await makeTempDir(), "telemetry", "scan.json");
    const writer = new TelemetryWriter({ outputPath });
    const finding = makeFinding();

    const event = await writer.write(makeScanResult([finding]), { runId: "run-1" });
    const content = JSON.parse(await readFile(outputPath, "utf8"));

    expect(content).toEqual(event);
    expect(content.eventType).toBe("scan-result");
    expect(content.summary).toMatchObject({
      totalFindings: 1,
      scannersUsed: ["semgrep"],
      scanDurationMs: 125,
    });
    expect(content.findings[0].findingId).toBe("finding-1");
    expect(content.metadata).toEqual({ runId: "run-1" });
  });

  it("appends telemetry events as JSONL", async () => {
    const outputPath = join(await makeTempDir(), "scan.jsonl");
    const writer = new TelemetryWriter({ outputPath, format: "jsonl", append: true });

    await writer.write([makeFinding({ findingId: "first", severity: "low" })]);
    await writer.write([makeFinding({ findingId: "second", severity: "critical" })]);

    const lines = (await readFile(outputPath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).findings[0].findingId).toBe("first");
    expect(JSON.parse(lines[1]).findings[0].findingId).toBe("second");
  });

  it("collects finding-array summaries without writing", () => {
    const collector = new TelemetryCollector();
    const event = collector.collect([
      makeFinding({ severity: "low" }),
      makeFinding({ findingId: "finding-2", severity: "critical", source: "npm-audit" }),
    ]);

    expect(event.summary.totalFindings).toBe(2);
    expect(event.summary.bySeverity.low).toBe(1);
    expect(event.summary.bySeverity.critical).toBe(1);
    expect(event.summary.scannersUsed).toEqual(["semgrep", "npm-audit"]);
  });
});
