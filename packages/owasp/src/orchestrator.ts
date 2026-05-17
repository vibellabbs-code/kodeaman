/**
 * OWASP Scan Orchestrator
 *
 * Runs OWASP Top 10 categories A01-A10 through the ScanPipeline,
 * applying confidence gates, evidence gates, and multi-scanner correlation.
 */

import type {
  NormalizedFinding,
  ConfidenceLevel,
  OwaspScanPhaseResult,
  OwaspScanReport,
  FindingSource,
} from "@kodeaman/schema";
import type { ScanContext } from "@kodeaman/core";
import { ScanPipeline } from "@kodeaman/core";
import type { KodeamanConfig } from "@kodeaman/config";
import { OWASP_CATEGORIES, OWASP_BY_CODE } from "./categories.js";
import type { OwaspCategoryDefinition } from "./types.js";
import { mapCweToOwasp } from "./mapper.js";
import { detectEnvironment } from "./environment.js";

const CONFIDENCE_ORDER: ConfidenceLevel[] = ["low", "medium", "high"];

export interface OwaspScanOptions {
  /** Run categories in parallel instead of sequentially. Default: false */
  parallel?: boolean;
  /** Only scan specific categories by code (e.g. "A01", "A03"). Default: all */
  categories?: string[];
  /** Minimum confidence level to include a finding. Default: "low" */
  confidenceGate?: ConfidenceLevel;
  /** Require at least one evidence block to include a finding. Default: false */
  evidenceGate?: boolean;
  /** Target URL for DAST scanners */
  targetUrl?: string;
  /** Locale for progress output */
  locale?: "en" | "id";
  /** Called when a category scan phase starts */
  onPhaseStart?: (code: string, categoryName: string) => void;
  /** Called when a category scan phase completes */
  onPhaseComplete?: (
    code: string,
    categoryName: string,
    findingsCount: number,
    durationMs: number
  ) => void;
}

export class OwaspScanOrchestrator {
  private pipeline: ScanPipeline;
  private config: KodeamanConfig;

  constructor(pipeline: ScanPipeline, config: KodeamanConfig) {
    this.pipeline = pipeline;
    this.config = config;
  }

  async scan(
    context: ScanContext,
    options: OwaspScanOptions = {}
  ): Promise<OwaspScanReport> {
    const startedAt = Date.now();
    const requestedCodes = options.categories ??
      OWASP_CATEGORIES.map((c) => c.code);
    const requestedCodeSet = new Set(requestedCodes.map((code) => code.toUpperCase()));
    const confidenceGate = options.confidenceGate ?? "low";
    const evidenceGate = options.evidenceGate ?? true;

    // Resolve category definitions in canonical OWASP Top 10 order (A01-A10),
    // even when the user provides categories out of order.
    const categories: OwaspCategoryDefinition[] = OWASP_CATEGORIES.filter((category) =>
      requestedCodeSet.has(category.code),
    );

    const scanResult = await this.pipeline.run(context);
    let phases: OwaspScanPhaseResult[];

    if (options.parallel) {
      phases = await this.runParallel(
        scanResult.findings, categories, confidenceGate, evidenceGate, options
      );
    } else {
      phases = await this.runSequential(
        scanResult.findings, categories, confidenceGate, evidenceGate, options
      );
    }

    // Multi-scanner correlation: boost confidence across phases
    const allFindings = phases.flatMap((p) => p.findings);
    this.applyMultiScannerCorrelation(allFindings);

    // Rebuild phases with correlated findings
    for (const phase of phases) {
      phase.findings = phase.findings.map((f: NormalizedFinding) => {
        const correlated = allFindings.find(
          (af) => af.findingId === f.findingId
        );
        return correlated ?? f;
      });
    }

    const totalFiltered = phases.reduce((sum, p) => sum + p.filteredCount, 0);
    const totalFindings = phases.reduce(
      (sum, p) => sum + p.findings.length, 0
    );

    const env = detectEnvironment();

    return {
      schemaVersion: "1.0.0",
      phases,
      scannedCategories: [...requestedCodeSet],
      totalFindings,
      totalFiltered,
      scanDurationMs: Date.now() - startedAt,
      evidencePolicy: {
        required: evidenceGate,
        mode: evidenceGate ? "scanner-evidence-only" : "evidence-optional",
        screenshotRequiredForWebFindings: true,
        generatedFindingsAllowed: false,
      },
      environment: {
        platform: env.platform,
        wslDetected: env.isWSL,
        wslDistro: env.wslDistro,
        nodeVersion: env.nodeVersion,
        scannersAvailable: env.scannersAvailable,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async runSequential(
    allFindings: NormalizedFinding[],
    categories: OwaspCategoryDefinition[],
    confidenceGate: ConfidenceLevel,
    evidenceGate: boolean,
    options: OwaspScanOptions
  ): Promise<OwaspScanPhaseResult[]> {
    const phases: OwaspScanPhaseResult[] = [];
    const assignedIds = new Set<string>();

    for (const cat of categories) {
      const phase = this.buildCategoryPhase(
        allFindings, cat, assignedIds, confidenceGate, evidenceGate, options
      );
      phases.push(phase);
    }

    return phases;
  }

  private async runParallel(
    allFindings: NormalizedFinding[],
    categories: OwaspCategoryDefinition[],
    confidenceGate: ConfidenceLevel,
    evidenceGate: boolean,
    options: OwaspScanOptions
  ): Promise<OwaspScanPhaseResult[]> {
    const assignedIds = new Set<string>();
    const promises = categories.map((cat) =>
      this.buildCategoryPhase(
        allFindings, cat, assignedIds, confidenceGate, evidenceGate, options
      )
    );
    return Promise.all(promises);
  }

  private buildCategoryPhase(
    allFindings: NormalizedFinding[],
    category: OwaspCategoryDefinition,
    assignedIds: Set<string>,
    confidenceGate: ConfidenceLevel,
    evidenceGate: boolean,
    options: OwaspScanOptions
  ): OwaspScanPhaseResult {
    const locale = options.locale ?? this.config.language ?? "en";
    const categoryName = locale === "id" ? category.titleId : category.titleEn;

    options.onPhaseStart?.(category.code, categoryName);

    const phaseStart = Date.now();

    // Filter findings to those matching this OWASP category, assigning each once.
    let findings = allFindings.filter((f) => {
      if (assignedIds.has(f.findingId)) return false;
      if (f.owaspCategory) return f.owaspCategory === category.id;

      return this.getFirstMappedCategory(f) === category.id;
    });

    // Apply confidence gate
    let filteredCount = 0;
    const beforeConfidence = findings.length;
    findings = this.applyConfidenceGate(findings, confidenceGate);
    filteredCount += beforeConfidence - findings.length;

    // Apply evidence gate
    if (evidenceGate) {
      const beforeEvidence = findings.length;
      findings = this.applyEvidenceGate(findings);
      filteredCount += beforeEvidence - findings.length;
    }

    for (const finding of findings) {
      assignedIds.add(finding.findingId);
    }

    // Tag findings with their OWASP category
    findings = findings.map((f) => ({
      ...f,
      owaspCategory: category.id,
    }));

    const durationMs = Date.now() - phaseStart;
    const scannersUsed = [
      ...new Set(findings.map((f) => f.source)),
    ] as FindingSource[];

    options.onPhaseComplete?.(
      category.code, categoryName, findings.length, durationMs
    );

    return {
      owaspId: category.id,
      owaspCode: category.code,
      titleEn: category.titleEn,
      titleId: category.titleId,
      findings,
      scanDurationMs: durationMs,
      scannersUsed,
      confidenceGate: filteredCount > 0 ? "filtered" : "passed",
      filteredCount,
    };
  }

  private getFirstMappedCategory(finding: NormalizedFinding): string | undefined {
    const classifiedCategories = finding.classification.owaspCategories ?? [];
    const classifiedCategory = OWASP_CATEGORIES.find((category) =>
      classifiedCategories.includes(category.id)
    );
    if (classifiedCategory) return classifiedCategory.id;

    const cweCategoryIds = new Set(
      (finding.classification.cwe ?? []).flatMap((cweStr) => {
        const match = cweStr.match(/(\d+)/);
        return match ? mapCweToOwasp(Number.parseInt(match[1], 10)) : [];
      })
    );

    return OWASP_CATEGORIES.find((category) => cweCategoryIds.has(category.id))?.id;
  }

  private applyConfidenceGate(
    findings: NormalizedFinding[],
    minConfidence: ConfidenceLevel
  ): NormalizedFinding[] {
    const minIndex = CONFIDENCE_ORDER.indexOf(minConfidence);
    return findings.filter(
      (f) => CONFIDENCE_ORDER.indexOf(f.confidence) >= minIndex
    );
  }

  private applyEvidenceGate(
    findings: NormalizedFinding[]
  ): NormalizedFinding[] {
    return findings.filter((f) => f.evidence.length > 0);
  }

  /**
   * Multi-scanner correlation: when both SAST (semgrep/codeql) and
   * DAST (zap-baseline/zap-full) find the same issue (matching CWE
   * and overlapping location), boost the confidence.
   */
  private applyMultiScannerCorrelation(
    findings: NormalizedFinding[]
  ): void {
    const sastSources: FindingSource[] = ["semgrep", "codeql"];
    const dastSources: FindingSource[] = ["zap-baseline", "zap-full"];

    const sastFindings = findings.filter((f) =>
      sastSources.includes(f.source)
    );
    const dastFindings = findings.filter((f) =>
      dastSources.includes(f.source)
    );

    for (const sast of sastFindings) {
      for (const dast of dastFindings) {
        if (this.findingsCorrelate(sast, dast)) {
          sast.confidence = "high";
          dast.confidence = "high";

          sast.prioritization = {
            ...sast.prioritization,
            confidenceScore: Math.min(
              100, sast.prioritization.confidenceScore + 20
            ),
            reasons: [
              ...sast.prioritization.reasons,
              "Corroborated by DAST scanner",
            ],
          };
          dast.prioritization = {
            ...dast.prioritization,
            confidenceScore: Math.min(
              100, dast.prioritization.confidenceScore + 20
            ),
            reasons: [
              ...dast.prioritization.reasons,
              "Corroborated by SAST scanner",
            ],
          };
        }
      }
    }
  }

  private findingsCorrelate(
    a: NormalizedFinding,
    b: NormalizedFinding
  ): boolean {
    const aCwes = new Set(a.classification.cwe ?? []);
    const bCwes = b.classification.cwe ?? [];

    const sharedCwe = bCwes.some((cwe) => aCwes.has(cwe));
    if (!sharedCwe) return false;

    if (a.location.filePath && b.location.filePath) {
      return a.location.filePath === b.location.filePath;
    }
    if (a.location.routeName && b.location.routeName) {
      return a.location.routeName === b.location.routeName;
    }
    if (a.location.url && b.location.url) {
      return a.location.url === b.location.url;
    }

    return true;
  }
}
