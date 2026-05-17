#!/usr/bin/env node
import { Command } from "commander";
import { createAutofixCommand } from "./commands/autofix.js";
import { createDashboardCommand } from "./commands/dashboard.js";
import { createHistoryCommand } from "./commands/history.js";
import { createInitCommand } from "./commands/init.js";
import { createOwaspScanCommand } from "./commands/owasp-scan.js";
import { createRulesCommand } from "./commands/rules.js";
import { createScanCommand } from "./commands/scan.js";
import { createWatchCommand } from "./commands/watch.js";

const program = new Command();

program
  .name("kodeaman")
  .description("KodeAman — Security coach for Indonesian developers")
  .version("0.2.0");

program.addCommand(createScanCommand());
program.addCommand(createInitCommand());
program.addCommand(createOwaspScanCommand());
program.addCommand(createWatchCommand());
program.addCommand(createAutofixCommand());
program.addCommand(createDashboardCommand());
program.addCommand(createHistoryCommand());
program.addCommand(createRulesCommand());

program.parse();
