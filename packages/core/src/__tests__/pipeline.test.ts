import { describe, it, expect } from "vitest";
import type { NormalizedFinding } from "@kodeaman/schema";
import { ScanPipeline } from "../pipeline.js";
import type { ScannerAdapter, ScanContext } from "../types.js";

function makeFinding(overrides: Partial<NormalizedFinding>): NormalizedFinding {
  return {
    schemaVersion: "1.0.0",
    findingId: "test:rule:abc123",
    dedupeKey: "rule|file.ts|10|CWE-79",
    source: "semgrep",
    category: "xss",
    surface: "source-code",
    severity: "medium",
    confidence: "high",
    status: "open",
    title: "Test finding",
    description: "A test finding for unit tests.",
    location: {
      filePath: "file.ts",
      startLine: 10,
    },
    evidence: [],
    classification: {
      cwe: ["CWE-79"],
    },
    raw: {
      tool: "semgrep",
      toolRuleId: "test.rule",
    },
    prioritization: {
      baseSeverity: "medium",
      adjustedSeverity: "medium",
      priorityScore: 50,
      confidenceScore: 80,
      reasons: ["Test reason"],
    },
    coaching: {
      titleEn: "Fix this",
      titleId: "Perbaiki ini",
      summaryEn: "Summary",
      summaryId: "Ringkasan",
      whyItMattersEn: "It matters",
      whyItMattersId: "Ini penting",
      remediationEn: ["Fix it"],
      remediationId: ["Perbaiki"],
    },
    gamification: {
      issueFamily: "xss",
    },
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockAdapter(
  name: string,
  findings: NormalizedFinding[]
): ScannerAdapter {
  return {
    name,
    scan: async (_context: ScanContext) => findings,
  };
}

const defaultContext: ScanContext = {
  repoRoot: "/tmp/test-repo",
  branch: "main",
  commitSha: "abc123",
};

describe("ScanPipeline", () => {
  it("should run with no adapters and return empty results", async () => {
    const pipeline = new ScanPipeline();
    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.xpEarned).toBe(0);
    expect(result.summary.badgesAwarded).toHaveLength(0);
    expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should collect findings from a single adapter", async () => {
    const pipeline = new ScanPipeline();
    const finding = makeFinding({
      findingId: "semgrep:xss:001",
      title: "XSS via innerHTML",
    });

    pipeline.registerAdapter(createMockAdapter("semgrep", [finding]));

    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].title).toBe("XSS via innerHTML");
    expect(result.summary.total).toBe(1);
    expect(result.summary.bySeverity.medium).toBe(1);
    expect(result.timing.adapterTimings["semgrep"]).toBeDefined();
  });

  it("should collect findings from multiple adapters", async () => {
    const pipeline = new ScanPipeline();
    const finding1 = makeFinding({
      findingId: "semgrep:xss:001",
      dedupeKey: "xss|file1.ts|10|CWE-79",
    });
    const finding2 = makeFinding({
      findingId: "zap:xss:002",
      dedupeKey: "xss|file2.ts|20|CWE-79",
      source: "zap-baseline",
      surface: "web-page",
      raw: { tool: "zap-baseline" },
    });

    pipeline.registerAdapter(createMockAdapter("semgrep", [finding1]));
    pipeline.registerAdapter(createMockAdapter("zap", [finding2]));

    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(2);
    expect(result.timing.adapterTimings["semgrep"]).toBeDefined();
    expect(result.timing.adapterTimings["zap"]).toBeDefined();
  });

  it("should deduplicate findings with the same dedupeKey", async () => {
    const pipeline = new ScanPipeline();
    const sharedDedupeKey = "rule|file.ts|10|CWE-79";
    const finding1 = makeFinding({
      findingId: "semgrep:xss:001",
      dedupeKey: sharedDedupeKey,
      prioritization: {
        baseSeverity: "medium",
        adjustedSeverity: "medium",
        priorityScore: 40,
        confidenceScore: 70,
        reasons: ["Lower priority"],
      },
    });
    const finding2 = makeFinding({
      findingId: "semgrep:xss:002",
      dedupeKey: sharedDedupeKey,
      prioritization: {
        baseSeverity: "medium",
        adjustedSeverity: "high",
        priorityScore: 80,
        confidenceScore: 90,
        reasons: ["Higher priority"],
      },
    });

    pipeline.registerAdapter(
      createMockAdapter("semgrep", [finding1, finding2])
    );

    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].prioritization.priorityScore).toBeGreaterThan(0);
    expect(result.findings[0].occurrences).toEqual([
      { filePath: "file.ts" },
    ]);
  });

  it("should preserve cross-workspace occurrences when dedupe keys match", async () => {
    const pipeline = new ScanPipeline();
    const sharedDedupeKey = "npm-audit|next|CVE-123";
    const adminFinding = makeFinding({
      findingId: "npm-audit:next:admin",
      dedupeKey: sharedDedupeKey,
      source: "npm-audit",
      category: "sca",
      surface: "dependency",
      location: {
        filePath: "package.json",
        component: "admin",
      },
      repoContext: { repoFullName: "/repo" },
    });
    const frontendFinding = makeFinding({
      findingId: "npm-audit:next:frontend",
      dedupeKey: sharedDedupeKey,
      source: "npm-audit",
      category: "sca",
      surface: "dependency",
      location: {
        filePath: "package.json",
        component: "frontend",
      },
      repoContext: { repoFullName: "/repo" },
    });

    pipeline.registerAdapter(
      createMockAdapter("npm-audit", [adminFinding, frontendFinding])
    );

    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].occurrences).toEqual([
      { filePath: "package.json", target: "admin", repoRoot: "/repo" },
      { filePath: "package.json", target: "frontend", repoRoot: "/repo" },
    ]);
  });

  it("should compute priority scores and sort findings by priority descending", async () => {
    const pipeline = new ScanPipeline();
    const low = makeFinding({
      findingId: "a",
      dedupeKey: "a|f|1|CWE-1",
      severity: "low",
      confidence: "high",
      prioritization: {
        baseSeverity: "low",
        adjustedSeverity: "low",
        priorityScore: 0,
        confidenceScore: 60,
        reasons: [],
      },
    });
    const high = makeFinding({
      findingId: "b",
      dedupeKey: "b|f|2|CWE-2",
      severity: "high",
      confidence: "high",
      prioritization: {
        baseSeverity: "high",
        adjustedSeverity: "high",
        priorityScore: 0,
        confidenceScore: 95,
        reasons: [],
      },
    });
    const mid = makeFinding({
      findingId: "c",
      dedupeKey: "c|f|3|CWE-3",
      severity: "medium",
      confidence: "high",
      prioritization: {
        baseSeverity: "medium",
        adjustedSeverity: "medium",
        priorityScore: 0,
        confidenceScore: 80,
        reasons: [],
      },
    });

    pipeline.registerAdapter(createMockAdapter("semgrep", [low, high, mid]));

    const result = await pipeline.run(defaultContext);

    expect(result.findings.map((finding) => finding.findingId)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(result.findings.every((finding) => finding.prioritization.priorityScore > 0)).toBe(true);
  });

  it("should include top 3 findings in summary", async () => {
    const pipeline = new ScanPipeline();
    const findings = Array.from({ length: 5 }, (_, i) =>
      makeFinding({
        findingId: `f${i}`,
        dedupeKey: `rule|file${i}.ts|${i}|CWE-${i}`,
        prioritization: {
          baseSeverity: "medium",
          adjustedSeverity: "medium",
          priorityScore: (i + 1) * 15,
          confidenceScore: 80,
          reasons: [],
        },
      })
    );

    pipeline.registerAdapter(createMockAdapter("semgrep", findings));

    const result = await pipeline.run(defaultContext);

    expect(result.summary.topFindings).toHaveLength(3);
    expect(result.summary.topFindings[0].prioritization.priorityScore).toBeGreaterThan(0);
  });

  it("should skip disabled adapters via config", async () => {
    const pipeline = new ScanPipeline({
      scanners: { semgrep: true, zap: false },
    });

    const finding1 = makeFinding({
      findingId: "semgrep:1",
      dedupeKey: "semgrep|f|1|C",
    });
    const finding2 = makeFinding({
      findingId: "zap:1",
      dedupeKey: "zap|f|2|C",
    });

    pipeline.registerAdapter(createMockAdapter("semgrep", [finding1]));
    pipeline.registerAdapter(createMockAdapter("zap", [finding2]));

    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].findingId).toBe("semgrep:1");
    expect(result.timing.adapterTimings["zap"]).toBeUndefined();
  });

  it("should aggregate gamification data in summary", async () => {
    const pipeline = new ScanPipeline();
    const findings = [
      makeFinding({
        findingId: "f1",
        dedupeKey: "f1|f|1|C",
        gamification: {
          issueFamily: "xss",
          xpReward: 10,
          badgeKey: "xss-hunter",
        },
      }),
      makeFinding({
        findingId: "f2",
        dedupeKey: "f2|f|2|C",
        gamification: {
          issueFamily: "sqli",
          xpReward: 15,
          badgeKey: "sqli-slayer",
        },
      }),
    ];

    pipeline.registerAdapter(createMockAdapter("semgrep", findings));

    const result = await pipeline.run(defaultContext);

    expect(result.summary.xpEarned).toBe(25);
    expect(result.summary.badgesAwarded).toContain("xss-hunter");
    expect(result.summary.badgesAwarded).toContain("sqli-slayer");
  });

  it("should report timing information", async () => {
    const pipeline = new ScanPipeline();
    pipeline.registerAdapter(createMockAdapter("semgrep", []));

    const result = await pipeline.run(defaultContext);

    expect(result.timing.startedAt).toBeTruthy();
    expect(result.timing.completedAt).toBeTruthy();
    expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.timing.adapterTimings["semgrep"]).toBeGreaterThanOrEqual(0);
  });
});
