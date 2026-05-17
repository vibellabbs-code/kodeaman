export interface BanditRawOutput {
  errors?: unknown[];
  generated_at?: string;
  metrics?: Record<string, unknown>;
  results: BanditResult[];
}

export interface BanditResult {
  code?: string;
  filename: string;
  issue_confidence: string;
  issue_cwe?: {
    id?: number;
    link?: string;
  };
  issue_severity: string;
  issue_text: string;
  line_number: number;
  line_range?: number[];
  more_info?: string;
  test_id: string;
  test_name: string;
}

export interface ScanContext {
  targetPath?: string;
  repoRoot?: string;
  extraArgs?: string[];
  timeout?: number;
}
