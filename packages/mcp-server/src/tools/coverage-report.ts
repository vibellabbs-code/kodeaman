/**
 * kodeaman_coverage_report — Generate OWASP coverage report.
 *
 * Shows which OWASP Top 10 categories are covered by the configured
 * scanners, which scan surfaces are covered, and the overall coverage %.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NormalizedFinding } from "@kodeaman/schema";
import { buildCoverageReport } from "@kodeaman/core";
import type { ScannerCoverage } from "@kodeaman/core";

export function registerCoverageReportTool(server: McpServer): void {
  server.tool(
    "kodeaman_coverage_report",
    "Generate an OWASP Top 10 coverage report showing which security categories and attack surfaces are covered by the scanners that ran. Provide scanner coverage data and findings from a scan result.",
    {
      scannerCoverage: z
        .string()
        .optional()
        .describe(
          "JSON array of ScannerCoverage objects. If omitted, builds a default report from configured scanners.",
        ),
      findings: z
        .string()
        .optional()
        .describe(
          "JSON array of NormalizedFinding objects to analyze for per-category finding counts.",
        ),
      repoRoot: z
        .string()
        .optional()
        .describe(
          "Project root to load config from. Used when scannerCoverage is not provided.",
        ),
      scanMode: z
        .enum(["standard", "owasp"])
        .optional()
        .describe("Coverage mode. Use 'owasp' when reporting coverage from the OWASP orchestrator."),
      owaspCategories: z
        .string()
        .optional()
        .describe("JSON array of OWASP category codes scanned by the OWASP orchestrator, such as [\"A01\",\"A02\"]."),
    },
    async ({ scannerCoverage, findings, repoRoot, scanMode, owaspCategories }) => {
      try {
        let coverage: ScannerCoverage[];
        let parsedFindings: NormalizedFinding[] = [];

        if (findings) {
          parsedFindings = JSON.parse(findings);
        }

        if (scannerCoverage) {
          coverage = JSON.parse(scannerCoverage);
        } else {
          // Build from config defaults
          const { loadConfig } = await import("@kodeaman/config");
          const config = loadConfig(repoRoot ?? process.cwd());

          coverage = [];
          if (config.scanners.semgrep) {
            coverage.push({
              scannerName: "semgrep",
              status: "ran",
              findingsCount: 0,
              durationMs: 0,
            });
          } else {
            coverage.push({
              scannerName: "semgrep",
              status: "skipped-disabled",
              reason: "Disabled in configuration",
              findingsCount: 0,
              durationMs: 0,
            });
          }

          if (config.scanners.zapBaseline) {
            coverage.push({
              scannerName: "zap-baseline",
              status: "ran",
              findingsCount: 0,
              durationMs: 0,
            });
          } else {
            coverage.push({
              scannerName: "zap-baseline",
              status: "skipped-disabled",
              reason: "Disabled in configuration",
              findingsCount: 0,
              durationMs: 0,
            });
          }

          if (config.scanners.npmAudit) {
            coverage.push({
              scannerName: "npm-audit",
              status: "ran",
              findingsCount: 0,
              durationMs: 0,
            });
          } else {
            coverage.push({
              scannerName: "npm-audit",
              status: "skipped-disabled",
              reason: "Disabled in configuration",
              findingsCount: 0,
              durationMs: 0,
            });
          }
        }

        const parsedOwaspCategories = owaspCategories
          ? (JSON.parse(owaspCategories) as string[])
          : [];
        const report = buildCoverageReport(
          coverage,
          parsedFindings,
          scanMode === "owasp"
            ? { scanMode: "owasp", scannedCategories: parsedOwaspCategories }
            : undefined,
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Coverage report failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
