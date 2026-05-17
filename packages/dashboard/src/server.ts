import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolve } from "node:path";
import { generateDashboardHtml } from "./html.js";
import { TelemetryReader, type DashboardScanEntry, type DashboardTrendPoint } from "./data-reader.js";

export interface DashboardServerOptions {
  port?: number;
  dataDir?: string;
}

export interface DashboardApiPayload {
  scans: ReturnType<TelemetryReader["getRecentScans"]>;
  trends: DashboardTrendPoint[];
  totalScans: number;
  totalFindings: number;
}

export class DashboardServer {
  private readonly port: number;
  private readonly dataDir: string;
  private readonly reader = new TelemetryReader();
  private server?: Server;
  private entries: DashboardScanEntry[] = [];

  constructor(options: DashboardServerOptions = {}) {
    this.port = options.port ?? 4800;
    this.dataDir = resolve(options.dataDir ?? ".kodeaman/telemetry");
  }

  async start(): Promise<void> {
    if (this.server) return;

    this.server = createServer((req, res) => {
      void this.handleRequest(req, res);
    });

    await new Promise<void>((resolveStart, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(this.port, () => {
        this.server?.off("error", reject);
        resolveStart();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    const server = this.server;
    this.server = undefined;
    await new Promise<void>((resolveStop, reject) => {
      server.close((error) => error ? reject(error) : resolveStop());
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    try {
      if (req.method !== "GET") {
        writeJson(res, 405, { error: "Method not allowed" });
        return;
      }

      if (url.pathname === "/") {
        await this.refreshEntries();
        writeHtml(res, generateDashboardHtml());
        return;
      }

      if (url.pathname === "/api/scans") {
        await this.refreshEntries();
        const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
        const scans = this.reader.getRecentScans(Number.isFinite(limit) ? limit : 20);
        writeJson(res, 200, {
          scans,
          totalScans: this.entries.length,
          totalFindings: this.entries.reduce((sum, entry) => sum + entry.totalFindings, 0),
        });
        return;
      }

      if (url.pathname === "/api/trends") {
        await this.refreshEntries();
        const periodDays = Number.parseInt(url.searchParams.get("periodDays") ?? "1", 10);
        writeJson(res, 200, {
          trends: this.reader.aggregateTrends(this.entries, Number.isFinite(periodDays) ? periodDays : 1),
        });
        return;
      }

      if (url.pathname.startsWith("/api/findings/")) {
        await this.refreshEntries();
        const scanId = decodeURIComponent(url.pathname.slice("/api/findings/".length));
        writeJson(res, 200, { scanId, findings: this.reader.getFindings(scanId) });
        return;
      }

      writeJson(res, 404, { error: "Not found" });
    } catch (error) {
      writeJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async refreshEntries(): Promise<void> {
    this.entries = await this.reader.readScanLogs(this.dataDir);
  }
}

function writeHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(html);
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
