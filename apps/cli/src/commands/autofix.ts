import { Command } from "commander";
import { resolve } from "node:path";
import { AutofixRunner, type AutofixReport } from "@kodeaman/autofix";
import { loadConfig } from "@kodeaman/config";
import type { NormalizedFinding } from "@kodeaman/schema";
import * as logger from "../utils/logger.js";

interface AutofixOptions {
  path: string;
  dryRun: boolean;
  includeBreaking: boolean;
  format: "markdown" | "json";
  config?: string;
  verbose: boolean;
}

export function createAutofixCommand(): Command {
  const cmd = new Command("autofix")
    .description("Run safe autofix commands from scan findings")
    .option("--path <path>", "Repository path", process.cwd())
    .option("--dry-run", "Show fix commands without applying them", false)
    .option("--include-breaking", "Apply fixes marked as breaking", false)
    .option("-f, --format <format>", "Output format (markdown|json)", "markdown")
    .option("-c, --config <path>", "Path to config file")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (opts: AutofixOptions) => {
      logger.setVerbose(opts.verbose);

      try {
        const repoRoot = resolve(process.cwd(), opts.path);
        const config = loadConfig(opts.config || repoRoot);

        logger.info(
          config.language === "id"
            ? "Memindai temuan yang dapat diperbaiki otomatis..."
            : "Scanning for autofixable findings...",
        );

        const findings = await scanForFindings(repoRoot, config);
        const runner = new AutofixRunner({
          dryRun: opts.dryRun,
          includeBreaking: opts.includeBreaking,
        });
        const report = await runner.run(findings);

        if (opts.format === "json") {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(renderMarkdownReport(report, findings));
        }

        if (report.failed > 0) {
          process.exit(1);
        }
      } catch (err) {
        logger.error(String(err));
        process.exit(1);
      }
    });

  return cmd;
}

async function scanForFindings(
  repoRoot: string,
  config: ReturnType<typeof loadConfig>,
): Promise<NormalizedFinding[]> {
  const { ScanPipeline } = await import("@kodeaman/core");
  const pipeline = new ScanPipeline(config as never);

  if (config.scanners.semgrep) {
    const { SemgrepAdapter } = await import("@kodeaman/adapters-semgrep");
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

  if (config.scanners.npmAudit) {
    const { NpmAuditAdapter } = await import("@kodeaman/adapters-npm-audit");
    pipeline.registerAdapter(new NpmAuditAdapter() as never);
  }

  const result = await pipeline.run({
    repoRoot,
    provider: "local",
  });

  return result.findings;
}

function renderMarkdownReport(
  report: AutofixReport,
  findings: NormalizedFinding[],
): string {
  const findingById = new Map(
    findings.map((finding) => [finding.findingId, finding]),
  );
  const lines = [
    "# KodeAman Autofix Report",
    "",
    `- Total findings: ${report.totalFindings}`,
    `- Fixable findings: ${report.fixableFindings}`,
    `- Applied: ${report.applied}`,
    `- Failed: ${report.failed}`,
    `- Skipped: ${report.skipped}`,
    `- Generated at: ${report.generatedAt}`,
    "",
    "## Results",
    "",
  ];

  if (report.results.length === 0) {
    lines.push("No autofix commands were found.");
    return lines.join("\n");
  }

  for (const result of report.results) {
    const finding = findingById.get(result.findingId);
    const fixCommand = finding?.fixCommands?.find(
      (candidate) => candidate.command === result.command,
    );

    lines.push(`### ${result.title}`);
    lines.push(`- Status: ${result.status}`);
    lines.push(`- Command: \`${result.command}\``);
    lines.push(`- Breaking: ${result.isBreaking ? "yes" : "no"}`);

    if (fixCommand) {
      lines.push(`- Description (EN): ${fixCommand.description}`);
      lines.push(`- Deskripsi (ID): ${fixCommand.descriptionId}`);
    }

    if (result.error) {
      lines.push(`- Error: ${result.error}`);
    }

    if (result.output) {
      lines.push("", "```", result.output.trim(), "```");
    }

    lines.push("");
  }

  return lines.join("\n");
}
