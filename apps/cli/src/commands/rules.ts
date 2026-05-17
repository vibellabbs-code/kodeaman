import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { loadConfig } from "@kodeaman/config";
import { RuleLoader } from "@kodeaman/custom-rules";
import * as logger from "../utils/logger.js";

interface RulesOptions {
  config?: string;
  rulesDir?: string;
}

function defaultRulesDir(repoRoot: string): string {
  return resolve(repoRoot, ".kodeaman", "rules");
}

function configuredRulesDir(repoRoot: string, config: { customRules?: { directory?: string } }, opts: RulesOptions): string {
  return resolve(repoRoot, opts.rulesDir ?? config.customRules?.directory ?? defaultRulesDir(repoRoot));
}

function ruleFiles(rulesDir: string): string[] {
  if (!existsSync(rulesDir)) {
    return [];
  }
  return readdirSync(rulesDir)
    .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
    .map((entry) => resolve(rulesDir, entry));
}

export function createRulesCommand(): Command {
  const cmd = new Command("rules").description("Manage custom KodeAman security rules");

  cmd
    .command("list")
    .description("List all custom rules loaded from config and rule files")
    .option("-c, --config <path>", "Path to config file")
    .option("--rules-dir <path>", "Directory containing .yml custom rules")
    .action((opts: RulesOptions) => {
      try {
        const repoRoot = process.cwd();
        const config = loadConfig(opts.config || repoRoot) as { customRules?: { directory?: string; rules?: unknown[] } };
        const loader = new RuleLoader();
        const rules = [
          ...loader.loadFromConfig(config as never),
          ...loader.loadFromDirectory(configuredRulesDir(repoRoot, config, opts)),
        ];

        if (rules.length === 0) {
          logger.info("No custom rules found.");
          return;
        }

        for (const rule of rules) {
          console.log(`${rule.id}\t${rule.severity}\t${rule.category}\t${rule.fileGlob}\t${rule.title}`);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  cmd
    .command("validate")
    .description("Validate custom rule files and inline config rules")
    .option("-c, --config <path>", "Path to config file")
    .option("--rules-dir <path>", "Directory containing .yml custom rules")
    .action((opts: RulesOptions) => {
      try {
        const repoRoot = process.cwd();
        const config = loadConfig(opts.config || repoRoot) as { customRules?: { directory?: string; rules?: unknown[] } };
        const loader = new RuleLoader();
        let hasErrors = false;

        for (const [index, rule] of (config.customRules?.rules ?? []).entries()) {
          try {
            loader.validate(rule);
            logger.success(`customRules.rules[${index}] is valid`);
          } catch (error) {
            hasErrors = true;
            logger.error(`customRules.rules[${index}]: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        const files = ruleFiles(configuredRulesDir(repoRoot, config, opts));
        for (const file of files) {
          for (const result of loader.validateRuleFile(file)) {
            if (result.valid) {
              logger.success(`${file}: ${result.rule?.id ?? "rule"} is valid`);
            } else {
              hasErrors = true;
              logger.error(`${file}: ${result.errors.join("; ")}`);
            }
          }
        }

        if (files.length === 0 && (config.customRules?.rules ?? []).length === 0) {
          logger.info("No custom rules found to validate.");
        }

        if (hasErrors) {
          process.exit(1);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return cmd;
}
