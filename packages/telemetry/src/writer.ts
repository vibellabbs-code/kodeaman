import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { TelemetryCollector } from "./collector.js";
import type { TelemetryEvent, TelemetryInput, TelemetryWriterOptions } from "./types.js";

export class TelemetryWriter {
  private readonly collector: TelemetryCollector;

  constructor(private readonly options: TelemetryWriterOptions, collector = new TelemetryCollector()) {
    this.collector = collector;
  }

  async write(input: TelemetryInput, metadata?: Record<string, unknown>): Promise<TelemetryEvent> {
    const event = this.collector.collect(input, metadata);
    await this.writeEvent(event);
    return event;
  }

  async writeEvent(event: TelemetryEvent): Promise<void> {
    await mkdir(dirname(this.options.outputPath), { recursive: true });

    const format = this.options.format ?? inferFormat(this.options.outputPath);
    const payload = format === "jsonl"
      ? `${JSON.stringify(event)}\n`
      : `${JSON.stringify(event, null, 2)}\n`;

    await writeFile(this.options.outputPath, payload, {
      encoding: "utf8",
      flag: this.options.append ? "a" : "w",
    });
  }
}

function inferFormat(outputPath: string): "json" | "jsonl" {
  return outputPath.endsWith(".jsonl") ? "jsonl" : "json";
}
