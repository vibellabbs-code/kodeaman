import { describe, expect, it, vi } from "vitest";
import type { NormalizedFinding } from "@kodeaman/schema";
import { PluginLoader } from "../plugin-loader.js";
import { ScanPipeline } from "../pipeline.js";
import type { KodeamanPlugin, ScanContext, ScannerAdapter } from "../types.js";

vi.mock("kodeaman-test-plugin", () => ({
  default: {
    name: "test-plugin",
    adapters: [
      {
        name: "community-scanner",
        scan: async () => [],
      },
    ],
  },
}));

vi.mock("kodeaman-factory-plugin", () => ({
  plugin: () => ({
    name: "factory-plugin",
  }),
}));

function makeFinding(overrides: Partial<NormalizedFinding>): NormalizedFinding {
  return {
    schemaVersion: "1.0.0",
    findingId: "plugin:rule:abc123",
    dedupeKey: "plugin|file.ts|10|CWE-79",
    source: "semgrep",
    category: "xss",
    surface: "source-code",
    severity: "medium",
    confidence: "high",
    status: "open",
    title: "Plugin finding",
    description: "A plugin finding for unit tests.",
    location: {
      filePath: "file.ts",
      startLine: 10,
    },
    evidence: [],
    classification: {
      cwe: ["CWE-79"],
    },
    raw: {
      tool: "plugin-scanner",
      toolRuleId: "plugin.rule",
    },
    prioritization: {
      baseSeverity: "medium",
      adjustedSeverity: "medium",
      priorityScore: 50,
      confidenceScore: 80,
      reasons: ["Test reason"],
    },
    coaching: {
      titleEn: "Fix this",
      titleId: "Perbaiki ini",
      summaryEn: "Summary",
      summaryId: "Ringkasan",
      whyItMattersEn: "It matters",
      whyItMattersId: "Ini penting",
      remediationEn: ["Fix it"],
      remediationId: ["Perbaiki"],
    },
    gamification: {
      issueFamily: "xss",
    },
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultContext: ScanContext = {
  repoRoot: "/tmp/test-repo",
};

describe("PluginLoader", () => {
  it("loads enabled plugins and calls configure with plugin config", async () => {
    const loader = new PluginLoader();
    const plugins = await loader.load([
      {
        name: "test-plugin",
        package: "kodeaman-test-plugin",
        options: { ruleset: "community" },
      },
    ]);

    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe("test-plugin");
    expect(plugins[0].adapters?.[0].name).toBe("community-scanner");
  });

  it("skips disabled plugins", async () => {
    const loader = new PluginLoader();
    const plugins = await loader.load([
      { name: "test-plugin", package: "kodeaman-test-plugin", enabled: false },
    ]);

    expect(plugins).toHaveLength(0);
  });

  it("loads plugins exported from a factory", async () => {
    const loader = new PluginLoader();
    const plugins = await loader.load([
      { name: "factory-plugin", package: "kodeaman-factory-plugin" },
    ]);

    expect(plugins[0].name).toBe("factory-plugin");
  });
});

describe("ScanPipeline plugins", () => {
  it("registers plugin adapters and runs them", async () => {
    const finding = makeFinding({ findingId: "plugin:scanner:001" });
    const adapter: ScannerAdapter = {
      name: "community-scanner",
      scan: async () => [finding],
    };
    const plugin: KodeamanPlugin = {
      name: "community-plugin",
      adapters: [adapter],
    };
    const pipeline = new ScanPipeline();

    pipeline.registerPlugin(plugin);
    const result = await pipeline.run(defaultContext);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].findingId).toBe("plugin:scanner:001");
    expect(result.timing.adapterTimings["community-scanner"]).toBeDefined();
  });

  it("executes plugin hooks around scans", async () => {
    const events: string[] = [];
    const plugin: KodeamanPlugin = {
      name: "hook-plugin",
      hooks: {
        beforeScan: (context) => {
          events.push(`before:${context.repoRoot}`);
        },
        onAdapterRegistered: (adapter) => {
          events.push(`registered:${adapter.name}`);
        },
        afterScan: (result) => {
          events.push(`after:${result.findings.length}`);
          return {
            ...result,
            findings: [makeFinding({ findingId: "hook:added" })],
          };
        },
      },
    };
    const pipeline = new ScanPipeline();

    pipeline.registerPlugin(plugin);
    pipeline.registerAdapter({ name: "empty", scan: async () => [] });
    const result = await pipeline.run(defaultContext);

    expect(events).toEqual([
      "registered:empty",
      "before:/tmp/test-repo",
      "after:0",
    ]);
    expect(result.findings[0].findingId).toBe("hook:added");
  });
});
