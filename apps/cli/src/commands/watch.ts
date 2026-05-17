import { resolve } from "node:path";
import { loadConfig } from "@kodeaman/config";
import { MarkdownRenderer } from "@kodeaman/output-markdown";
import type { ScanResult } from "@kodeaman/output-markdown";
import type { NormalizedFinding, SeverityLevel } from "@kodeaman/schema";
import { FileWatcher } from "@kodeaman/watcher";
import { Command } from "commander";
import * as logger from "../utils/logger.js";

interface WatchOptions {
  path: string;
  debounce: string;
  format: string;
}

async function runScan(repoRoot: string, format: string): Promise<void> {
  const config = loadConfig(repoRoot);
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

  const pipelineResult = await pipeline.run({
    repoRoot,
    provider: "local",
  });
  const findings = pipelineResult.findings;
  const bySeverity: Record<SeverityLevel, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const finding of findings) {
    bySeverity[finding.severity]++;
  }

  const result: ScanResult = {
    findings: findings as NormalizedFinding[],
    summary: {
      totalFindings: findings.length,
      bySeverity,
      scanDurationMs: pipelineResult.timing.durationMs,
      scannersUsed: [...new Set(findings.map((finding) => finding.source))],
    },
  };

  switch (format) {
    case "json":
      console.log(JSON.stringify(result, null, 2));
      break;
    case "markdown": {
      const mdRenderer = new MarkdownRenderer();
      console.log(mdRenderer.renderPRComment(result, config));
      break;
    }
    default:
      throw new Error(`Unsupported watch output format: ${format}`);
  }
}

export function createWatchCommand(): Command {
  const cmd = new Command("watch")
    .description("Watch source files and scan when they change")
    .option("--path <path>", "Path to watch", process.cwd())
    .option("--debounce <ms>", "Debounce delay in milliseconds", "300")
    .option("--format <format>", "Output format (markdown|json)", "markdown")
    .action(async (opts: WatchOptions) => {
      const repoRoot = resolve(opts.path);
      const debounceMs = Number.parseInt(opts.debounce, 10);

      if (!Number.isFinite(debounceMs) || debounceMs < 0) {
        logger.error("--debounce must be a non-negative number");
        process.exit(1);
      }

      if (!["markdown", "json"].includes(opts.format)) {
        logger.error("--format must be markdown or json");
        process.exit(1);
      }

      const watcher = new FileWatcher({
        path: repoRoot,
        debounceMs,
        include: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
        exclude: ["node_modules/**", "dist/**", ".git/**", ".turbo/**"],
      });

      let running = false;
      let queued = false;

      const scan = async (reason: string): Promise<void> => {
        if (running) {
          queued = true;
          return;
        }

        running = true;
        const timestamp = new Date().toISOString();
        logger.info(`Watching for changes... last scan ${timestamp} (${reason})`);

        try {
          await runScan(repoRoot, opts.format);
        } catch (err) {
          logger.error(String(err));
        } finally {
          running = false;
          if (queued) {
            queued = false;
            await scan("queued change");
          }
        }
      };

      watcher.on("change", (event) => {
        void scan(event.path);
      });

      process.on("SIGINT", () => {
        watcher.stop();
        process.exit(0);
      });

      watcher.start();
      logger.info(`Watching for changes... path ${repoRoot}`);
      await scan("initial scan");
    });

  return cmd;
}
