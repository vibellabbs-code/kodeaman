export interface GosecRawOutput {
  Issues?: GosecIssue[];
  Stats?: Record<string, unknown>;
  GosecVersion?: string;
}

export interface GosecIssue {
  severity: string;
  confidence: string;
  cwe?: {
    id?: string;
    url?: string;
  };
  rule_id: string;
  details: string;
  file: string;
  code?: string;
  line: string;
  column?: string;
}

export interface ScanContext {
  targetPath?: string;
  repoRoot?: string;
  extraArgs?: string[];
  timeout?: number;
}
