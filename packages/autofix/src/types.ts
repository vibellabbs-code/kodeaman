export interface AutofixResult {
  findingId: string;
  title: string;
  command: string;
  status: "success" | "failed" | "skipped" | "dry-run";
  output?: string;
  error?: string;
  isBreaking: boolean;
}

export interface AutofixReport {
  totalFindings: number;
  fixableFindings: number;
  applied: number;
  failed: number;
  skipped: number;
  results: AutofixResult[];
  generatedAt: string;
}
