import type {
  NormalizedFinding,
  SeverityLevel,
  RepoContext,
} from "@kodeaman/schema";
import {
  isAuthRelatedPath,
  isPublicRoute,
  estimateFixEffort,
  detectSensitiveData,
  isInternetExposed,
  isDependencyDirect,
  hasFixAvailable,
} from "./heuristics.js";

const SEVERITY_BASE_SCORE: Record<SeverityLevel, number> = {
  critical: 90,
  high: 70,
  medium: 40,
  low: 15,
  info: 5,
};

const CONFIDENCE_MULTIPLIER: Record<string, number> = {
  high: 1.0,
  medium: 0.8,
  low: 0.5,
};

const EFFORT_BOOST: Record<string, number> = {
  trivial: 8,
  easy: 5,
  moderate: 0,
  hard: -3,
};

export class Prioritizer {
  prioritize(findings: NormalizedFinding[], context?: RepoContext): NormalizedFinding[] {
    const scored = findings.map((f) => {
      const result = { ...f };
      const { score, reasons } = this.computePriorityScore(result, context);
      result.prioritization = {
        ...result.prioritization,
        priorityScore: score,
        adjustedSeverity: this.adjustSeverity(result, context),
        reasons,
      };
      return result;
    });

    return scored.sort((a, b) => b.prioritization.priorityScore - a.prioritization.priorityScore);
  }

  computePriorityScore(
    finding: NormalizedFinding,
    context?: RepoContext,
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];

    // Base severity score
    let score = SEVERITY_BASE_SCORE[finding.severity] ?? 20;
    reasons.push(`Base severity (${finding.severity}): ${score}`);

    // Confidence multiplier
    const confMult = CONFIDENCE_MULTIPLIER[finding.confidence] ?? 0.8;
    score = Math.round(score * confMult);
    if (confMult !== 1.0) {
      reasons.push(`Confidence adjustment (${finding.confidence}): x${confMult}`);
    }

    // Internet exposure boost
    const exposed = isInternetExposed(finding.location.filePath, finding.location.url);
    if (exposed) {
      const exposureBoost = 10;
      score += exposureBoost;
      reasons.push(`Internet-exposed path: +${exposureBoost}`);
    }

    // Auth surface boost
    const filePath = finding.location.filePath ?? "";
    if (isAuthRelatedPath(filePath)) {
      const authBoost = 12;
      score += authBoost;
      reasons.push(`Auth-related code: +${authBoost}`);
    }

    // Public route boost
    if (isPublicRoute(filePath, context?.framework?.[0])) {
      const publicBoost = 8;
      score += publicBoost;
      reasons.push(`Public route: +${publicBoost}`);
    }

    // Data sensitivity boost
    if (detectSensitiveData(finding.location.snippet)) {
      const sensitivityBoost = 10;
      score += sensitivityBoost;
      reasons.push(`Sensitive data in context: +${sensitivityBoost}`);
    }

    // Dependency reachability boost
    if (isDependencyDirect(finding)) {
      const directDependencyBoost = 7;
      score += directDependencyBoost;
      reasons.push(`Direct dependency: +${directDependencyBoost}`);
    }

    // Available fix boost
    if (hasFixAvailable(finding)) {
      const fixAvailableBoost = 6;
      score += fixAvailableBoost;
      reasons.push(`Fix available: +${fixAvailableBoost}`);
    }

    // Developer burden — easy fixes get a boost
    const effort = estimateFixEffort(finding.category);
    const effortAdj = EFFORT_BOOST[effort] ?? 0;
    if (effortAdj !== 0) {
      score += effortAdj;
      reasons.push(`Fix effort (${effort}): ${effortAdj > 0 ? "+" : ""}${effortAdj}`);
    }

    // Public repo boost
    if (context?.isPublicRepo) {
      const publicRepoBoost = 5;
      score += publicRepoBoost;
      reasons.push(`Public repository: +${publicRepoBoost}`);
    }

    // Production environment boost
    if (context?.environment === "production") {
      const prodBoost = 8;
      score += prodBoost;
      reasons.push(`Production environment: +${prodBoost}`);
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    return { score, reasons };
  }

  adjustSeverity(finding: NormalizedFinding, context?: RepoContext): SeverityLevel {
    const filePath = finding.location.filePath ?? "";
    let severity = finding.severity;

    // Upgrade severity for auth-related findings
    if (isAuthRelatedPath(filePath) && finding.confidence === "high") {
      severity = upgradeSeverity(severity);
    }

    // Upgrade for internet-exposed + sensitive data
    if (
      isInternetExposed(filePath, finding.location.url) &&
      detectSensitiveData(finding.location.snippet)
    ) {
      severity = upgradeSeverity(severity);
    }

    // Upgrade in production
    if (context?.environment === "production" && severity !== "critical") {
      if (finding.severity === "high") severity = "critical";
    }

    // Downgrade low-confidence info findings
    if (finding.confidence === "low" && finding.severity === "low") {
      severity = "info";
    }

    return severity;
  }
}

function upgradeSeverity(severity: SeverityLevel): SeverityLevel {
  switch (severity) {
    case "info":
      return "low";
    case "low":
      return "medium";
    case "medium":
      return "high";
    case "high":
      return "critical";
    case "critical":
      return "critical";
  }
}
