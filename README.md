# KodeAman

[![CI](https://github.com/vibellabbs-code/kodeaman/actions/workflows/ci.yml/badge.svg)](https://github.com/vibellabbs-code/kodeaman/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Release](https://img.shields.io/github/v/tag/vibellabbs-code/kodeaman?label=version&color=green)](https://github.com/vibellabbs-code/kodeaman/tags)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm)
[![Last Commit](https://img.shields.io/github/last-commit/vibellabbs-code/kodeaman)](https://github.com/vibellabbs-code/kodeaman/commits/main)

**Baca dalam bahasa lain**: [Bahasa Indonesia](./README.id.md) _(segera hadir)_

Open-core security coach for Indonesian developers. Scans your code, prioritizes findings by real-world risk, and teaches developers how to fix issues — in **Bahasa Indonesia** or English — with contextual explanations, fix suggestions, and micro-lessons.

![Nano Banana Civilization](assets/concept-art/nano-banana-v1-bioluminescent-jungle.jpg)

![KodeAman demo](docs/demo.gif)

> *"Kode Aman" (Bahasa Indonesia) = "Secure Code"*

## Why KodeAman

Most SAST/DAST tools produce hundreds of findings, provide only English guidance, and assume senior-level security expertise. Indonesian development teams — startups, campus labs, government digitization projects — end up ignoring noise or copy-pasting fixes they don't understand. Vulnerabilities stay open and learning never happens.

KodeAman changes that:

- **Educates, not just alerts** — every finding includes a bilingual explanation (Bahasa Indonesia + English) with remediation steps, code examples, and a linked micro-lesson. Developers learn *why* a vulnerability matters, not just that it exists
- **Prioritizes by real-world risk** — scores findings using severity, confidence, auth-path proximity, internet exposure, dependency directness, fix availability, and production context. The top 3 highest-risk findings surface first
- **Supports 8 scanners across 6 languages** — Semgrep (SAST), ZAP (DAST), npm audit (SCA), Bandit (Python), gosec (Go), cargo-audit (Rust), SpotBugs (Java), and Playwright (browser)
- **OWASP Top 10 structured scanning** — orchestrated scan mode that organizes findings by OWASP category (A01–A10) with evidence gates, confidence gates, and multi-scanner correlation
- **Gamifies secure coding** — XP, streaks, badges, and quests make security improvements measurable and motivating
- **Integrates everywhere** — CLI, GitHub bot, GitLab bot, Gitea/Forgejo bot, VS Code extension, MCP server for AI coding assistants, Docker Compose self-hosting
- **80+ coaching templates** — bilingual remediation guidance for common vulnerability patterns across frameworks

## Quick Start

### CLI (recommended)

```bash
git clone https://github.com/vibellabbs-code/kodeaman.git
cd kodeaman
pnpm install
pnpm run build

# Scan a project directory
pnpm --filter @kodeaman/cli start -- scan ./my-project

# OWASP Top 10 scan with HTML report
pnpm --filter @kodeaman/cli start -- owasp-scan --format html --output report.html
```

### MCP Server (AI coding assistants)

Add to your Claude Code, Cursor, or Windsurf MCP config:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "node",
      "args": ["path/to/kodeaman/packages/mcp-server/dist/index.js"]
    }
  }
}
```

Works without configuration files. Projects with `package.json` automatically get npm audit scanning.

### Docker (self-hosted bots)

```bash
cp .env.example .env
# Edit .env with your GitHub/GitLab tokens
docker compose up -d
```

See [docs/self-hosting/deployment.md](./docs/self-hosting/deployment.md) for production setup.

## Features

### Scanning and Analysis

- **Multi-scanner pipeline** — register any combination of SAST, DAST, and SCA scanners via the adapter interface
- **Smart deduplication** — identical findings from multiple scanners are merged, not counted twice
- **Priority scoring** — 10+ heuristics including severity, confidence, auth-path proximity, internet exposure, dependency directness, fix availability, and production environment context
- **OWASP Top 10 mode** — orchestrated scanning organized by category (A01–A10) with evidence gates, confidence gates, and multi-scanner correlation that boosts confidence when SAST and DAST find the same issue
- **Plugin system** — community-contributed scanner adapters with `beforeScan`, `afterScan`, `onFinding`, and `onError` lifecycle hooks

### Education and Coaching

- **Bilingual coaching** — every finding includes remediation guidance in Bahasa Indonesia and English, with code examples specific to the vulnerability
- **Micro-lessons** — 10 structured lessons covering OWASP Top 10 categories, linked from findings so developers learn in context
- **Framework presets** — Laravel, Node/Express, and WordPress presets that tune scanner rules and coaching for your stack
- **Security glossary** — `@kodeaman/i18n` includes a bilingual security glossary so Indonesian developers can learn standard terminology

### Gamification

- **XP rewards** — earn points for fixing findings. Higher severity = more XP
- **Badges** — unlock achievements for fixing specific vulnerability categories
- **Streaks** — maintain daily/weekly streaks to build consistent security habits
- **Quests** — targeted challenges like "Fix all SQL injection findings this sprint"

### Integration

- **CLI** — 8 commands: `scan`, `init`, `owasp-scan`, `watch`, `autofix`, `rules`, `dashboard`, `history`
- **GitHub bot** — Probot app that comments on PRs with top 3 prioritized findings, badges, and XP notes
- **GitLab bot** — Hono webhook service for MR review comments
- **Gitea/Forgejo bot** — HMAC-SHA256 verified webhook bot with PR comment management
- **VS Code extension** — inline diagnostic overlays from scan results with severity mapping and one-click scan triggering
- **MCP server** — 8 tools for AI-assisted security scanning (see [MCP Tools](#mcp-server) below)
- **Docker Compose** — production-ready self-hosted deployment for all bots

### Reporting

- **Markdown** — PR comment renderer and CLI console renderer
- **HTML** — self-contained report with OWASP dashboard, severity breakdowns, evidence cards, gamification section, and light/dark/auto theme
- **SARIF** — standard format for VS Code, JetBrains, and GitHub Code Scanning integration
- **Telemetry** — JSONL file writer for scan validation output, tracking scanner performance and timing

### Developer Workflow

- **Watch mode** — real-time file monitoring with debounced scan triggers for continuous security feedback during development
- **Autofix** — automated execution of fix commands from scan findings with dry-run mode and breaking-change safety gates
- **Custom rules** — YAML rule definitions with regex pattern matching and Zod schema validation
- **Dashboard** — lightweight web dashboard with SVG trend charts, OWASP coverage grid, and recent scans table
- **History** — scan history storage with JSONL persistence, date/project filtering, trend aggregation, and team collaboration

## CLI Commands

```bash
# Core scanning
kodeaman scan [path]              # Run security scan on a directory
kodeaman owasp-scan [options]     # OWASP Top 10 structured scan
kodeaman init                     # Generate .kodeaman.yml config file

# Development workflow
kodeaman watch [path]             # Real-time file monitoring with auto-scan
kodeaman autofix [options]        # Execute fix commands from scan findings
kodeaman rules list|validate      # Manage custom security rules

# Reporting and history
kodeaman dashboard                # Launch web dashboard (port 4800)
kodeaman history show|trends|export  # View scan history and trends
```

### Scan Options

```bash
# Output formats
kodeaman scan ./project --format markdown    # Console/PR output (default)
kodeaman scan ./project --format json        # Machine-readable JSON
kodeaman scan ./project --format sarif       # IDE/CI integration
kodeaman scan ./project --format html        # Self-contained HTML report

# Language
kodeaman scan ./project --language id        # Bahasa Indonesia coaching
kodeaman scan ./project --language en        # English coaching (default)

# OWASP scan options
kodeaman owasp-scan --categories A01,A03,A07  # Specific categories only
kodeaman owasp-scan --confidence medium       # Minimum confidence gate
kodeaman owasp-scan --no-evidence-gate        # Skip evidence requirement
kodeaman owasp-scan --parallel                # Run categories in parallel
```

## MCP Server

The `@kodeaman/mcp-server` exposes KodeAman as a Model Context Protocol server for AI coding assistants (Claude Code, Cursor, Windsurf, and others).

| Tool | Description |
|------|-------------|
| `kodeaman_scan` | Run a full security scan on a project directory |
| `kodeaman_owasp_scan` | Run an OWASP Top 10 structured scan |
| `kodeaman_preflight` | Check scanner availability before scanning |
| `kodeaman_list_scanners` | List all registered scanner adapters |
| `kodeaman_explain_finding` | Get a detailed bilingual explanation of a finding |
| `kodeaman_suggest_fix` | Get fix suggestions with code examples |
| `kodeaman_convert_sarif` | Convert scan results to SARIF format |
| `kodeaman_coverage_report` | Generate an OWASP category coverage report |

Auto-detection: projects with `package.json`, `package-lock.json`, or `pnpm-lock.yaml` automatically get npm audit scanning without any `.kodeaman.yml` configuration.

See [docs/mcp-integration.md](./docs/mcp-integration.md) for setup instructions across different AI assistants.

## OWASP Top 10 Scan Mode

KodeAman supports structured scanning organized by OWASP Top 10 (2021) categories A01–A10.

### How It Works

1. The scan pipeline runs **once** across all registered adapters
2. Findings are **distributed** across OWASP categories by CWE mapping — each finding appears in exactly one category
3. **Confidence gates** filter low-confidence findings (configurable: `low`, `medium`, `high`)
4. **Evidence gates** require scanner evidence by default (override with `--no-evidence-gate`)
5. **Multi-scanner correlation** — when SAST and DAST scanners find the same issue (matching CWE + overlapping location), both findings get a confidence boost to `high`

### Evidence Policy

- Findings require scanner evidence by default
- Web findings require proof artifacts: HTML report, terminal snapshot, HTTP request, or HTTP response
- Evidence artifacts let reviewers verify that findings came from real scanner runs, not hallucinated reports

### Scanner Coverage

| Scanner | Type | Languages | OWASP Categories |
|---------|------|-----------|------------------|
| Semgrep | SAST | JS/TS, Python, Java, Go, Ruby, PHP | A01, A02, A03, A07, A08, A10 |
| ZAP | DAST | Any web application | A01, A02, A03, A05, A07 |
| npm audit | SCA | Node.js | A06 |
| Bandit | SAST | Python | A01, A02, A03, A07 |
| gosec | SAST | Go | A01, A02, A03, A07 |
| cargo-audit | SCA | Rust | A06 |
| SpotBugs | SAST | Java | A01, A02, A03, A07, A10 |

## Architecture

KodeAman is a TypeScript monorepo with **30 packages** and **5 apps** using pnpm workspaces and Turborepo.

```
kodeaman/
├── apps/
│   ├── cli/               # kodeaman CLI (8 commands)
│   ├── bot-github/         # GitHub PR reviewer (Probot)
│   ├── bot-gitlab/         # GitLab MR reviewer (Hono)
│   ├── bot-gitea/          # Gitea/Forgejo webhook bot
│   └── docs-site/          # Documentation website
├── packages/
│   ├── schema/             # NormalizedFinding types + Zod validators
│   ├── core/               # Scan pipeline, dedup, plugin system
│   ├── config/             # .kodeaman.yml loader + validation
│   ├── prioritizer/        # Priority scoring engine (10+ heuristics)
│   ├── owasp/              # OWASP Top 10 orchestrator
│   ├── adapters-semgrep/   # Semgrep SAST adapter
│   ├── adapters-zap/       # ZAP DAST adapter
│   ├── adapters-npm-audit/ # npm audit SCA adapter
│   ├── adapters-bandit/    # Python Bandit SAST adapter
│   ├── adapters-gosec/     # Go gosec SAST adapter
│   ├── adapters-cargo-audit/ # Rust cargo-audit SCA adapter
│   ├── adapters-spotbugs/  # Java SpotBugs SAST adapter
│   ├── adapters-playwright/# Playwright browser adapter
│   ├── coaching/           # 20+ bilingual coaching templates
│   ├── lessons/            # 10 bilingual micro-lessons
│   ├── i18n/               # Translator + security glossary
│   ├── gamification/       # XP, badges, quests, streaks
│   ├── presets/            # Laravel, Express, WordPress presets
│   ├── output-markdown/    # PR comment + console renderer
│   ├── output-html/        # Self-contained HTML report
│   ├── output-sarif/       # SARIF output for IDEs
│   ├── mcp-server/         # MCP server (8 tools)
│   ├── watcher/            # File watcher for real-time scanning
│   ├── autofix/            # Automated fix runner
│   ├── custom-rules/       # Custom YAML rule engine
│   ├── dashboard/          # Web dashboard with trend charts
│   ├── history/            # Scan history + team collaboration
│   ├── telemetry/          # JSONL scan validation output
│   ├── vscode-extension/   # VS Code inline diagnostics
│   └── test-utils/         # Shared mock finding factories
├── docs/                   # Onboarding guides
├── examples/               # Demo projects + config examples
└── docker-compose.yml      # Self-hosted deployment
```

### Data Flow

```
Source Code
    │
    ▼
┌─────────────────────────────────────────┐
│  Scanner Adapters (Semgrep, ZAP, ...)   │
│  Each adapter produces NormalizedFinding │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  ScanPipeline                            │
│  1. Run all registered adapters          │
│  2. Deduplicate findings                 │
│  3. Prioritize (10+ heuristics)          │
│  4. Build summary + coverage report      │
└────────────────┬────────────────────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
   Markdown    HTML     SARIF
   (PR/CLI)  (Report)  (IDE/CI)
```

## Configuration

KodeAman uses a `.kodeaman.yml` file in your project root. Generate one with `kodeaman init`.

```yaml
# .kodeaman.yml
language: id                    # Coaching language: "en" or "id"

scanners:
  semgrep: true                 # Enable Semgrep SAST
  npmAudit: true                # Enable npm audit SCA
  zapBaseline: false            # Enable ZAP DAST (needs target URL)

output:
  markdown: true                # PR comment / console output
  html: false                   # Self-contained HTML report
  sarif: false                  # SARIF for IDE integration

owasp:
  enabled: false                # Enable OWASP Top 10 scan mode
  categories: [A01, A02, A03, A04, A05, A06, A07, A08, A09, A10]
  parallel: false               # Run categories in parallel
  confidenceGate: low           # Minimum confidence: low | medium | high
  evidenceGate: true            # Require scanner evidence
  failOnSeverity: high          # Fail CI on this severity or above

environment:
  skipWslCheck: false           # Skip WSL detection
  scannerTimeout: 120000        # Scanner timeout in ms
```

See [examples/configs/](./examples/configs/) for annotated configurations: CLI local, GitHub bot, GitLab bot, and OWASP mode.

## Tests

```bash
pnpm test              # Run all tests (Vitest)
pnpm run typecheck     # Type-check all packages (tsc --noEmit)
pnpm lint              # Lint all packages (Biome)
```

Tests cover scan pipeline logic, adapter parsing, priority scoring, OWASP orchestration, coverage reporting, coaching template resolution, and npm-audit remediation text accuracy.

## CI

GitHub Actions runs on every push/PR to `main`:

1. **Install** — `pnpm install --frozen-lockfile`
2. **Build** — `pnpm run build` (34 packages)
3. **Typecheck** — `pnpm run typecheck`
4. **Test** — `pnpm test` (80+ tests)
5. **Lint** — `pnpm lint`

See [.github/workflows/ci.yml](./.github/workflows/ci.yml).

## Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript (strict mode, ES2022, NodeNext) |
| Runtime | Node.js >= 20 |
| Package manager | pnpm workspaces |
| Build orchestrator | Turborepo |
| Test framework | Vitest |
| Linter/formatter | Biome |
| Schema validation | Zod |
| CLI framework | Commander.js |
| GitHub bot | Probot |
| GitLab/Gitea bot | Hono |
| Containerization | Docker Compose |

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | CLI installation, configuration, and full option reference |
| [GitHub Bot Setup](./docs/github-bot-setup.md) | GitHub App registration, environment setup, and PR comment structure |
| [GitLab Bot Setup](./docs/gitlab-bot-setup.md) | Access token setup, webhook configuration, and self-hosted support |
| [Self-Hosting](./docs/self-hosting/deployment.md) | Docker Compose architecture, environment variables, and production checklist |
| [MCP Integration](./docs/mcp-integration.md) | MCP server setup for Claude Code, Cursor, Windsurf, and other AI assistants |
| [SARIF IDE Integration](./docs/sarif-ide-integration.md) | SARIF output for VS Code, JetBrains, and GitHub Code Scanning |

## Open-Core Model

| Layer | License | Contents |
|-------|---------|----------|
| Core engine | Apache 2.0 | Scan pipeline, adapters, coaching, CLI, GitHub/GitLab/Gitea bots, MCP server, VS Code extension |
| Community presets | Apache 2.0 | Rule packs, lesson sets, and translations contributed by the community |
| Pro (future) | Commercial | Org dashboard, SSO, advanced analytics, priority support |

## Who It Is For

- **Indonesian startups** shipping fast and concerned about OWASP Top 10
- **University CS programs** teaching secure development in Bahasa Indonesia
- **Government digital-service teams** meeting compliance requirements
- **Any team** that wants actionable, educational security feedback — not a wall of CVEs

## Principles

- **Education over alerts** — every finding is a teaching moment
- **Bahasa-first, global-ready** — internationalization from day one
- **Pluggable** — bring your own scanner, coaching pack, or lesson set
- **Privacy-respecting** — your code stays on your infrastructure
- **Community-driven** — presets, lessons, and translations are open contributions

## Contributing

We welcome contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

We are looking for:

- **Indonesian developers** to shape coaching content
- **Security engineers** to curate and validate rule packs
- **Translators** for Bahasa Indonesia lesson content
- **Educators** teaching secure coding at Indonesian universities
- **Open-source contributors** interested in developer tooling

## Pilot Program

We are running early pilot programs with Indonesian development teams. If your team wants early access, roadmap influence, or hands-on setup support, open a [Pilot Feedback issue](https://github.com/vibellabbs-code/kodeaman/issues/new?template=pilot_feedback.yml) or contact the maintainers.

## License

[Apache License 2.0](./LICENSE)

Copyright 2026 Vibellabbs Code.
