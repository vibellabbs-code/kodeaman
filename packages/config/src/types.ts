import type { ConfidenceLevel, SeverityLevel } from "@kodeaman/schema";

export interface OwaspScanConfig {
  enabled: boolean;
  categories: string[];
  parallel: boolean;
  confidenceGate: ConfidenceLevel;
  evidenceGate: boolean;
  failOnSeverity: SeverityLevel;
}

export interface EnvironmentConfig {
  skipWslCheck: boolean;
  scannerTimeout: number;
}

export interface PluginConfig {
  name: string;
  enabled?: boolean;
  package?: string;
  options?: Record<string, unknown>;
}

export interface TeamConfig {
  teamId: string;
  teamName: string;
  members: Array<{
    name: string;
    email?: string;
    role: "admin" | "developer" | "viewer";
  }>;
  projects: string[];
}

export interface CustomRuleConfig {
  id: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  severity: SeverityLevel;
  category: string;
  pattern: string;
  fileGlob: string;
  owaspCategory?: string;
  cwe?: string[];
  remediation: string[];
  remediationId: string[];
}

export interface CustomRulesConfig {
  directory?: string;
  rules?: CustomRuleConfig[];
}

export interface KodeamanConfig {
  language: "en" | "id";
  scanners: {
    semgrep: boolean;
    zapBaseline: boolean;
    zapTargetUrl?: string;
    npmAudit?: boolean;
    playwright?: boolean;
    playwrightTargetUrl?: string;
    playwrightZapProxy?: string;
  };
  presets: string[];
  prioritization: {
    maxFindingsInComment: number;
    failOnSeverity: SeverityLevel;
  };
  gamification: {
    enabled: boolean;
  };
  output: {
    markdown: boolean;
    sarif: boolean;
    json: boolean;
    html?: boolean;
  };
  owasp?: OwaspScanConfig;
  environment?: EnvironmentConfig;
  llm?: {
    enabled: boolean;
    provider?: string;
    apiKey?: string;
  };
  plugins?: PluginConfig[];
  team?: TeamConfig;
  customRules?: CustomRulesConfig;
}
