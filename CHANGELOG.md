# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-05-16

### Added

- `@kodeaman/bot-gitea` -- Gitea and Forgejo webhook bot with HMAC-SHA256 signature validation, PR comment management, and scan pipeline integration via Hono
- `@kodeaman/telemetry` -- Scan telemetry collector and JSONL file writer for validation output, tracking scanner performance, finding counts, and timing data
- `@kodeaman/test-utils` -- Shared test utilities with `createMockFinding()` and `createMockFindings()` helpers for consistent test fixtures across packages
- `@kodeaman/vscode-extension` -- VS Code extension providing inline diagnostic overlays from KodeAman scan results, with severity mapping to VS Code diagnostic levels and one-click scan triggering
- Plugin system in `@kodeaman/core` with `KodeamanPlugin`, `PluginHooks`, and `PluginLoader` for community-contributed scanner adapters, supporting `beforeScan`, `afterScan`, `onFinding`, and `onError` lifecycle hooks
- `docs/mcp-integration.md` -- MCP server integration guide covering configuration for Claude Code, Cursor, Windsurf, and other AI coding assistants
- `docs/sarif-ide-integration.md` -- SARIF output format documentation with VS Code, JetBrains, and GitHub Code Scanning integration instructions
- `isDependencyDirect()` heuristic in `@kodeaman/prioritizer` -- detects direct dependencies in `dependencies`, `optionalDependencies`, and `peerDependencies` sections (+7 priority boost)
- `hasFixAvailable()` heuristic in `@kodeaman/prioritizer` -- detects findings with available fix commands or autofix eligibility (+6 priority boost)
- npm registry metadata (`publishConfig`, `repository`, `homepage`, `bugs`, `keywords`) across all 19 packages and 4 apps for npm publishing readiness

### Changed

- Prioritizer `computePriorityScore()` now factors in dependency directness and fix availability when scoring SCA findings
- All package.json files updated with consistent registry metadata for public npm publishing

## [0.3.0] - 2026-05-16

### Added

- `@kodeaman/mcp-server` -- Model Context Protocol server for AI-assisted security scanning with 8 tools: `scan`, `owasp-scan`, `preflight`, `list-scanners`, `explain-finding`, `suggest-fix`, `convert-sarif`, `coverage-report`
- MCP server auto-detection of npm projects: when a project contains `package.json`, `package-lock.json`, or `pnpm-lock.yaml`, the npm audit adapter activates automatically without requiring a `.kodeaman.yml` configuration file

### Fixed

- npm-audit adapter crash (`Cannot convert undefined or null to object`) when scanning projects without a `.kodeaman.yml` configuration file. The adapter now accepts both `targetPath` (npm-audit specific) and `repoRoot` (core pipeline) in its scan context, resolving the interface mismatch between the core `ScanContext` and the adapter's `NpmAuditScanContext`.
- npm-audit adapter now validates that `package.json` exists at the target path before running `npm audit`, providing a clear error message instead of an opaque crash when the file is missing.

### Changed

- Default configuration now enables `npmAudit: true` (previously `false`), so npm dependency scanning runs out of the box for Node.js projects.
- `loadProjectConfig()` in the MCP server pipeline helper now auto-detects npm projects by checking for `package.json`, `package-lock.json`, or `pnpm-lock.yaml` and enables the npm audit adapter even when no explicit scanner configuration exists.
- Rewrote README.md, CHANGELOG.md, and ROADMAP.md for clarity, structure, and completeness.

## [0.2.0] - 2026-05-16

### Added

- `docs/getting-started.md` -- CLI quickstart guide covering installation, configuration, and full option reference
- `docs/github-bot-setup.md` -- GitHub App registration, environment setup, and PR comment structure reference
- `docs/gitlab-bot-setup.md` -- GitLab access token setup, webhook configuration, and self-hosted support
- `docs/self-hosting/deployment.md` -- Docker Compose architecture, environment variables, and production checklist
- `examples/demo-node-express/` -- Vulnerable Express server demo with expected findings documentation
- `examples/demo-laravel/` -- Vulnerable Laravel demo with expected findings documentation
- `examples/demo-wordpress/` -- Vulnerable WordPress plugin demo with expected findings documentation
- `examples/configs/` -- Four annotated `.kodeaman.yml` example configurations: `cli-local.yml`, `github-bot.yml`, `gitlab-bot.yml`, `owasp-mode.yml`
- `@kodeaman/owasp` -- OWASP Top 10 scan orchestrator with per-category scanning, confidence gates, evidence gates, multi-scanner correlation, environment detection, and bilingual progress reporting
- `@kodeaman/adapters-npm-audit` -- npm/pnpm audit adapter mapping vulnerabilities to OWASP A06 with bilingual coaching
- `@kodeaman/output-html` -- Self-contained HTML evidence report with OWASP dashboard, severity breakdowns, evidence cards, gamification section, and light/dark/auto theme support
- `kodeaman owasp-scan` CLI command with options for format, language, categories, confidence gate, evidence gate, parallelism, and output path
- OWASP mode support in GitHub bot (Probot) and GitLab bot (Hono), activated via `owasp.enabled: true` in `.kodeaman.yml`
- `owasp` configuration section in `.kodeaman.yml` with `enabled`, `categories`, `parallel`, `confidenceGate`, `evidenceGate`, and `failOnSeverity` options
- `environment` configuration section in `.kodeaman.yml` with `skipWslCheck` and `scannerTimeout` options
- `npmAudit` scanner toggle and `html` output toggle in `.kodeaman.yml`
- `owaspCategory` optional field on `ScanContext` for per-category pipeline runs
- `OwaspScanPhaseResult` and `OwaspScanReport` types in `@kodeaman/schema`
- Package and app README files for all workspace folders

### Changed

- CLI version bumped to 0.2.0
- `@kodeaman/config` types extended with `OwaspScanConfig` and `EnvironmentConfig` interfaces
- Config defaults include OWASP and environment sections
- Config validation covers `owasp.confidenceGate` and `owasp.failOnSeverity`
- GitHub and GitLab bot handlers check `config.owasp.enabled` to select scan mode

## [0.1.0] - 2026-05-15

### Added

- Initial monorepo setup with pnpm workspaces and Turborepo
- `@kodeaman/schema` -- Canonical `NormalizedFinding` TypeScript interfaces and Zod validators
- `@kodeaman/core` -- Scan pipeline orchestrator with adapter registration, deduplication, and summary
- `@kodeaman/adapters-semgrep` -- Semgrep JSON output parser and normalizer
- `@kodeaman/adapters-zap` -- ZAP baseline JSON report parser and normalizer
- `@kodeaman/prioritizer` -- Priority scoring engine with severity, confidence, and context-aware heuristics
- `@kodeaman/coaching` -- 20 bilingual coaching templates (English + Bahasa Indonesia)
- `@kodeaman/i18n` -- Translator with en/id locale files and security glossary
- `@kodeaman/lessons` -- 10 bilingual micro-lessons for common security issues
- `@kodeaman/gamification` -- XP, badges, quests, and streak tracking
- `@kodeaman/presets` -- Laravel, Node/Express, and WordPress framework presets
- `@kodeaman/config` -- `.kodeaman.yml` config loader with defaults and validation
- `@kodeaman/output-markdown` -- PR comment renderer and CLI console renderer
- `@kodeaman/cli` -- CLI tool with `kodeaman scan` and `kodeaman init` commands
- `@kodeaman/bot-github` -- GitHub PR reviewer bot (Probot)
- `@kodeaman/bot-gitlab` -- GitLab MR reviewer bot (Hono)
- Docker Compose deployment setup
- Apache License 2.0
