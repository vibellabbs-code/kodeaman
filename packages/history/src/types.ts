import type { FindingCategory, SeverityLevel } from "@kodeaman/schema";

export type ScanMode = "standard" | "owasp";

export interface ScanHistoryEntry {
  timestamp: string;
  projectPath: string;
  scanMode: ScanMode;
  findingsCount: number;
  bySeverity: Record<SeverityLevel, number>;
  byCategory: Partial<Record<FindingCategory, number>>;
  topFindings: Array<{
    title: string;
    severity: SeverityLevel;
    priorityScore: number;
  }>;
  scannersUsed: string[];
  coveragePercent: number;
}

export interface ScanHistoryQueryOptions {
  since?: Date;
  until?: Date;
  projectPath?: string;
}

export interface DailyTrend {
  date: string;
  scans: number;
  findingsCount: number;
  bySeverity: Record<SeverityLevel, number>;
}

export interface ProjectStats {
  projectPath: string;
  scans: number;
  findingsCount: number;
  lastScannedAt: string;
  averageCoveragePercent: number;
}
