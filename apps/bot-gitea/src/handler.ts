import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "@kodeaman/config";
import { MarkdownRenderer } from "@kodeaman/output-markdown";
import type { ScanResult } from "@kodeaman/output-markdown";
import type { SeverityLevel } from "@kodeaman/schema";
import { GiteaCommentManager } from "./comment.js";
import type { GiteaPullRequestPayload } from "./types.js";

export class GiteaPRHandler {
  private commentManager = new GiteaCommentManager();

  async handlePullRequest(event: GiteaPullRequestPayload): Promise<void> {
    const { repository, pull_request: pr } = event;
    const owner = repository.owner.login || repository.owner.username;

    console.log(`Processing PR #${pr.number} in ${repository.full_name}`);

    const workDir = mkdtempSync(join(tmpdir(), "kodeaman-"));

    try {
      execFileSync("git", [
        "clone",
        "--depth",
        "1",
        "--branch",
        pr.head.ref,
        repository.clone_url,
        workDir,
      ], { stdio: "pipe", timeout: 120_000 });

      const config = loadConfig(workDir);
      const isOwaspMode = config.owasp?.enabled === true;

      try {
        const { ScanPipeline } = await import("@kodeaman/core");
        const pipeline = new ScanPipeline(config as never);

        if (isOwaspMode) {
          const { OwaspScanOrchestrator } = await import("@kodeaman/owasp");
          const orchestrator = new OwaspScanOrchestrator(pipeline, config);

          const owaspResult = await orchestrator.scan(
            {
              repoRoot: workDir,
              provider: "gitlab",
              branch: pr.head.ref,
              commitSha: pr.head.sha,
              mrIid: pr.number,
            },
            {
              categories: config.owasp?.categories as never,
              parallel: config.owasp?.parallel,
              confidenceGate: config.owasp?.confidenceGate,
              evidenceGate: config.owasp?.evidenceGate,
              locale: config.language,
            },
          );

          const allFindings = owaspResult.phases.flatMap((phase) => phase.findings);

          const bySeverity: Record<SeverityLevel, number> = {
            info: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          };
          for (const finding of allFindings) {
            bySeverity[finding.severity]++;
          }

          const result: ScanResult = {
            findings: allFindings,
            summary: {
              totalFindings: allFindings.length,
              bySeverity,
              scanDurationMs: owaspResult.scanDurationMs,
              scannersUsed: [...new Set(owaspResult.phases.flatMap((phase) => phase.scannersUsed))],
            },
            repoName: repository.full_name,
            branch: pr.head.ref,
            commitSha: pr.head.sha,
          };

          const renderer = new MarkdownRenderer();
          const markdown = renderer.renderPRComment(result, config);

          await this.commentManager.createOrUpdateComment(
            owner,
            repository.name,
            pr.number,
            markdown,
          );

          if (config.output.html) {
            try {
              const { HtmlReportGenerator, DEFAULT_REPORT_CONFIG } = await import(
                "@kodeaman/output-html"
              );
              const generator = new HtmlReportGenerator();
              const html = generator.generateReport(
                {
                  scanId: `owasp-pr-${pr.number}`,
                  startedAt: new Date(Date.now() - owaspResult.scanDurationMs).toISOString(),
                  completedAt: new Date().toISOString(),
                  environment: owaspResult.environment.platform,
                  repoContext: {
                    repoFullName: repository.full_name,
                    branch: pr.head.ref,
                    commitSha: pr.head.sha,
                  },
                  categories: owaspResult.phases.map((phase) => ({
                    categoryId: phase.owaspCode,
                    findings: phase.findings,
                  })),
                  totalFindings: owaspResult.totalFindings,
                  bySeverity,
                  scannersUsed: [...new Set(owaspResult.phases.flatMap((phase) => phase.scannersUsed))],
                },
                {
                  ...DEFAULT_REPORT_CONFIG,
                  locale: config.language,
                  gamificationEnabled: config.gamification.enabled,
                },
              );

              const htmlPath = join(workDir, "kodeaman-owasp-report.html");
              writeFileSync(htmlPath, html, "utf-8");
              console.log(`OWASP HTML report generated at ${htmlPath}`);
            } catch (htmlErr) {
              console.warn("Failed to generate HTML report:", htmlErr);
            }
          }

          console.log(`Posted OWASP security report to PR #${pr.number}`);
        } else {
          const pipelineResult = await pipeline.run({
            repoRoot: workDir,
            provider: "gitlab",
            branch: pr.head.ref,
            commitSha: pr.head.sha,
            mrIid: pr.number,
          });

          const bySeverity: Record<SeverityLevel, number> = {
            info: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          };
          for (const finding of pipelineResult.findings) {
            bySeverity[finding.severity]++;
          }

          const result: ScanResult = {
            findings: pipelineResult.findings,
            summary: {
              totalFindings: pipelineResult.findings.length,
              bySeverity,
              scanDurationMs: pipelineResult.timing.durationMs,
              scannersUsed: Object.keys(pipelineResult.timing.adapterTimings),
            },
            repoName: repository.full_name,
            branch: pr.head.ref,
            commitSha: pr.head.sha,
          };

          const renderer = new MarkdownRenderer();
          const markdown = renderer.renderPRComment(result, config);

          await this.commentManager.createOrUpdateComment(
            owner,
            repository.name,
            pr.number,
            markdown,
          );

          console.log(`Posted security report to PR #${pr.number}`);
        }
      } catch (err) {
        console.error("Pipeline execution failed:", err);
      }
    } finally {
      try {
        rmSync(workDir, { recursive: true, force: true });
      } catch {
        // cleanup failure is non-fatal
      }
    }
  }
}
