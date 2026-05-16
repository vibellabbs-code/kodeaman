import { execFile } from "child_process";
import { promisify } from "util";
import type { NormalizedFinding } from "./diagnostics";

const execFileAsync = promisify(execFile);

export interface ScanRunnerOptions {
  cliPath: string;
  workspaceRoot: string;
  maxBuffer: number;
}

export interface ScanResult {
  findings: NormalizedFinding[];
  totalFindings: number;
  raw: unknown;
}

export async function runKodeAmanScan(options: ScanRunnerOptions): Promise<ScanResult> {
  const { stdout } = await execFileAsync(
    options.cliPath,
    ["scan", "--format", "json", options.workspaceRoot],
    {
      cwd: options.workspaceRoot,
      maxBuffer: options.maxBuffer,
      windowsHide: true,
    },
  );

  return parseScanOutput(stdout);
}

export function parseScanOutput(output: string): ScanResult {
  const parsed = JSON.parse(output) as unknown;
  const findings = extractFindings(parsed);

  return {
    findings,
    totalFindings: findings.length,
    raw: parsed,
  };
}

function extractFindings(parsed: unknown): NormalizedFinding[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(isNormalizedFinding);
  }

  if (!parsed || typeof parsed !== "object") {
    return [];
  }

  const candidate = parsed as { findings?: unknown; phases?: unknown };

  if (Array.isArray(candidate.findings)) {
    return candidate.findings.filter(isNormalizedFinding);
  }

  if (Array.isArray(candidate.phases)) {
    return candidate.phases.flatMap((phase) => {
      if (!phase || typeof phase !== "object") {
        return [];
      }

      const phaseFindings = (phase as { findings?: unknown }).findings;
      return Array.isArray(phaseFindings) ? phaseFindings.filter(isNormalizedFinding) : [];
    });
  }

  return [];
}

function isNormalizedFinding(value: unknown): value is NormalizedFinding {
  if (!value || typeof value !== "object") {
    return false;
  }

  const finding = value as Partial<NormalizedFinding>;
  return (
    typeof finding.findingId === "string" &&
    typeof finding.title === "string" &&
    typeof finding.severity === "string" &&
    typeof finding.location?.filePath === "string"
  );
}
