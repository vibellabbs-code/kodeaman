import type { NormalizedFinding } from "@kodeaman/schema";
import type { CoverageReport, ScannerCoverage } from "./types.js";

export const SCANNER_OWASP_COVERAGE: Record<string, string[]> = {
  semgrep: ["A01", "A02", "A03", "A05", "A07", "A08"],
  "zap-baseline": ["A03", "A05", "A09"],
  "npm-audit": ["A06"],
};

export const SCANNER_SURFACE_COVERAGE: Record<string, string[]> = {
  semgrep: ["source-code"],
  "zap-baseline": ["web-page", "api"],
  "npm-audit": ["dependency"],
};

const OWASP_CATEGORIES: Record<string, string> = {
  A01: "Broken Access Control",
  A02: "Cryptographic Failures",
  A03: "Injection",
  A04: "Insecure Design",
  A05: "Security Misconfiguration",
  A06: "Vulnerable & Outdated Components",
  A07: "Identification & Authentication Failures",
  A08: "Software & Data Integrity Failures",
  A09: "Security Logging & Monitoring Failures",
  A10: "Server-Side Request Forgery",
};

function normalizeScannerName(name: string): string {
  if (name === "zap" || name === "zapBaseline") return "zap-baseline";
  if (name === "npmAudit") return "npm-audit";
  return name;
}

export function buildCoverageReport(
  scannerCoverage: ScannerCoverage[],
  findings: NormalizedFinding[],
  owaspOptions?: { scanMode: "owasp"; scannedCategories: string[] },
): CoverageReport {
  const configured = scannerCoverage.map((scanner) => scanner.scannerName);
  const ran = scannerCoverage
    .filter((scanner) => scanner.status === "ran")
    .map((scanner) => scanner.scannerName);
  const skipped = scannerCoverage
    .filter((scanner) => scanner.status !== "ran")
    .map((scanner) => ({
      name: scanner.scannerName,
      reason: scanner.reason ?? scanner.status,
    }));

  const ranSet = new Set(ran.map(normalizeScannerName));
  const owaspScannedCategorySet = new Set(
    owaspOptions?.scannedCategories.map((category) => category.toUpperCase()) ?? [],
  );
  const findingsByScanner = new Map<string, number>();
  for (const finding of findings) {
    const scanner = normalizeScannerName(finding.source || String(finding.raw?.tool ?? ""));
    findingsByScanner.set(scanner, (findingsByScanner.get(scanner) ?? 0) + 1);
  }

  const owaspCoverage = Object.entries(OWASP_CATEGORIES).map(([categoryId, categoryName]) => {
    const coveredBy = Object.entries(SCANNER_OWASP_COVERAGE)
      .filter(([scanner, categories]) => ranSet.has(scanner) && categories.includes(categoryId))
      .map(([scanner]) => scanner);
    const findingsCount = coveredBy.reduce(
      (sum, scanner) => sum + (findingsByScanner.get(scanner) ?? 0),
      0,
    );

    return {
      categoryId,
      categoryName,
      covered: coveredBy.length > 0 || owaspScannedCategorySet.has(categoryId),
      coveredBy,
      findingsCount,
    };
  });

  const surfaceNames = Array.from(new Set(Object.values(SCANNER_SURFACE_COVERAGE).flat())).sort();
  const scanSurfaces = surfaceNames.map((surface) => {
    const scanners = Object.entries(SCANNER_SURFACE_COVERAGE)
      .filter(([scanner, surfaces]) => ranSet.has(scanner) && surfaces.includes(surface))
      .map(([scanner]) => scanner);

    return {
      surface,
      covered: scanners.length > 0,
      scanners,
    };
  });

  const coveredCategories = owaspCoverage.filter((category) => category.covered).length;
  const overallCoveragePercent = Math.round((coveredCategories / owaspCoverage.length) * 100);

  return {
    scannersConfigured: configured,
    scannersRan: ran,
    scannersSkipped: skipped,
    ...(owaspOptions
      ? {
          scanMode: owaspOptions.scanMode,
          owaspScannedCategories: owaspOptions.scannedCategories,
        }
      : {}),
    owaspCoverage,
    overallCoveragePercent,
    scanSurfaces,
  };
}
