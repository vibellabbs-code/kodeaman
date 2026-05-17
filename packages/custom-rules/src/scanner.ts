import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import type { ScannerAdapter, ScanContext } from "@kodeaman/core";
import type { NormalizedFinding, RepoContext } from "@kodeaman/schema";
import { RuleLoader } from "./loader.js";
import type { KodeamanRule } from "./types.js";

function escapeRegex(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(glob: string): RegExp {
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    const next = glob[i + 1];
    if (char === "*" && next === "*") {
      pattern += ".*";
      i++;
    } else if (char === "*") {
      pattern += "[^/]*";
    } else if (char === "?") {
      pattern += "[^/]";
    } else {
      pattern += escapeRegex(char);
    }
  }
  return new RegExp(`^${pattern}$`);
}

function listFiles(directory: string): string[] {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (["node_modules", ".git", "dist", "build"].includes(entry)) {
      continue;
    }
    const fullPath = resolve(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function getLineInfo(content: string, index: number, length: number): { startLine: number; endLine: number; startColumn: number; endColumn: number; snippet: string } {
  const before = content.slice(0, index);
  const matchText = content.slice(index, index + length);
  const startLine = before.split("\n").length;
  const startColumn = before.length - before.lastIndexOf("\n");
  const endLine = startLine + matchText.split("\n").length - 1;
  const endColumn = endLine === startLine ? startColumn + length : matchText.split("\n").at(-1)?.length ?? 1;
  const snippet = content.split("\n")[startLine - 1] ?? matchText;
  return { startLine, endLine, startColumn, endColumn, snippet };
}

function hash(value: string): string {
  let result = 0;
  for (let i = 0; i < value.length; i++) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0;
  }
  return result.toString(16);
}

export class CustomRuleScanner implements ScannerAdapter {
  readonly name = "custom-rules";
  private readonly loader: RuleLoader;

  constructor(loader = new RuleLoader()) {
    this.loader = loader;
  }

  async scan(context: ScanContext): Promise<NormalizedFinding[]> {
    const config = context as ScanContext & { config?: { customRules?: unknown } };
    const rules = this.loadRules(context.repoRoot, config.config);
    const findings: NormalizedFinding[] = [];

    for (const rule of rules) {
      const fileMatcher = globToRegex(rule.fileGlob.replaceAll(sep, "/"));
      const files = listFiles(context.repoRoot).filter((file) => fileMatcher.test(relative(context.repoRoot, file).replaceAll(sep, "/")));

      for (const file of files) {
        const content = readFileSync(file, "utf-8");
        const pattern = new RegExp(rule.pattern, "gmu");
        for (const match of content.matchAll(pattern)) {
          if (match.index === undefined) {
            continue;
          }
          findings.push(this.toFinding(rule, context, file, content, match.index, match[0]));
        }
      }
    }

    return findings;
  }

  private loadRules(repoRoot: string, config?: { customRules?: unknown }): KodeamanRule[] {
    const configured = config ? this.loader.loadFromConfig(config as never) : [];
    const rulesDir = resolve(repoRoot, ".kodeaman", "rules");
    return [...configured, ...this.loader.loadFromDirectory(rulesDir)];
  }

  private toFinding(rule: KodeamanRule, context: ScanContext, filePath: string, content: string, index: number, match: string): NormalizedFinding {
    const relativePath = relative(context.repoRoot, filePath).replaceAll(sep, "/");
    const lineInfo = getLineInfo(content, index, match.length);
    const findingId = `custom-${hash(`${rule.id}:${relativePath}:${lineInfo.startLine}:${lineInfo.startColumn}`)}`;
    const repoContext: RepoContext | undefined = context.repoContext ?? (context.provider ? { provider: context.provider } : undefined);

    return {
      schemaVersion: "1.0.0",
      findingId,
      dedupeKey: `${rule.id}:${relativePath}:${lineInfo.startLine}:${lineInfo.startColumn}`,
      source: "custom",
      category: rule.category,
      surface: "source-code",
      owaspCategory: rule.owaspCategory,
      severity: rule.severity,
      confidence: "high",
      status: "open",
      title: rule.title,
      description: rule.description,
      location: {
        filePath: relativePath,
        startLine: lineInfo.startLine,
        endLine: lineInfo.endLine,
        startColumn: lineInfo.startColumn,
        endColumn: lineInfo.endColumn,
        snippet: lineInfo.snippet,
      },
      evidence: [{ type: "code", label: "Custom rule match", content: match }],
      classification: {
        cwe: rule.cwe,
        owaspCategories: rule.owaspCategory ? [rule.owaspCategory] : undefined,
      },
      raw: {
        tool: "custom",
        toolRuleId: rule.id,
        toolFindingId: findingId,
        rawSeverity: rule.severity,
        rawCategory: rule.category,
      },
      repoContext,
      prioritization: {
        baseSeverity: rule.severity,
        adjustedSeverity: rule.severity,
        priorityScore: 0,
        confidenceScore: 90,
        reasons: [],
      },
      coaching: {
        titleEn: rule.title,
        titleId: rule.titleId,
        summaryEn: rule.description,
        summaryId: rule.descriptionId,
        whyItMattersEn: rule.description,
        whyItMattersId: rule.descriptionId,
        remediationEn: rule.remediation,
        remediationId: rule.remediationId,
      },
      gamification: {
        issueFamily: rule.category,
      },
      detectedAt: new Date().toISOString(),
    };
  }
}
