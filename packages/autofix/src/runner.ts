import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FixCommand, NormalizedFinding } from "@kodeaman/schema";
import type { AutofixReport, AutofixResult } from "./types.js";

const execFileAsync = promisify(execFile);

export interface AutofixRunnerOptions {
  dryRun?: boolean;
  includeBreaking?: boolean;
}

interface CommandEntry {
  finding: NormalizedFinding;
  fixCommand: FixCommand;
}

export class AutofixRunner {
  private readonly dryRun: boolean;
  private readonly includeBreaking: boolean;

  constructor(options: AutofixRunnerOptions = {}) {
    this.dryRun = options.dryRun ?? false;
    this.includeBreaking = options.includeBreaking ?? false;
  }

  async run(findings: NormalizedFinding[]): Promise<AutofixReport> {
    const fixableFindings = findings.filter(
      (finding) => finding.fixCommands && finding.fixCommands.length > 0,
    );
    const commandEntries = this.collectUniqueCommandEntries(fixableFindings);
    const results: AutofixResult[] = [];

    for (const entry of commandEntries) {
      const result = await this.runCommand(entry);
      results.push(result);
    }

    return {
      totalFindings: findings.length,
      fixableFindings: fixableFindings.length,
      applied: results.filter((result) => result.status === "success").length,
      failed: results.filter((result) => result.status === "failed").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      results,
      generatedAt: new Date().toISOString(),
    };
  }

  private collectUniqueCommandEntries(
    findings: NormalizedFinding[],
  ): CommandEntry[] {
    const seen = new Set<string>();
    const entries: CommandEntry[] = [];

    for (const finding of findings) {
      for (const fixCommand of finding.fixCommands ?? []) {
        if (seen.has(fixCommand.command)) continue;
        seen.add(fixCommand.command);
        entries.push({ finding, fixCommand });
      }
    }

    return entries;
  }

  private async runCommand(entry: CommandEntry): Promise<AutofixResult> {
    const { finding, fixCommand } = entry;
    const baseResult = {
      findingId: finding.findingId,
      title: finding.title,
      command: fixCommand.command,
      isBreaking: fixCommand.isBreaking,
    };

    if (fixCommand.isBreaking && !this.includeBreaking) {
      return {
        ...baseResult,
        status: "skipped",
        output: `${fixCommand.description}\n${fixCommand.descriptionId}`,
        error: "Breaking fix skipped. Re-run with includeBreaking enabled to apply it.",
      };
    }

    if (this.dryRun) {
      return {
        ...baseResult,
        status: "dry-run",
        output: `${fixCommand.description}\n${fixCommand.descriptionId}`,
      };
    }

    try {
      const { file, args } = this.parseCommand(fixCommand.command);
      const { stdout, stderr } = await execFileAsync(file, args, {
        cwd: fixCommand.cwd,
        maxBuffer: 50 * 1024 * 1024,
      });

      return {
        ...baseResult,
        status: "success",
        output: [stdout, stderr].filter(Boolean).join("\n"),
      };
    } catch (error) {
      return {
        ...baseResult,
        status: "failed",
        output: this.extractOutput(error),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private parseCommand(command: string): { file: string; args: string[] } {
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    const [file, ...args] = parts.map((part) => part.replace(/^"|"$/g, ""));

    if (!file) {
      throw new Error("Fix command cannot be empty");
    }

    if (process.platform === "win32") {
      return {
        file: "cmd.exe",
        args: ["/d", "/s", "/c", file, ...args],
      };
    }

    return { file, args };
  }

  private extractOutput(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined;
    const candidate = error as { stdout?: string; stderr?: string };
    return [candidate.stdout, candidate.stderr].filter(Boolean).join("\n") || undefined;
  }
}
