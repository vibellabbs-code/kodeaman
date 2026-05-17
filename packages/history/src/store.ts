import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { SeverityLevel } from "@kodeaman/schema";
import type {
  DailyTrend,
  ProjectStats,
  ScanHistoryEntry,
  ScanHistoryQueryOptions,
} from "./types.js";

const DEFAULT_HISTORY_PATH = ".kodeaman/history.jsonl";

function emptySeverityCounts(): Record<SeverityLevel, number> {
  return { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
}

export class ScanHistoryStore {
  private readonly historyPath: string;

  constructor(historyPath = DEFAULT_HISTORY_PATH) {
    this.historyPath = resolve(historyPath);
  }

  async append(entry: ScanHistoryEntry): Promise<void> {
    await mkdir(dirname(this.historyPath), { recursive: true });
    await writeFile(this.historyPath, `${JSON.stringify(entry)}\n`, {
      encoding: "utf8",
      flag: "a",
    });
  }

  async getAll(): Promise<ScanHistoryEntry[]> {
    let content: string;
    try {
      content = await readFile(this.historyPath, "utf8");
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        return [];
      }
      throw err;
    }

    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as ScanHistoryEntry);
  }

  async query(options: ScanHistoryQueryOptions): Promise<ScanHistoryEntry[]> {
    const entries = await this.getAll();
    return entries.filter((entry) => {
      const timestamp = new Date(entry.timestamp);

      if (options.since && timestamp < options.since) {
        return false;
      }
      if (options.until && timestamp > options.until) {
        return false;
      }
      if (options.projectPath && entry.projectPath !== options.projectPath) {
        return false;
      }

      return true;
    });
  }

  async getTrends(days: number): Promise<DailyTrend[]> {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - Math.max(days - 1, 0));

    const entries = await this.query({ since });
    const trends = new Map<string, DailyTrend>();

    for (let offset = 0; offset < days; offset++) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + offset);
      const dateKey = date.toISOString().slice(0, 10);
      trends.set(dateKey, {
        date: dateKey,
        scans: 0,
        findingsCount: 0,
        bySeverity: emptySeverityCounts(),
      });
    }

    for (const entry of entries) {
      const dateKey = entry.timestamp.slice(0, 10);
      const trend = trends.get(dateKey);
      if (!trend) {
        continue;
      }

      trend.scans++;
      trend.findingsCount += entry.findingsCount;
      for (const [severity, count] of Object.entries(entry.bySeverity) as Array<
        [SeverityLevel, number]
      >) {
        trend.bySeverity[severity] += count;
      }
    }

    return [...trends.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  async getProjectStats(): Promise<ProjectStats[]> {
    const entries = await this.getAll();
    const stats = new Map<string, ProjectStats & { coverageTotal: number }>();

    for (const entry of entries) {
      const current = stats.get(entry.projectPath) ?? {
        projectPath: entry.projectPath,
        scans: 0,
        findingsCount: 0,
        lastScannedAt: entry.timestamp,
        averageCoveragePercent: 0,
        coverageTotal: 0,
      };

      current.scans++;
      current.findingsCount += entry.findingsCount;
      current.coverageTotal += entry.coveragePercent;
      current.averageCoveragePercent = current.coverageTotal / current.scans;
      if (entry.timestamp > current.lastScannedAt) {
        current.lastScannedAt = entry.timestamp;
      }

      stats.set(entry.projectPath, current);
    }

    return [...stats.values()]
      .map(({ coverageTotal: _coverageTotal, ...stat }) => stat)
      .sort((a, b) => b.lastScannedAt.localeCompare(a.lastScannedAt));
  }
}
