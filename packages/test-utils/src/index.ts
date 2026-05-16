/**
 * Shared test utilities and fixtures for KodeAman packages.
 */

import type { NormalizedFinding } from "@kodeaman/schema";

/**
 * Create a minimal NormalizedFinding for testing purposes.
 * Override any field by passing partial properties.
 */
export function createMockFinding(
  overrides: Partial<NormalizedFinding> = {},
): NormalizedFinding {
  return {
    schemaVersion: "1.0.0",
    findingId: "test-finding-001",
    dedupeKey: "test-dedup-001",
    source: "semgrep",
    category: "sast",
    surface: "code",
    severity: "medium",
    confidence: "medium",
    status: "open",
    title: "Test Finding",
    description: "A test finding for unit tests.",
    location: {
      filePath: "src/test.ts",
    },
    evidence: [],
    classification: {
      tags: [],
    },
    raw: {
      tool: "semgrep",
      toolRuleId: "test-rule",
    },
    prioritization: {
      baseSeverity: "medium",
      adjustedSeverity: "medium",
      priorityScore: 50,
      confidenceScore: 60,
      reasons: [],
    },
    coaching: {
      titleEn: "Test Finding",
      titleId: "Temuan Uji",
      summaryEn: "A test finding.",
      summaryId: "Temuan uji.",
      whyItMattersEn: "Testing purposes.",
      whyItMattersId: "Untuk tujuan pengujian.",
      remediationEn: ["Fix the issue."],
      remediationId: ["Perbaiki masalah."],
      lessonId: "test-001",
    },
    gamification: {
      issueFamily: "sast",
    },
    detectedAt: new Date().toISOString(),
    ...overrides,
  } as NormalizedFinding;
}

/**
 * Create multiple mock findings with sequential IDs.
 */
export function createMockFindings(
  count: number,
  overrides: Partial<NormalizedFinding> = {},
): NormalizedFinding[] {
  return Array.from({ length: count }, (_, i) =>
    createMockFinding({
      findingId: `test-finding-${String(i + 1).padStart(3, "0")}`,
      dedupeKey: `test-dedup-${String(i + 1).padStart(3, "0")}`,
      ...overrides,
    }),
  );
}
