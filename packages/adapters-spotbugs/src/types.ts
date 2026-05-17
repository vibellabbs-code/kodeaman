export interface SpotbugsBugInstance {
  type: string;
  priority?: string;
  rank?: string;
  category?: string;
  abbrev?: string;
  message?: string;
  className?: string;
  sourcePath?: string;
  startLine?: number;
  endLine?: number;
  cwe?: string;
}

export interface SpotbugsRawOutput {
  bugs: SpotbugsBugInstance[];
}

export interface ScanContext {
  targetPath?: string;
  repoRoot?: string;
  jarPath?: string;
  extraArgs?: string[];
  timeout?: number;
}
