import { describe, it, expect } from "vitest";
import { NpmAuditAdapter } from "../adapter.js";
import {
  mapSeverity,
  mapConfidence,
  extractCweIds,
  extractCveIds,
  getAdvisoryTitle,
  generateDedupeKey,
  generateFindingId,
} from "../mapper.js";
import type { NpmAuditResult, NpmVulnerability } from "../types.js";
import auditFixture from "./fixtures/npm-audit-output.json" with { type: "json" };

describe("NpmAuditAdapter", () => {
  const adapter = new NpmAuditAdapter();

  describe("parseAuditOutput", () => {
    it("should parse vulnerabilities with direct via details only", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);

      // transitive-dep has only string via ("lodash"), no NpmVulnerabilityVia objects
      expect(findings).toHaveLength(4);
      expect(findings.every((f) => f.schemaVersion === "1.0.0")).toBe(true);
      expect(findings.every((f) => f.status === "open")).toBe(true);
    });

    it("should correctly map critical lodash vulnerability", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const lodash = findings.find((f) => f.location.component === "lodash");

      expect(lodash).toBeDefined();
      expect(lodash!.severity).toBe("critical");
      expect(lodash!.confidence).toBe("high");
      expect(lodash!.title).toContain("Prototype Pollution");
      expect(lodash!.title).toContain("lodash");
      expect(lodash!.classification.cwe).toContain("CWE-1321");
      expect(lodash!.classification.owasp).toContain("A06:2021");
      expect(lodash!.surface).toBe("dependency");
      expect(lodash!.category).toBe("sca");
    });

    it("should correctly map high severity axios vulnerability", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const axios = findings.find((f) => f.location.component === "axios");

      expect(axios).toBeDefined();
      expect(axios!.severity).toBe("high");
      expect(axios!.confidence).toBe("high");
      expect(axios!.title).toContain("Server-Side Request Forgery");
      expect(axios!.classification.cwe).toContain("CWE-918");
    });

    it("should include fix information in evidence", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const lodash = findings.find((f) => f.location.component === "lodash");

      expect(lodash!.evidence).toHaveLength(1);
      expect(lodash!.evidence[0].type).toBe("scanner-message");
      expect(lodash!.evidence[0].content).toContain("lodash@4.17.21");
    });

    it("should mark breaking changes in evidence for major version upgrades", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const axios = findings.find((f) => f.location.component === "axios");

      expect(axios!.evidence[0].content).toContain("BREAKING");
    });

    it("should tag direct vs transitive dependencies", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const lodash = findings.find((f) => f.location.component === "lodash");
      const debug = findings.find((f) => f.location.component === "debug");

      expect(lodash!.classification.tags).toContain("direct");
      expect(debug!.classification.tags).toContain("transitive");
    });

    it("should generate unique finding IDs", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const ids = findings.map((f) => f.findingId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should generate unique dedupe keys", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      const keys = findings.map((f) => f.dedupeKey);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("should populate coaching content with bilingual text", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult);
      for (const finding of findings) {
        expect(finding.coaching.titleEn).toBeTruthy();
        expect(finding.coaching.titleId).toBeTruthy();
        expect(finding.coaching.summaryEn).toBeTruthy();
        expect(finding.coaching.summaryId).toBeTruthy();
        expect(finding.coaching.whyItMattersEn).toBeTruthy();
        expect(finding.coaching.whyItMattersId).toBeTruthy();
        expect(finding.coaching.remediationEn.length).toBeGreaterThan(0);
        expect(finding.coaching.remediationId.length).toBeGreaterThan(0);
      }
    });

    it("should generate npm audit fix commands for non-breaking fixes", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult, undefined, {
        packageManager: "npm",
        targetPath: "/repo/admin",
      });
      const lodash = findings.find((f) => f.location.component === "lodash");

      expect(lodash!.fixCommands).toEqual([
        {
          command: "npm audit fix",
          cwd: "/repo/admin",
          description: "Apply available non-breaking audit fixes",
          descriptionId: "Terapkan perbaikan audit tanpa breaking change yang tersedia",
          isBreaking: false,
          packageManager: "npm",
        },
      ]);
    });

    it("should generate direct npm install commands for breaking fixes", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult, undefined, {
        packageManager: "npm",
        targetPath: "/repo/frontend",
      });
      const axios = findings.find((f) => f.location.component === "axios");

      expect(axios!.fixCommands?.[0]).toMatchObject({
        command: "npm install axios@1.6.0",
        cwd: "/repo/frontend",
        isBreaking: true,
        packageManager: "npm",
      });
    });

    it("should generate pnpm fix commands from scan context", () => {
      const findings = adapter.parseAuditOutput(auditFixture as NpmAuditResult, undefined, {
        packageManager: "pnpm",
        targetPath: "/repo/frontend",
      });
      const axios = findings.find((f) => f.location.component === "axios");
      const lodash = findings.find((f) => f.location.component === "lodash");

      expect(lodash!.fixCommands?.[0].command).toBe("pnpm audit --fix");
      expect(axios!.fixCommands?.[0]).toMatchObject({
        command: "pnpm update axios@1.6.0",
        packageManager: "pnpm",
        isBreaking: true,
      });
    });

    it("should describe transitive fixes using vulnerable and parent package names", () => {
      const auditResult: NpmAuditResult = {
        auditReportVersion: 2,
        vulnerabilities: {
          postcss: {
            name: "postcss",
            severity: "moderate",
            isDirect: false,
            via: [{
              source: 1,
              name: "postcss",
              dependency: "postcss",
              title: "PostCSS line return parsing error",
              url: "https://example.com/postcss",
              severity: "moderate",
              cwe: [],
              cvss: { score: 5.0 },
              range: "<8.4.31",
            }],
            effects: ["next"],
            range: "<8.4.31",
            nodes: ["node_modules/postcss"],
            fixAvailable: {
              name: "next",
              version: "16.2.6",
              isSemVerMajor: true,
            },
          },
        },
        metadata: {
          vulnerabilities: { info: 0, low: 0, moderate: 1, high: 0, critical: 0, total: 1 },
          dependencies: { prod: 1, dev: 0, optional: 0, peer: 0, peerOptional: 0, total: 1 },
        },
      };

      const [finding] = adapter.parseAuditOutput(auditResult);

      expect(finding.coaching.remediationEn[0]).toBe("Update postcss by upgrading its parent dependency next to version 16.2.6");
      expect(finding.coaching.remediationId[0]).toBe("Perbarui postcss dengan meng-upgrade dependensi induknya next ke versi 16.2.6");
      expect(finding.fixCommands?.[0].description).toBe("Fix postcss vulnerability by upgrading next to 16.2.6; review breaking changes");
      expect(finding.fixCommands?.[0].descriptionId).toBe("Perbaiki kerentanan postcss dengan meng-upgrade next ke 16.2.6; tinjau breaking change");
    });
  });
});

describe("mapper functions", () => {
  describe("mapSeverity", () => {
    it("should map critical to critical", () => {
      expect(mapSeverity("critical")).toBe("critical");
    });

    it("should map high to high", () => {
      expect(mapSeverity("high")).toBe("high");
    });

    it("should map moderate to medium", () => {
      expect(mapSeverity("moderate")).toBe("medium");
    });

    it("should map low to low", () => {
      expect(mapSeverity("low")).toBe("low");
    });

    it("should map info to info", () => {
      expect(mapSeverity("info")).toBe("info");
    });

    it("should map unknown to info", () => {
      expect(mapSeverity("unknown")).toBe("info");
    });
  });

  describe("mapConfidence", () => {
    it("should return high for CVSS >= 7", () => {
      const vuln: NpmVulnerability = {
        name: "test",
        severity: "high",
        isDirect: true,
        via: [{ source: 1, name: "test", dependency: "test", title: "t", url: "", severity: "high", cwe: [], cvss: { score: 9.0 }, range: "*" }],
        effects: [],
        range: "*",
        nodes: [],
        fixAvailable: false,
      };
      expect(mapConfidence(vuln)).toBe("high");
    });

    it("should return medium for CVSS >= 4", () => {
      const vuln: NpmVulnerability = {
        name: "test",
        severity: "moderate",
        isDirect: true,
        via: [{ source: 1, name: "test", dependency: "test", title: "t", url: "", severity: "moderate", cwe: [], cvss: { score: 5.0 }, range: "*" }],
        effects: [],
        range: "*",
        nodes: [],
        fixAvailable: false,
      };
      expect(mapConfidence(vuln)).toBe("medium");
    });

    it("should return low for CVSS < 4", () => {
      const vuln: NpmVulnerability = {
        name: "test",
        severity: "low",
        isDirect: true,
        via: [{ source: 1, name: "test", dependency: "test", title: "t", url: "", severity: "low", cwe: [], cvss: { score: 2.0 }, range: "*" }],
        effects: [],
        range: "*",
        nodes: [],
        fixAvailable: false,
      };
      expect(mapConfidence(vuln)).toBe("low");
    });
  });

  describe("extractCweIds", () => {
    it("should extract CWE IDs from via details", () => {
      const vuln = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      const cwes = extractCweIds(vuln);
      expect(cwes).toContain("CWE-1321");
    });

    it("should return empty array for string-only via", () => {
      const vuln = auditFixture.vulnerabilities["transitive-dep"] as unknown as NpmVulnerability;
      const cwes = extractCweIds(vuln);
      expect(cwes).toHaveLength(0);
    });
  });

  describe("extractCveIds", () => {
    it("should return empty when no CVE in URL", () => {
      const vuln = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      const cves = extractCveIds(vuln);
      expect(cves).toHaveLength(0);
    });
  });

  describe("getAdvisoryTitle", () => {
    it("should return title from via details", () => {
      const vuln = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      expect(getAdvisoryTitle(vuln)).toBe("Prototype Pollution");
    });

    it("should fallback to package name for string-only via", () => {
      const vuln = auditFixture.vulnerabilities["transitive-dep"] as unknown as NpmVulnerability;
      expect(getAdvisoryTitle(vuln)).toContain("transitive-dep");
    });
  });

  describe("generateDedupeKey", () => {
    it("should produce consistent keys for same input", () => {
      const vuln = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      expect(generateDedupeKey("lodash", vuln)).toBe(generateDedupeKey("lodash", vuln));
    });

    it("should produce different keys for different packages", () => {
      const lodash = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      const axios = auditFixture.vulnerabilities.axios as unknown as NpmVulnerability;
      expect(generateDedupeKey("lodash", lodash)).not.toBe(generateDedupeKey("axios", axios));
    });
  });

  describe("generateFindingId", () => {
    it("should produce consistent IDs for same input", () => {
      const vuln = auditFixture.vulnerabilities.lodash as unknown as NpmVulnerability;
      expect(generateFindingId("lodash", vuln)).toBe(generateFindingId("lodash", vuln));
    });
  });
});
