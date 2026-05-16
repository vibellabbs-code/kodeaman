import type {
  NormalizedFinding,
  SeverityLevel,
  FindingCategory,
} from "@kodeaman/schema";

export interface ScannerAdapter {
  name: string;
  scan(context: ScanContext): Promise<NormalizedFinding[]>;
}

export interface PluginConfig {
  name: string;
  enabled?: boolean;
  package?: string;
  options?: Record<string, unknown>;
}

export interface PluginHooks {
  beforeScan?(context: ScanContext): Promise<void> | void;
  afterScan?(result: ScanResult): Promise<ScanResult | void> | ScanResult | void;
  onAdapterRegistered?(adapter: ScannerAdapter): Promise<void> | void;
}

export interface KodeamanPlugin {
  name: string;
  adapters?: ScannerAdapter[];
  hooks?: PluginHooks;
  configure?(config: PluginConfig): Promise<void> | void;
}

export interface ScanContext {
  repoRoot: string;
  branch?: string;
  commitSha?: string;
  prNumber?: number;
  mrIid?: number;
  provider?: "github" | "gitlab" | "local";
  configPath?: string;
  owaspCategory?: string;
}

export interface ScanSummary {
  total: number;
  bySeverity: Record<SeverityLevel, number>;
  byCategory: Partial<Record<FindingCategory, number>>;
  topFindings: NormalizedFinding[];
  xpEarned: number;
  badgesAwarded: string[];
}

export interface TimingInfo {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  adapterTimings: Record<string, number>;
}

export interface ScannerCoverage {
  scannerName: string;
  status: "ran" | "skipped-disabled" | "skipped-unavailable" | "skipped-error";
  reason?: string;
  findingsCount: number;
  durationMs: number;
}

export interface CoverageReport {
  scannersConfigured: string[];
  scannersRan: string[];
  scannersSkipped: { name: string; reason: string }[];
  owaspCoverage: {
    categoryId: string;
    categoryName: string;
    covered: boolean;
    coveredBy: string[];
    findingsCount: number;
  }[];
  overallCoveragePercent: number;
  scanSurfaces: {
    surface: string;
    covered: boolean;
    scanners: string[];
  }[];
}

export interface ScanResult {
  findings: NormalizedFinding[];
  summary: ScanSummary;
  timing: TimingInfo;
  coverageReport?: CoverageReport;
}

export interface PrioritizationConfig {
  maxFindingsInComment?: number;
  failOnSeverity?: SeverityLevel;
}

export interface GamificationConfig {
  enabled?: boolean;
}

export interface OutputConfig {
  markdown?: boolean;
  sarif?: boolean;
}

export interface KodeamanConfig {
  language?: "id" | "en";
  scanners?: Record<string, boolean>;
  presets?: string[];
  prioritization?: PrioritizationConfig;
  gamification?: GamificationConfig;
  output?: OutputConfig;
  plugins?: PluginConfig[];
}
