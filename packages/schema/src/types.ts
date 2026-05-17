export type FindingSource =
  | "semgrep"
  | "zap-baseline"
  | "zap-full"
  | "codeql"
  | "npm-audit"
  | "bandit"
  | "gosec"
  | "cargo-audit"
  | "spotbugs"
  | "playwright"
  | "custom";

export type OwaspCategory =
  | "A01-broken-access-control"
  | "A02-cryptographic-failures"
  | "A03-injection"
  | "A04-insecure-design"
  | "A05-security-misconfiguration"
  | "A06-vulnerable-components"
  | "A07-auth-failures"
  | "A08-data-integrity-failures"
  | "A09-logging-monitoring-failures"
  | "A10-ssrf";

export type FindingCategory =
  | "sast"
  | "dast"
  | "sca"
  | "secrets"
  | "config"
  | "auth"
  | "input-validation"
  | "xss"
  | "sqli"
  | "csrf"
  | "file-upload"
  | "ssrf"
  | "rce"
  | "info-leak"
  | "misconfiguration"
  | "other";

export type SeverityLevel = "info" | "low" | "medium" | "high" | "critical";

export type ConfidenceLevel = "low" | "medium" | "high";

export type RuntimeSurface =
  | "source-code"
  | "api"
  | "web-page"
  | "config"
  | "dependency"
  | "secret"
  | "infrastructure"
  | "unknown";

export interface FindingLocation {
  filePath?: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  snippet?: string;
  url?: string;
  httpMethod?: string;
  parameter?: string;
  component?: string;
  routeName?: string;
}

export interface EvidenceBlock {
  type:
    | "code"
    | "http-request"
    | "http-response"
    | "trace"
    | "scanner-message"
    | "html-report"
    | "terminal-snapshot"
    | "other";
  label: string;
  content: string;
  redacted?: boolean;
}

export interface ClassificationRefs {
  cwe?: string[];
  owasp?: string[];
  capec?: string[];
  cvssVector?: string;
  cve?: string[];
  tags?: string[];
  owaspCategories?: OwaspCategory[];
}

export interface RepoContext {
  provider?: "github" | "gitlab" | "local";
  repoFullName?: string;
  defaultBranch?: string;
  branch?: string;
  commitSha?: string;
  pullRequestNumber?: number;
  mergeRequestIid?: number;
  environment?:
    | "local"
    | "preview"
    | "staging"
    | "production"
    | "unknown";
  stackHints?: string[];
  framework?: string[];
  isPublicRepo?: boolean;
}

export interface PrioritizationFactors {
  baseSeverity: SeverityLevel;
  adjustedSeverity: SeverityLevel;
  priorityScore: number;
  confidenceScore: number;
  exploitabilityScore?: number;
  businessImpactScore?: number;
  reachabilityScore?: number;
  internetExposureScore?: number;
  authSurfaceScore?: number;
  dataSensitivityScore?: number;
  repeatedPatternScore?: number;
  developerBurdenScore?: number;
  reasons: string[];
}

export interface CoachingContent {
  titleEn: string;
  titleId: string;
  summaryEn: string;
  summaryId: string;
  whyItMattersEn: string;
  whyItMattersId: string;
  remediationEn: string[];
  remediationId: string[];
  safeExampleTitle?: string;
  safeExampleCode?: string;
  lessonId?: string;
  lessonSlug?: string;
  lessonLevel?: "beginner" | "intermediate" | "advanced";
  lessonEstimatedMinutes?: number;
  autofixEligible?: boolean;
  autofixStrategy?: "template-rewrite" | "llm-draft" | "none";
}

export interface GamificationMeta {
  issueFamily: string;
  xpReward?: number;
  badgeKey?: string;
  streakEligible?: boolean;
  questKey?: string;
  questProgressDelta?: number;
  repeatOffender?: boolean;
}

export interface RawToolRefs {
  tool: FindingSource;
  toolRuleId?: string;
  toolFindingId?: string;
  toolUrl?: string;
  rawSeverity?: string;
  rawConfidence?: string;
  rawCategory?: string;
}

export interface FixCommand {
  command: string;
  cwd?: string;
  description: string;
  descriptionId: string;
  isBreaking: boolean;
  packageManager: "npm" | "pnpm" | "yarn";
}

export interface NormalizedFinding {
  schemaVersion: "1.0.0";
  findingId: string;
  dedupeKey: string;
  source: FindingSource;
  category: FindingCategory;
  surface: RuntimeSurface;
  owaspCategory?: OwaspCategory;

  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  status: "open" | "fixed" | "ignored" | "accepted-risk";

  title: string;
  description: string;
  shortDescription?: string;

  location: FindingLocation;
  occurrences?: { filePath: string; target?: string; repoRoot?: string }[];
  evidence: EvidenceBlock[];
  classification: ClassificationRefs;
  raw: RawToolRefs;
  fixCommands?: FixCommand[];

  repoContext?: RepoContext;
  prioritization: PrioritizationFactors;
  coaching: CoachingContent;
  gamification: GamificationMeta;

  detectedAt: string;
  updatedAt?: string;
}

export interface OwaspScanPhaseResult {
  owaspId: OwaspCategory;
  owaspCode: string;
  titleEn: string;
  titleId: string;
  findings: NormalizedFinding[];
  scanDurationMs: number;
  scannersUsed: FindingSource[];
  confidenceGate: "passed" | "filtered";
  filteredCount: number;
}

export interface OwaspScanReport {
  schemaVersion: "1.0.0";
  phases: OwaspScanPhaseResult[];
  scannedCategories: string[];
  totalFindings: number;
  totalFiltered: number;
  scanDurationMs: number;
  evidencePolicy: {
    required: boolean;
    mode: "scanner-evidence-only" | "evidence-optional";
    screenshotRequiredForWebFindings: boolean;
    generatedFindingsAllowed: false;
  };
  environment: {
    platform: "linux" | "wsl" | "windows" | "macos";
    wslDetected: boolean;
    wslDistro?: string;
    nodeVersion: string;
    scannersAvailable: FindingSource[];
  };
  generatedAt: string;
}
