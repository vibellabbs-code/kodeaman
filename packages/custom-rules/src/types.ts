import type {
  FindingCategory,
  OwaspCategory,
  SeverityLevel,
} from "@kodeaman/schema";

export interface KodeamanRule {
  id: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  severity: SeverityLevel;
  category: FindingCategory;
  pattern: string;
  fileGlob: string;
  owaspCategory?: OwaspCategory;
  cwe?: string[];
  remediation: string[];
  remediationId: string[];
}

export interface CustomRulesConfig {
  directory?: string;
  rules?: KodeamanRule[];
}

export interface RuleValidationResult {
  valid: boolean;
  rule?: KodeamanRule;
  errors: string[];
  filePath?: string;
}
