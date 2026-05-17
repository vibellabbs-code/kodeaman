export interface CargoAuditRawOutput {
  vulnerabilities?: {
    list?: CargoAuditVulnerability[];
    found?: boolean;
    count?: number;
  };
  warnings?: Record<string, unknown>;
}

export interface CargoAuditVulnerability {
  advisory: {
    id: string;
    package: string;
    title: string;
    description?: string;
    date?: string;
    url?: string;
    aliases?: string[];
    categories?: string[];
    keywords?: string[];
    cvss?: string;
  };
  versions?: {
    patched?: string[];
    unaffected?: string[];
  };
  package?: {
    name: string;
    version: string;
  };
}

export interface ScanContext {
  targetPath?: string;
  repoRoot?: string;
  extraArgs?: string[];
  timeout?: number;
}
