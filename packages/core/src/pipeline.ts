import type {
  NormalizedFinding,
  SeverityLevel,
  FindingCategory,
} from "@kodeaman/schema";
import type {
  ScannerAdapter,
  ScanContext,
  ScanResult,
  ScanSummary,
  TimingInfo,
  KodeamanConfig,
  ScannerCoverage,
  KodeamanPlugin,
} from "./types.js";
import { deduplicateFindings } from "./dedup.js";
import { buildCoverageReport } from "./coverage.js";

const SEVERITY_ORDER: SeverityLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

function emptySeverityCounts(): Record<SeverityLevel, number> {
  return { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
}

function buildSummary(findings: NormalizedFinding[]): ScanSummary {
  const bySeverity = emptySeverityCounts();
  const byCategory: Partial<Record<FindingCategory, number>> = {};
  let xpEarned = 0;
  const badgesAwarded: string[] = [];

  for (const f of findings) {
    bySeverity[f.severity]++;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
    if (f.gamification.xpReward) {
      xpEarned += f.gamification.xpReward;
    }
    if (f.gamification.badgeKey) {
      badgesAwarded.push(f.gamification.badgeKey);
    }
  }

  // Top findings sorted by priority score descending
  const topFindings = [...findings]
    .sort(
      (a, b) =>
        b.prioritization.priorityScore - a.prioritization.priorityScore
    )
    .slice(0, 3);

  return {
    total: findings.length,
    bySeverity,
    byCategory,
    topFindings,
    xpEarned,
    badgesAwarded: [...new Set(badgesAwarded)],
  };
}

export class ScanPipeline {
  private adapters: ScannerAdapter[] = [];
  private plugins: KodeamanPlugin[] = [];
  private config: KodeamanConfig;

  constructor(config: KodeamanConfig = {}) {
    this.config = config;
  }

  registerAdapter(adapter: ScannerAdapter): void {
    this.adapters.push(adapter);

    for (const plugin of this.plugins) {
      void plugin.hooks?.onAdapterRegistered?.(adapter);
    }
  }

  registerPlugin(plugin: KodeamanPlugin): void {
    this.plugins.push(plugin);

    for (const adapter of plugin.adapters ?? []) {
      this.registerAdapter(adapter);
    }
  }

  async run(context: ScanContext): Promise<ScanResult> {
    for (const plugin of this.plugins) {
      await plugin.hooks?.beforeScan?.(context);
    }

    const startedAt = new Date().toISOString();
    const adapterTimings: Record<string, number> = {};

    // Step 1: Run all registered adapters
    const allFindings: NormalizedFinding[] = [];
    const scannerCoverage: ScannerCoverage[] = [];

    for (const adapter of this.adapters) {
      // Skip adapters not enabled in config
      if (
        this.config.scanners &&
        this.config.scanners[adapter.name] === false
      ) {
        scannerCoverage.push({
          scannerName: adapter.name,
          status: "skipped-disabled",
          reason: "Disabled in configuration",
          findingsCount: 0,
          durationMs: 0,
        });
        continue;
      }

      const adapterStart = Date.now();
      try {
        const findings = await adapter.scan(context);
        const durationMs = Date.now() - adapterStart;
        adapterTimings[adapter.name] = durationMs;
        scannerCoverage.push({
          scannerName: adapter.name,
          status: "ran",
          findingsCount: findings.length,
          durationMs,
        });
        allFindings.push(...findings);
      } catch (err) {
        const durationMs = Date.now() - adapterStart;
        adapterTimings[adapter.name] = durationMs;
        scannerCoverage.push({
          scannerName: adapter.name,
          status: "skipped-error",
          reason: err instanceof Error ? err.message : String(err),
          findingsCount: 0,
          durationMs,
        });
      }
    }

    // Step 2: Deduplicate
    const deduplicated = deduplicateFindings(allFindings);

    // Step 3: Sort by priority score (descending)
    const sorted = deduplicated.sort(
      (a, b) =>
        b.prioritization.priorityScore - a.prioritization.priorityScore ||
        SEVERITY_ORDER.indexOf(a.severity) -
          SEVERITY_ORDER.indexOf(b.severity)
    );

    // Step 4: Build summary and coverage
    const summary = buildSummary(sorted);
    const coverageReport = buildCoverageReport(scannerCoverage, sorted);

    const completedAt = new Date().toISOString();
    const timing: TimingInfo = {
      startedAt,
      completedAt,
      durationMs: Date.now() - new Date(startedAt).getTime(),
      adapterTimings,
    };

    let result: ScanResult = {
      findings: sorted,
      summary,
      timing,
      coverageReport,
    };

    for (const plugin of this.plugins) {
      const nextResult = await plugin.hooks?.afterScan?.(result);
      if (nextResult) {
        result = nextResult;
      }
    }

    return result;
  }
}
