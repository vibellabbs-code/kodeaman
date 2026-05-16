import { describe, it, expect } from "vitest";
import { Prioritizer } from "../prioritizer.js";
import {
  isAuthRelatedPath,
  isPublicRoute,
  estimateFixEffort,
  detectSensitiveData,
  isInternetExposed,
  isDependencyDirect,
  hasFixAvailable,
} from "../heuristics.js";
import type { NormalizedFinding, RepoContext } from "@kodeaman/schema";

function makeFinding(overrides: Partial<NormalizedFinding> = {}): NormalizedFinding {
  return {
    schemaVersion: "1.0.0",
    findingId: "test-finding-1",
    dedupeKey: "test-dedupe-1",
    source: "semgrep",
    category: "sast",
    surface: "source-code",
    severity: "medium",
    confidence: "high",
    status: "open",
    title: "Test finding",
    description: "A test finding for unit tests",
    location: {
      filePath: "src/app.ts",
      startLine: 10,
      endLine: 10,
    },
    evidence: [],
    classification: {},
    raw: { tool: "semgrep" },
    prioritization: {
      baseSeverity: "medium",
      adjustedSeverity: "medium",
      priorityScore: 0,
      confidenceScore: 60,
      reasons: [],
    },
    coaching: {
      titleEn: "Test",
      titleId: "Test",
      summaryEn: "Test",
      summaryId: "Test",
      whyItMattersEn: "",
      whyItMattersId: "",
      remediationEn: [],
      remediationId: [],
    },
    gamification: { issueFamily: "sast" },
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Prioritizer", () => {
  const prioritizer = new Prioritizer();

  describe("prioritize", () => {
    it("should sort findings by priority score descending", () => {
      const findings = [
        makeFinding({ findingId: "low", severity: "low", confidence: "low" }),
        makeFinding({ findingId: "critical", severity: "critical", confidence: "high" }),
        makeFinding({ findingId: "medium", severity: "medium", confidence: "medium" }),
      ];

      const result = prioritizer.prioritize(findings);

      expect(result[0].findingId).toBe("critical");
      expect(result[result.length - 1].findingId).toBe("low");
    });

    it("should assign higher scores to critical severity", () => {
      const findings = [
        makeFinding({ findingId: "info", severity: "info" }),
        makeFinding({ findingId: "critical", severity: "critical" }),
      ];

      const result = prioritizer.prioritize(findings);

      expect(result[0].prioritization.priorityScore).toBeGreaterThan(
        result[1].prioritization.priorityScore,
      );
    });

    it("should boost score for auth-related paths", () => {
      const authFinding = makeFinding({
        findingId: "auth",
        location: { filePath: "src/middleware/auth/login.ts", startLine: 5, endLine: 5 },
      });
      const normalFinding = makeFinding({
        findingId: "normal",
        location: { filePath: "src/utils/format.ts", startLine: 5, endLine: 5 },
      });

      const result = prioritizer.prioritize([normalFinding, authFinding]);

      const authResult = result.find((f) => f.findingId === "auth")!;
      const normalResult = result.find((f) => f.findingId === "normal")!;

      expect(authResult.prioritization.priorityScore).toBeGreaterThan(
        normalResult.prioritization.priorityScore,
      );
    });

    it("should boost score for internet-exposed paths", () => {
      const exposedFinding = makeFinding({
        findingId: "exposed",
        location: { filePath: "src/api/users/controller.ts", startLine: 10, endLine: 10 },
      });
      const internalFinding = makeFinding({
        findingId: "internal",
        location: { filePath: "src/utils/helpers.ts", startLine: 10, endLine: 10 },
      });

      const result = prioritizer.prioritize([internalFinding, exposedFinding]);

      const exposed = result.find((f) => f.findingId === "exposed")!;
      const internal = result.find((f) => f.findingId === "internal")!;

      expect(exposed.prioritization.priorityScore).toBeGreaterThan(
        internal.prioritization.priorityScore,
      );
    });

    it("should boost score for findings with sensitive data", () => {
      const sensitiveFinding = makeFinding({
        findingId: "sensitive",
        location: {
          filePath: "src/config.ts",
          startLine: 1,
          endLine: 1,
          snippet: 'const password = "secret123"',
        },
      });
      const normalFinding = makeFinding({
        findingId: "normal",
        location: {
          filePath: "src/config.ts",
          startLine: 1,
          endLine: 1,
          snippet: "const x = 42",
        },
      });

      const result = prioritizer.prioritize([normalFinding, sensitiveFinding]);

      const sensitive = result.find((f) => f.findingId === "sensitive")!;
      const normal = result.find((f) => f.findingId === "normal")!;

      expect(sensitive.prioritization.priorityScore).toBeGreaterThan(
        normal.prioritization.priorityScore,
      );
    });

    it("should apply confidence multiplier", () => {
      const highConf = makeFinding({ findingId: "highConf", confidence: "high" });
      const lowConf = makeFinding({ findingId: "lowConf", confidence: "low" });

      const result = prioritizer.prioritize([lowConf, highConf]);

      const highResult = result.find((f) => f.findingId === "highConf")!;
      const lowResult = result.find((f) => f.findingId === "lowConf")!;

      expect(highResult.prioritization.priorityScore).toBeGreaterThan(
        lowResult.prioritization.priorityScore,
      );
    });

    it("should boost score in production environment", () => {
      const findings = [makeFinding()];
      const prodContext: RepoContext = { environment: "production" };
      const devContext: RepoContext = { environment: "staging" };

      const prodResult = prioritizer.prioritize([...findings], prodContext);
      const devResult = prioritizer.prioritize([...findings], devContext);

      expect(prodResult[0].prioritization.priorityScore).toBeGreaterThan(
        devResult[0].prioritization.priorityScore,
      );
    });

    it("should boost score for direct dependencies", () => {
      const directDependency = makeFinding({
        findingId: "direct",
        category: "sca",
        surface: "dependency",
        occurrences: [{ filePath: "package.json", target: "dependencies" }],
      });
      const transitiveDependency = makeFinding({
        findingId: "transitive",
        category: "sca",
        surface: "dependency",
        occurrences: [{ filePath: "package-lock.json", target: "transitive" }],
      });

      const result = prioritizer.prioritize([transitiveDependency, directDependency]);

      const direct = result.find((f) => f.findingId === "direct")!;
      const transitive = result.find((f) => f.findingId === "transitive")!;

      expect(direct.prioritization.priorityScore).toBeGreaterThan(
        transitive.prioritization.priorityScore,
      );
      expect(direct.prioritization.reasons).toContain("Direct dependency: +7");
    });

    it("should boost score for findings with available fixes", () => {
      const fixableFinding = makeFinding({
        findingId: "fixable",
        fixCommands: [
          {
            command: "pnpm audit --fix",
            description: "Apply available fixes",
            descriptionId: "Terapkan perbaikan yang tersedia",
            isBreaking: false,
            packageManager: "pnpm",
          },
        ],
      });
      const manualFinding = makeFinding({ findingId: "manual" });

      const result = prioritizer.prioritize([manualFinding, fixableFinding]);

      const fixable = result.find((f) => f.findingId === "fixable")!;
      const manual = result.find((f) => f.findingId === "manual")!;

      expect(fixable.prioritization.priorityScore).toBeGreaterThan(
        manual.prioritization.priorityScore,
      );
      expect(fixable.prioritization.reasons).toContain("Fix available: +6");
    });

    it("should provide reasons for score adjustments", () => {
      const finding = makeFinding({
        location: {
          filePath: "src/auth/login.ts",
          startLine: 5,
          endLine: 5,
          snippet: 'password = "test"',
        },
      });

      const result = prioritizer.prioritize([finding]);

      expect(result[0].prioritization.reasons.length).toBeGreaterThan(0);
      expect(result[0].prioritization.reasons.some((r) => r.includes("Base severity"))).toBe(true);
    });

    it("should clamp score to 0-100", () => {
      const superHighFinding = makeFinding({
        severity: "critical",
        confidence: "high",
        location: {
          filePath: "src/auth/api/controller.ts",
          startLine: 1,
          endLine: 1,
          snippet: 'const api_key = "sk-123"',
          url: "https://example.com",
        },
      });

      const context: RepoContext = {
        isPublicRepo: true,
        environment: "production",
      };

      const result = prioritizer.prioritize([superHighFinding], context);
      expect(result[0].prioritization.priorityScore).toBeLessThanOrEqual(100);
      expect(result[0].prioritization.priorityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("adjustSeverity", () => {
    it("should upgrade severity for high-confidence auth findings", () => {
      const finding = makeFinding({
        severity: "medium",
        confidence: "high",
        location: { filePath: "src/auth/login.ts", startLine: 1, endLine: 1 },
      });

      const result = prioritizer.prioritize([finding]);
      expect(result[0].prioritization.adjustedSeverity).toBe("high");
    });

    it("should downgrade low-confidence low-severity findings", () => {
      const finding = makeFinding({
        severity: "low",
        confidence: "low",
      });

      const result = prioritizer.prioritize([finding]);
      expect(result[0].prioritization.adjustedSeverity).toBe("info");
    });

    it("should upgrade high to critical in production", () => {
      const finding = makeFinding({ severity: "high" });
      const context: RepoContext = { environment: "production" };

      const result = prioritizer.prioritize([finding], context);
      expect(result[0].prioritization.adjustedSeverity).toBe("critical");
    });
  });
});

describe("heuristics", () => {
  describe("isAuthRelatedPath", () => {
    it("should detect auth paths", () => {
      expect(isAuthRelatedPath("src/auth/login.ts")).toBe(true);
      expect(isAuthRelatedPath("middleware/auth.ts")).toBe(true);
      expect(isAuthRelatedPath("src/password-reset.ts")).toBe(true);
      expect(isAuthRelatedPath("lib/jwt-utils.ts")).toBe(true);
    });

    it("should not flag non-auth paths", () => {
      expect(isAuthRelatedPath("src/utils/format.ts")).toBe(false);
      expect(isAuthRelatedPath("components/Button.tsx")).toBe(false);
    });
  });

  describe("isPublicRoute", () => {
    it("should detect public paths", () => {
      expect(isPublicRoute("public/index.html")).toBe(true);
      expect(isPublicRoute("src/webhook/handler.ts")).toBe(true);
    });

    it("should detect Next.js API routes", () => {
      expect(isPublicRoute("pages/api/users.ts", "nextjs")).toBe(true);
      expect(isPublicRoute("app/api/data/route.ts", "next")).toBe(true);
    });
  });

  describe("estimateFixEffort", () => {
    it("should rate misconfigurations as trivial", () => {
      expect(estimateFixEffort("misconfiguration")).toBe("trivial");
    });

    it("should rate XSS as easy", () => {
      expect(estimateFixEffort("xss")).toBe("easy");
    });

    it("should rate auth issues as hard", () => {
      expect(estimateFixEffort("auth")).toBe("hard");
    });
  });

  describe("detectSensitiveData", () => {
    it("should detect passwords", () => {
      expect(detectSensitiveData('const password = "test"')).toBe(true);
    });

    it("should detect API keys", () => {
      expect(detectSensitiveData("API_KEY=sk-123456")).toBe(true);
    });

    it("should detect Indonesian IDs", () => {
      expect(detectSensitiveData("data.nik = user_input")).toBe(true);
      expect(detectSensitiveData("bpjs_number")).toBe(true);
    });

    it("should not flag normal code", () => {
      expect(detectSensitiveData("const x = 42")).toBe(false);
    });
  });

  describe("isInternetExposed", () => {
    it("should flag URLs as exposed", () => {
      expect(isInternetExposed(undefined, "https://example.com")).toBe(true);
    });

    it("should flag controller files as exposed", () => {
      expect(isInternetExposed("src/controller/users.ts")).toBe(true);
    });

    it("should flag API files as exposed", () => {
      expect(isInternetExposed("src/api/handler.ts")).toBe(true);
    });

    it("should not flag util files", () => {
      expect(isInternetExposed("src/utils/helpers.ts")).toBe(false);
    });
  });

  describe("isDependencyDirect", () => {
    it("should flag dependency findings in manifest dependency sections", () => {
      expect(
        isDependencyDirect({
          category: "sca",
          surface: "dependency",
          occurrences: [{ target: "dependencies" }],
        }),
      ).toBe(true);
    });

    it("should not flag transitive or non-dependency findings", () => {
      expect(
        isDependencyDirect({
          category: "sca",
          surface: "dependency",
          occurrences: [{ target: "transitive" }],
        }),
      ).toBe(false);
      expect(isDependencyDirect({ category: "sast", surface: "source-code" })).toBe(false);
    });
  });

  describe("hasFixAvailable", () => {
    it("should detect command-based fixes", () => {
      expect(hasFixAvailable({ fixCommands: [{}] })).toBe(true);
    });

    it("should detect coaching autofix eligibility", () => {
      expect(hasFixAvailable({ coaching: { autofixEligible: true } })).toBe(true);
    });

    it("should not flag findings without fix paths", () => {
      expect(hasFixAvailable({})).toBe(false);
    });
  });
});
