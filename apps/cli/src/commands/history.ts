import { type DailyTrend, type ScanHistoryEntry, ScanHistoryStore } from "@kodeaman/history";
import { Command } from "commander";

interface HistoryShowOptions {
  limit: string;
  project?: string;
}

interface HistoryTrendsOptions {
  days: string;
}

interface HistoryExportOptions {
  format: "json" | "csv";
  project?: string;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  const headerLine = headers
    .map((header, index) => header.padEnd(widths[index] ?? header.length))
    .join("  ");
  const rowLines = rows.map((row) =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)).join("  "),
  );

  return [headerLine, separator, ...rowLines].join("\n");
}

function renderHistoryTable(entries: ScanHistoryEntry[]): string {
  const rows = entries.map((entry) => [
    entry.timestamp,
    truncate(entry.projectPath, 32),
    entry.scanMode,
    String(entry.findingsCount),
    `${entry.bySeverity.critical}/${entry.bySeverity.high}/${entry.bySeverity.medium}/${entry.bySeverity.low}/${entry.bySeverity.info}`,
    `${entry.coveragePercent.toFixed(1)}%`,
    entry.scannersUsed.join(", ") || "none",
  ]);

  return renderTable(
    ["Timestamp", "Project", "Mode", "Findings", "C/H/M/L/I", "Coverage", "Scanners"],
    rows,
  );
}

function renderTrendChart(trends: DailyTrend[]): string {
  const maxFindings = Math.max(1, ...trends.map((trend) => trend.findingsCount));
  const rows = trends.map((trend) => {
    const barLength = Math.round((trend.findingsCount / maxFindings) * 40);
    const bar = "#".repeat(barLength);
    return `${trend.date} ${String(trend.findingsCount).padStart(4)} ${bar} (${trend.scans} scans)`;
  });

  return rows.join("\n");
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsv(entries: ScanHistoryEntry[]): string {
  const headers = [
    "timestamp",
    "projectPath",
    "scanMode",
    "findingsCount",
    "critical",
    "high",
    "medium",
    "low",
    "info",
    "coveragePercent",
    "scannersUsed",
  ];
  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.projectPath,
    entry.scanMode,
    entry.findingsCount,
    entry.bySeverity.critical,
    entry.bySeverity.high,
    entry.bySeverity.medium,
    entry.bySeverity.low,
    entry.bySeverity.info,
    entry.coveragePercent,
    entry.scannersUsed.join(";"),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function createHistoryCommand(): Command {
  const cmd = new Command("history").description("Show scan history and trends");

  cmd
    .command("show")
    .description("Display recent scan history")
    .option("-l, --limit <number>", "Maximum rows to show", "10")
    .option("-p, --project <path>", "Filter by project path")
    .action(async (opts: HistoryShowOptions) => {
      const store = new ScanHistoryStore();
      const entries = opts.project
        ? await store.query({ projectPath: opts.project })
        : await store.getAll();
      const limit = Number.parseInt(opts.limit, 10);
      const recent = entries
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, Number.isFinite(limit) ? limit : 10);

      console.log(recent.length > 0 ? renderHistoryTable(recent) : "No scan history found.");
    });

  cmd
    .command("trends")
    .description("Show finding trends with an ASCII chart")
    .option("-d, --days <number>", "Number of days to include", "14")
    .action(async (opts: HistoryTrendsOptions) => {
      const days = Number.parseInt(opts.days, 10);
      const store = new ScanHistoryStore();
      const trends = await store.getTrends(Number.isFinite(days) && days > 0 ? days : 14);
      console.log(renderTrendChart(trends));
    });

  cmd
    .command("export")
    .description("Export scan history")
    .option("-f, --format <format>", "Export format (json|csv)", "json")
    .option("-p, --project <path>", "Filter by project path")
    .action(async (opts: HistoryExportOptions) => {
      const store = new ScanHistoryStore();
      const entries = opts.project
        ? await store.query({ projectPath: opts.project })
        : await store.getAll();

      if (opts.format === "csv") {
        console.log(renderCsv(entries));
        return;
      }

      console.log(JSON.stringify(entries, null, 2));
    });

  return cmd;
}
