import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { CustomRulesConfig, KodeamanRule, RuleValidationResult } from "./types.js";

const severitySchema = z.enum(["info", "low", "medium", "high", "critical"]);
const categorySchema = z.enum([
  "sast",
  "dast",
  "sca",
  "secrets",
  "config",
  "auth",
  "input-validation",
  "xss",
  "sqli",
  "csrf",
  "file-upload",
  "ssrf",
  "rce",
  "info-leak",
  "misconfiguration",
  "other",
]);
const owaspCategorySchema = z.enum([
  "A01-broken-access-control",
  "A02-cryptographic-failures",
  "A03-injection",
  "A04-insecure-design",
  "A05-security-misconfiguration",
  "A06-vulnerable-components",
  "A07-auth-failures",
  "A08-data-integrity-failures",
  "A09-logging-monitoring-failures",
  "A10-ssrf",
]);

export const kodeamanRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  titleId: z.string().min(1),
  description: z.string().min(1),
  descriptionId: z.string().min(1),
  severity: severitySchema,
  category: categorySchema,
  pattern: z.string().min(1),
  fileGlob: z.string().min(1),
  owaspCategory: owaspCategorySchema.optional(),
  cwe: z.array(z.string().min(1)).optional(),
  remediation: z.array(z.string().min(1)),
  remediationId: z.array(z.string().min(1)),
});

export class RuleLoader {
  loadFromDirectory(rulesDir: string): KodeamanRule[] {
    if (!existsSync(rulesDir) || !statSync(rulesDir).isDirectory()) {
      return [];
    }

    return readdirSync(rulesDir)
      .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
      .flatMap((entry) => this.loadRuleFile(resolve(rulesDir, entry)));
  }

  loadFromConfig(config: { customRules?: CustomRulesConfig | KodeamanRule[] }): KodeamanRule[] {
    const customRules = config.customRules;
    if (!customRules) {
      return [];
    }

    const inlineRules = Array.isArray(customRules) ? customRules : customRules.rules ?? [];
    return inlineRules.map((rule) => this.validate(rule));
  }

  validate(rule: unknown): KodeamanRule {
    const parsed = kodeamanRuleSchema.safeParse(rule);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
    }

    try {
      new RegExp(parsed.data.pattern);
    } catch (error) {
      throw new Error(`pattern: ${error instanceof Error ? error.message : String(error)}`);
    }

    return parsed.data;
  }

  validateRuleFile(filePath: string): RuleValidationResult[] {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const parsed = parseYaml(raw) as unknown;
      const documents = Array.isArray(parsed) ? parsed : [parsed];

      return documents.map((document) => {
        try {
          return { valid: true, rule: this.validate(document), errors: [], filePath };
        } catch (error) {
          return {
            valid: false,
            errors: [error instanceof Error ? error.message : String(error)],
            filePath,
          };
        }
      });
    } catch (error) {
      return [{
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        filePath,
      }];
    }
  }

  validateDirectory(rulesDir: string): RuleValidationResult[] {
    if (!existsSync(rulesDir) || !statSync(rulesDir).isDirectory()) {
      return [];
    }

    return readdirSync(rulesDir)
      .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
      .flatMap((entry) => this.validateRuleFile(resolve(rulesDir, entry)));
  }

  private loadRuleFile(filePath: string): KodeamanRule[] {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = parseYaml(raw) as unknown;
    const documents = Array.isArray(parsed) ? parsed : [parsed];
    return documents.map((document) => this.validate(document));
  }
}
