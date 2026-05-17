import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { loadConfig } from "@kodeaman/config";
import type { SeverityLevel, ConfidenceLevel } from "@kodeaman/schema";
import * as logger from "../utils/logger.js";

const SEVERITY_ORDER: SeverityLevel[] = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
];

function severityAtOrAbove(
  finding: SeverityLevel,
  threshold: SeverityLevel,
): boolean {
  return (
    SEVERITY_ORDER.indexOf(finding) >= SEVERITY_ORDER.indexOf(threshold)
  );
}

const BANNER = `
  _  __          _         _
 | |/ /___   __| | ___   / \\   _ __ ___   __ _ _ __
 | ' // _ \\ / _\` |/ _ \\ / _ \\ | '_ \` _ \\ / _\` | '_ \\
 | . \\ (_) | (_| |  __// ___ \\| | | | | | (_| | | | |
 |_|\\_\\___/ \\__,_|\\___/_/   \\_\\_| |_| |_|\\__,_|_| |_|

  OWASP Top 10 Security Scanner
`;

interface OwaspScanOptions {
  config?: string;
  format: string;
  language?: "en" | "id";
  preset?: string;
  output?: string;
  parallel: boolean;
  categories?: string;
  confidence?: string;
  noEvidenceGate: boolean;
  skipWslCheck: boolean;
  yes: boolean;
  verbose: boolean;
}

async function confirmWSLGuidance(locale: "en" | "id", assumeYes: boolean): Promise<boolean> {
  if (assumeYes) return true;
  if (!process.stdin.isTTY) return false;

  const question = locale === "id"
    ? "WSL/Linux tidak terdeteksi. Tampilkan panduan instalasi WSL untuk pemindaian lebih detail? [y/N] "
    : "WSL/Linux was not detected. Show WSL installation guidance for deeper scans? [y/N] ";

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(question);
    return /^(y|yes|ya)$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

function hasWebFindingEvidence(finding: { location: { url?: string }; evidence: { type: string }[] }): boolean {
  if (!finding.location.url) return true;
  return finding.evidence.some((evidence) =>
    evidence.type === "html-report" || evidence.type === "terminal-snapshot" || evidence.type === "http-request" || evidence.type === "http-response",
  );
}

export function createOwaspScanCommand(): Command {
  const cmd = new Command("owasp-scan")
    .description(
      "Run OWASP Top 10 security scan with evidence reports / " +
        "Jalankan pemindaian keamanan OWASP Top 10 dengan laporan bukti",
    )
    .option("-c, --config <path>", "Path to config file")
    .option(
      "-f, --format <format>",
      "Output format (html|markdown|json|sarif)",
      "html",
    )
    .option("-l, --language <lang>", "Language (en|id)")
    .option(
      "-p, --preset <preset>",
      "Preset (laravel|node-express|wordpress)",
    )
    .option("-o, --output <file>", "Output file path")
    .option("--parallel", "Run OWASP category scans in parallel", false)
    .option(
      "--categories <list>",
      "Comma-separated OWASP categories to scan (e.g. A01,A03,A06)",
    )
    .option(
      "--confidence <level>",
      "Minimum confidence gate (low|medium|high)",
    )
    .option(
      "--no-evidence-gate",
      "Disable evidence gate (include findings without evidence)",
    )
    .option("--skip-wsl-check", "Skip WSL availability check on Windows", false)
    .option("-y, --yes", "Answer yes to non-destructive setup guidance prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: OwaspScanOptions) => {
      logger.setVerbose(opts.verbose);

      try {
        // Step 1: Show banner
        console.log(BANNER);

        const repoRoot = process.cwd();
        const config = loadConfig(opts.config || repoRoot);
        if (opts.language) {
          config.language = opts.language;
        }

        const locale = config.language;

        // Step 2: Detect environment
        const { detectEnvironment, checkWSLAvailability, getWSLInstallInstructions, preflightCheck } =
          await import("@kodeaman/owasp");
        const { OwaspProgressReporter } = await import("@kodeaman/owasp");

        const env = detectEnvironment();
        const progress = new OwaspProgressReporter(locale, (msg) => logger.info(msg));

        logger.info(
          locale === "id"
            ? `Platform: ${env.platform} | Node: ${env.nodeVersion}`
            : `Platform: ${env.platform} | Node: ${env.nodeVersion}`,
        );

        // Step 2b: Report scanner status and actionable install guidance
        progress.reportScannerStatus(env.scanners);
        const preflight = preflightCheck(locale, env);
        for (const warning of preflight.warnings) {
          logger.warn(warning);
        }
        for (const instructions of preflight.installInstructions) {
          logger.info(instructions.title);
          for (const command of instructions.commands) {
            logger.info(`  ${command}`);
          }
          logger.info(`  ${instructions.note}`);
        }

        // Step 3: Windows WSL check
        if (
          env.platform === "windows" &&
          !opts.skipWslCheck &&
          !config.environment?.skipWslCheck
        ) {
          const wsl = checkWSLAvailability();
          if (!wsl.available) {
            const missingLinux = env.scanners
              .filter((s) => !s.available && s.name !== "docker")
              .map((s) => s.name);

            if (missingLinux.length > 0) {
              progress.reportWSLRequired(missingLinux);
            }

            if (await confirmWSLGuidance(locale, opts.yes)) {
              const instructions = getWSLInstallInstructions(locale);
              console.log(`\n${instructions.title}`);
              console.log("─".repeat(40));
              for (let i = 0; i < instructions.steps.length; i++) {
                console.log(`  ${i + 1}. ${instructions.steps[i]}`);
              }
              console.log(`\n${instructions.note}`);
              console.log("");
            } else {
              logger.warn(
                locale === "id"
                  ? "Panduan WSL dilewati. Pemindaian tetap berjalan dengan scanner yang tersedia, tetapi hasilnya mungkin kurang lengkap."
                  : "WSL guidance skipped. The scan will continue with available scanners, but coverage may be less complete.",
              );
            }
          }
        }

        // Step 4: Load config + preset
        const owaspConfig = config.owasp ?? {
          enabled: true,
          categories: ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10"],
          parallel: false,
          confidenceGate: "low" as ConfidenceLevel,
          evidenceGate: true,
          failOnSeverity: "high" as SeverityLevel,
        };

        // Apply CLI overrides
        const categories = opts.categories
          ? opts.categories.split(",").map((c) => c.trim().toUpperCase())
          : owaspConfig.categories;
        const parallel = opts.parallel || owaspConfig.parallel;
        const confidenceGate = (opts.confidence as ConfidenceLevel) ?? owaspConfig.confidenceGate;
        const evidenceGate = opts.noEvidenceGate ? false : owaspConfig.evidenceGate;
        const failOnSeverity = owaspConfig.failOnSeverity;

        // Step 5: Create pipeline and orchestrator
        const { ScanPipeline } = await import("@kodeaman/core");
        const pipeline = new ScanPipeline(config as never);

        // Register adapters based on config
        if (config.scanners.semgrep) {
          try {
            const { SemgrepAdapter } = await import("@kodeaman/adapters-semgrep");
            pipeline.registerAdapter(new SemgrepAdapter() as never);
            logger.debug("Registered Semgrep adapter");
          } catch {
            logger.debug("Semgrep adapter not available");
          }
        }

        if (config.scanners.zapBaseline) {
          try {
            const { ZapBaselineAdapter } = await import("@kodeaman/adapters-zap");
            pipeline.registerAdapter(new ZapBaselineAdapter() as never);
            logger.debug("Registered ZAP baseline adapter");
          } catch {
            logger.debug("ZAP adapter not available");
          }
        }

        if (config.scanners.npmAudit) {
          try {
            const { NpmAuditAdapter } = await import("@kodeaman/adapters-npm-audit");
            pipeline.registerAdapter(new NpmAuditAdapter() as never);
            logger.debug("Registered npm-audit adapter");
          } catch {
            logger.debug("npm-audit adapter not available");
          }
        }

        if (config.scanners.playwright) {
          try {
            const { PlaywrightAdapter } = await import("@kodeaman/adapters-playwright");
            pipeline.registerAdapter(new PlaywrightAdapter() as never);
            logger.debug("Registered Playwright adapter");
          } catch {
            logger.debug("Playwright adapter not available");
          }
        }

        const { OwaspScanOrchestrator } = await import("@kodeaman/owasp");
        const orchestrator = new OwaspScanOrchestrator(pipeline, config);

        // Step 6: Run scan with progress callbacks
        logger.info(
          locale === "id"
            ? "Memulai pemindaian OWASP Top 10..."
            : "Starting OWASP Top 10 scan...",
        );
        console.log("");

        const scanResult = await orchestrator.scan(
          {
            repoRoot,
            provider: "local",
          },
          {
            parallel,
            categories: categories as never,
            confidenceGate,
            evidenceGate,
            locale,
            onPhaseStart: (catId: string, catName: string) => {
              progress.reportPhaseStart(catId as never, catName);
            },
            onPhaseComplete: (catId: string, catName: string, count: number, duration: number) => {
              progress.reportPhaseComplete(catId as never, catName, count, duration);
            },
          },
        );

        const webFindingsMissingScreenshotEvidence = scanResult.phases
          .flatMap((phase) => phase.findings)
          .filter((finding) => !hasWebFindingEvidence(finding));

        if (webFindingsMissingScreenshotEvidence.length > 0) {
          logger.warn(
            locale === "id"
              ? `${webFindingsMissingScreenshotEvidence.length} temuan web tidak memiliki bukti screenshot/HTTP. Temuan tetap berasal dari scanner, tetapi perlu bukti visual sebelum dilaporkan ke stakeholder.`
              : `${webFindingsMissingScreenshotEvidence.length} web findings do not include screenshot/HTTP evidence. Findings still come from scanners, but need visual evidence before stakeholder reporting.`,
          );
        }

        // Step 7: Show summary
        progress.reportSummary(
          scanResult.totalFindings,
          scanResult.totalFiltered,
          scanResult.scanDurationMs,
          scanResult.phases.length,
        );

        // Step 8: Generate output
        const allFindings = scanResult.phases.flatMap((p) => p.findings);

        switch (opts.format) {
          case "html": {
            const { HtmlReportGenerator, DEFAULT_REPORT_CONFIG } = await import(
              "@kodeaman/output-html"
            );
            const generator = new HtmlReportGenerator();

            const bySeverity: Record<SeverityLevel, number> = {
              info: 0,
              low: 0,
              medium: 0,
              high: 0,
              critical: 0,
            };
            for (const f of allFindings) {
              bySeverity[f.severity]++;
            }

            const htmlReport = {
              scanId: `owasp-${Date.now()}`,
              startedAt: new Date(
                Date.now() - scanResult.scanDurationMs,
              ).toISOString(),
              completedAt: new Date().toISOString(),
              environment: scanResult.environment.platform,
              categories: scanResult.phases.map((phase) => ({
                categoryId: phase.owaspCode,
                findings: phase.findings,
              })),
              totalFindings: scanResult.totalFindings,
              bySeverity,
              scannersUsed: [
                ...new Set(scanResult.phases.flatMap((p) => p.scannersUsed)),
              ],
            };

            const html = generator.generateReport(htmlReport, {
              ...DEFAULT_REPORT_CONFIG,
              locale,
              gamificationEnabled: config.gamification.enabled,
            });

            const outputPath = opts.output ?? resolve(repoRoot, "kodeaman-owasp-report.html");
            writeFileSync(outputPath, html, "utf-8");
            logger.success(
              locale === "id"
                ? `Laporan HTML disimpan ke ${outputPath}`
                : `HTML report saved to ${outputPath}`,
            );
            break;
          }

          case "json": {
            const jsonOutput = JSON.stringify(scanResult, null, 2);
            if (opts.output) {
              writeFileSync(opts.output, jsonOutput, "utf-8");
              logger.success(
                locale === "id"
                  ? `Laporan JSON disimpan ke ${opts.output}`
                  : `JSON report saved to ${opts.output}`,
              );
            } else {
              console.log(jsonOutput);
            }
            break;
          }

          case "markdown": {
            const { MarkdownRenderer } = await import("@kodeaman/output-markdown");
            const mdRenderer = new MarkdownRenderer();

            const mdBySeverity: Record<SeverityLevel, number> = {
              info: 0,
              low: 0,
              medium: 0,
              high: 0,
              critical: 0,
            };
            for (const f of allFindings) {
              mdBySeverity[f.severity]++;
            }

            const mdResult = {
              findings: allFindings,
              summary: {
                totalFindings: allFindings.length,
                bySeverity: mdBySeverity,
                scanDurationMs: scanResult.scanDurationMs,
                scannersUsed: [
                  ...new Set(scanResult.phases.flatMap((p) => p.scannersUsed)),
                ],
              },
            };

            const md = mdRenderer.renderPRComment(mdResult, config);
            if (opts.output) {
              writeFileSync(opts.output, md, "utf-8");
              logger.success(
                locale === "id"
                  ? `Laporan Markdown disimpan ke ${opts.output}`
                  : `Markdown report saved to ${opts.output}`,
              );
            } else {
              console.log(md);
            }
            break;
          }

          case "sarif": {
            const { SarifConverter } = await import("@kodeaman/output-sarif");
            const converter = new SarifConverter();
            const sarif = JSON.stringify(converter.convert(allFindings), null, 2);
            if (opts.output) {
              writeFileSync(opts.output, sarif, "utf-8");
              logger.success(
                locale === "id"
                  ? `Laporan SARIF disimpan ke ${opts.output}`
                  : `SARIF report saved to ${opts.output}`,
              );
            } else {
              console.log(sarif);
            }
            break;
          }

          default:
            logger.error(`Unknown format: ${opts.format}`);
            process.exit(1);
        }

        // Step 9: OWASP coverage report
        const { buildCoverageReport } = await import("@kodeaman/core");
        const coverageReport = buildCoverageReport(
          [
            ...(config.scanners.semgrep ? [{ scannerName: "semgrep", status: "ran" as const, findingsCount: 0, durationMs: 0 }] : [{ scannerName: "semgrep", status: "skipped-disabled" as const, reason: "Disabled in configuration", findingsCount: 0, durationMs: 0 }]),
            ...(config.scanners.zapBaseline ? [{ scannerName: "zap-baseline", status: "ran" as const, findingsCount: 0, durationMs: 0 }] : [{ scannerName: "zap-baseline", status: "skipped-disabled" as const, reason: "Disabled in configuration", findingsCount: 0, durationMs: 0 }]),
            ...(config.scanners.npmAudit ? [{ scannerName: "npm-audit", status: "ran" as const, findingsCount: 0, durationMs: 0 }] : [{ scannerName: "npm-audit", status: "skipped-disabled" as const, reason: "Disabled in configuration", findingsCount: 0, durationMs: 0 }]),
          ],
          allFindings,
          { scanMode: "owasp", scannedCategories: scanResult.scannedCategories },
        );
        const { CLIRenderer } = await import("@kodeaman/output-markdown");
        console.log(new CLIRenderer().renderCoverageReport(coverageReport, locale));

        // Step 10: Exit code 1 if findings >= failOnSeverity
        const hasExceedingFindings = allFindings.some((f) =>
          severityAtOrAbove(f.severity, failOnSeverity),
        );

        if (hasExceedingFindings) {
          logger.warn(
            locale === "id"
              ? `Temuan dengan tingkat keparahan ${failOnSeverity} atau lebih tinggi terdeteksi`
              : `Findings at or above ${failOnSeverity} severity detected`,
          );
          process.exit(1);
        }

        logger.success(
          locale === "id"
            ? "Pemindaian OWASP Top 10 selesai."
            : "OWASP Top 10 scan complete.",
        );
      } catch (err) {
        logger.error(String(err));
        process.exit(1);
      }
    });

  return cmd;
}
