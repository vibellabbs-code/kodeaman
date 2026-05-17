import { Command } from "commander";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "@kodeaman/config";
import type { NormalizedFinding, SeverityLevel } from "@kodeaman/schema";
import { MarkdownRenderer, CLIRenderer } from "@kodeaman/output-markdown";
import type { ScanResult } from "@kodeaman/output-markdown";
import * as logger from "../utils/logger.js";

const SEVERITY_ORDER: SeverityLevel[] = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
];

function reportPreflightWarnings(
  warnings: string[],
  installInstructions: { title: string; commands: string[]; note: string }[],
): void {
  for (const warning of warnings) {
    logger.warn(warning);
  }

  for (const instructions of installInstructions) {
    logger.info(instructions.title);
    for (const command of instructions.commands) {
      logger.info(`  ${command}`);
    }
    logger.info(`  ${instructions.note}`);
  }
}

function severityAtOrAbove(
  finding: SeverityLevel,
  threshold: SeverityLevel,
): boolean {
  return (
    SEVERITY_ORDER.indexOf(finding) >= SEVERITY_ORDER.indexOf(threshold)
  );
}

interface ScanOptions {
  config?: string;
  format: string;
  input?: string;
  language?: "en" | "id";
  preset?: string;
  verbose: boolean;
}

export function createScanCommand(): Command {
  const cmd = new Command("scan")
    .description("Scan repository for security issues")
    .option("-c, --config <path>", "Path to config file")
    .option(
      "-f, --format <format>",
      "Output format (markdown|json|sarif)",
      "markdown",
    )
    .option(
      "-i, --input <file>",
      "Pre-existing scanner output file (semgrep JSON or ZAP JSON)",
    )
    .option("-l, --language <lang>", "Language (en|id)")
    .option(
      "-p, --preset <preset>",
      "Preset (laravel|node-express|wordpress)",
    )
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: ScanOptions) => {
      logger.setVerbose(opts.verbose);

      try {
        const repoRoot = process.cwd();
        logger.debug(`Scanning repository at ${repoRoot}`);

        const config = loadConfig(opts.config || repoRoot);
        if (opts.language) {
          config.language = opts.language;
        }

        logger.info(
          config.language === "id"
            ? "Memulai pemindaian keamanan..."
            : "Starting security scan...",
        );

        const { preflightCheck } = await import("@kodeaman/owasp");
        const preflight = preflightCheck(config.language);
        if (preflight.warnings.length > 0) {
          reportPreflightWarnings(preflight.warnings, preflight.installInstructions);
        }

        let findings: NormalizedFinding[] = [];
        let coverageReport: import("@kodeaman/core").CoverageReport | undefined;

        if (opts.input) {
          logger.debug(`Reading input file: ${opts.input}`);
          const inputPath = resolve(repoRoot, opts.input);
          const raw = readFileSync(inputPath, "utf-8");
          const parsed = JSON.parse(raw);

          if (Array.isArray(parsed)) {
            findings = parsed as NormalizedFinding[];
          } else if (parsed.findings) {
            findings = parsed.findings as NormalizedFinding[];
          } else if (parsed.results) {
            findings = parsed.results as NormalizedFinding[];
          }

          logger.info(
            `Loaded ${findings.length} findings from input file`,
          );
        } else {
          // Dynamic pipeline: import core and register adapters
          try {
            const { ScanPipeline } = await import("@kodeaman/core");
            const pipeline = new ScanPipeline(config as never);

            if (config.scanners.semgrep) {
              const { SemgrepAdapter } = await import(
                "@kodeaman/adapters-semgrep"
              );
              pipeline.registerAdapter(new SemgrepAdapter() as never);
            }

            if (config.scanners.zapBaseline) {
              const { ZapBaselineAdapter } = await import("@kodeaman/adapters-zap");
              pipeline.registerAdapter(new ZapBaselineAdapter() as never);
            }

            if (config.scanners.playwright) {
              const { PlaywrightAdapter } = await import("@kodeaman/adapters-playwright");
              pipeline.registerAdapter(new PlaywrightAdapter() as never);
            }

            if (config.customRules) {
              const { CustomRuleScanner } = await import("@kodeaman/custom-rules");
              pipeline.registerAdapter(new CustomRuleScanner() as never);
            }

            const pipelineResult = await pipeline.run({
              repoRoot,
              provider: "local",
              config,
            } as never);
            findings = pipelineResult.findings;
            coverageReport = pipelineResult.coverageReport;
          } catch (err) {
            logger.error(
              "Failed to run pipeline. Make sure scanners are installed.",
            );
            logger.debug(String(err));
            process.exit(1);
          }
        }

        const bySeverity: Record<SeverityLevel, number> = {
          info: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        };
        for (const f of findings) {
          bySeverity[f.severity]++;
        }

        const scannersUsed = [...new Set(findings.map((f) => f.source))];
        const result: ScanResult = {
          findings,
          summary: {
            totalFindings: findings.length,
            bySeverity,
            scanDurationMs: 0,
            scannersUsed,
          },
        };

        const { ScanHistoryStore } = await import("@kodeaman/history");
        await new ScanHistoryStore().append({
          timestamp: new Date().toISOString(),
          projectPath: repoRoot,
          scanMode: coverageReport?.scanMode ?? "standard",
          findingsCount: findings.length,
          bySeverity,
          byCategory: findings.reduce<Record<string, number>>((counts, finding) => {
            counts[finding.category] = (counts[finding.category] ?? 0) + 1;
            return counts;
          }, {}),
          topFindings: [...findings]
            .sort((a, b) => b.prioritization.priorityScore - a.prioritization.priorityScore)
            .slice(0, 3)
            .map((finding) => ({
              title: finding.title,
              severity: finding.severity,
              priorityScore: finding.prioritization.priorityScore,
            })),
          scannersUsed,
          coveragePercent: coverageReport?.overallCoveragePercent ?? 0,
        });

        if (coverageReport && (opts.verbose || coverageReport.overallCoveragePercent < 100)) {
          const cliRenderer = new CLIRenderer();
          console.log(cliRenderer.renderCoverageReport(coverageReport, config.language));
        }

        switch (opts.format) {
          case "json":
            console.log(JSON.stringify(result, null, 2));
            break;
          case "markdown": {
            const mdRenderer = new MarkdownRenderer();
            console.log(mdRenderer.renderPRComment(result, config));
            break;
          }
          case "sarif": {
            const { SarifConverter } = await import("@kodeaman/output-sarif");
            const converter = new SarifConverter();
            console.log(JSON.stringify(converter.convert(findings), null, 2));
            break;
          }
          default: {
            const cliRenderer = new CLIRenderer();
            console.log(cliRenderer.renderConsole(result, config));
            break;
          }
        }

        // Exit code 1 if findings exceed failOnSeverity threshold
        const hasExceedingFindings = findings.some((f) =>
          severityAtOrAbove(f.severity, config.prioritization.failOnSeverity),
        );

        if (hasExceedingFindings) {
          logger.warn(
            `Findings at or above ${config.prioritization.failOnSeverity} severity detected`,
          );
          process.exit(1);
        }

        logger.success(
          config.language === "id"
            ? "Pemindaian selesai."
            : "Scan complete.",
        );
      } catch (err) {
        logger.error(String(err));
        process.exit(1);
      }
    });

  return cmd;
}
