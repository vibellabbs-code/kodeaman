import { Command } from "commander";
import { resolve } from "node:path";
import { DashboardServer } from "@kodeaman/dashboard";
import * as logger from "../utils/logger.js";

interface DashboardOptions {
  port: string;
  dataDir?: string;
}

export function createDashboardCommand(): Command {
  return new Command("dashboard")
    .description("Start the KodeAman security trends dashboard")
    .option("--port <port>", "Port to listen on", "4800")
    .option("--data-dir <path>", "Telemetry JSONL data directory", ".kodeaman/telemetry")
    .action(async (opts: DashboardOptions) => {
      const port = Number.parseInt(opts.port, 10);
      if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        logger.error(`Invalid port: ${opts.port}`);
        process.exit(1);
      }

      const dataDir = resolve(process.cwd(), opts.dataDir ?? ".kodeaman/telemetry");
      const server = new DashboardServer({ port, dataDir });

      const stop = async () => {
        await server.stop();
        process.exit(0);
      };
      process.once("SIGINT", () => { void stop(); });
      process.once("SIGTERM", () => { void stop(); });

      try {
        await server.start();
        logger.success(`KodeAman dashboard running at http://localhost:${port}`);
        logger.info(`Reading telemetry from ${dataDir}`);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
