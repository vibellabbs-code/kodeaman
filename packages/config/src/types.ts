import type { SeverityLevel, ConfidenceLevel } from "@kodeaman/schema";

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
}
