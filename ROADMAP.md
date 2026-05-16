# Roadmap

This roadmap tracks product milestones for KodeAman. Each sprint represents roughly one week of development.

---

## Sprint 0 -- Repository Foundation

- [x] Initialize monorepo with pnpm workspaces, Turborepo, and TypeScript strict mode
- [x] Add Apache 2.0 license and governance files
- [x] Create `@kodeaman/schema` with `NormalizedFinding` types and validators
- [x] Set up CI workflow with GitHub Actions
- [x] Create issue templates and labels
- [x] Add README, ROADMAP, CONTRIBUTING, and AGENTS.md

## Sprint 1 -- Core Scan Pipeline

- [x] Build CLI skeleton with `kodeaman scan` command
- [x] Implement Semgrep SAST adapter and parser
- [x] Add markdown output package for PR comments and console reports
- [x] Build prioritizer v0 with severity and confidence scoring
- [x] Write 10 bilingual coaching templates (Bahasa Indonesia + English)
- [x] Add `examples/demo-node-express` demo project

## Sprint 2 -- GitHub PR Bot

- [x] Scaffold GitHub bot app with Probot
- [x] Connect bot to core scan pipeline
- [x] Implement PR comment formatting with top 3 prioritized findings
- [x] Add badges and XP notes to PR comments
- [x] Add `.kodeaman.yml` configuration file support
- [ ] Pilot dry run on 2 demo repositories
- [ ] Improve false positive presentation and noise reduction

## Sprint 3 -- GitLab, Lessons, and Self-Hosting

- [x] Scaffold GitLab webhook service with Hono
- [x] Reuse core pipeline in GitLab bot
- [x] Add Docker Compose deployment configuration
- [x] Build micro-lesson registry with lesson linking
- [x] Create Laravel preset v0
- [ ] Add validation telemetry file output
- [ ] Pilot with 3-4 external repositories

## Sprint 4 -- OWASP Top 10 and npm Audit

- [x] Add ZAP DAST baseline adapter
- [x] Build OWASP Top 10 scan mode with per-category orchestration
- [x] Add HTML evidence report output with OWASP dashboard
- [x] Implement npm audit adapter for SCA (OWASP A06)
- [x] Document OWASP evidence policy and scanner coverage expectations
- [x] Write onboarding documentation for GitHub, GitLab, CLI, and self-hosting
- [x] Improve prioritizer with context flags (direct vs transitive dependency, fix availability)
- [ ] Add 10 more bilingual coaching templates
- [ ] Run 15 developer interviews and collect pilot feedback

## Sprint 5 -- MCP Server and Vibe Coding

- [x] Build `@kodeaman/mcp-server` with 8 MCP tools
- [x] Fix npm-audit adapter interface mismatch (`repoRoot` vs `targetPath`)
- [x] Enable config-less scanning with auto-detection of npm projects
- [x] Validate adapter resilience when scanning projects without `.kodeaman.yml`
- [x] Add MCP server documentation to docs site
- [ ] Publish MCP server to npm registry
- [ ] Test MCP integration with Cursor, Windsurf, and other AI coding assistants

## Sprint 6 -- Plugin System, IDE Integration, and Gitea Support

- [x] Build plugin system in `@kodeaman/core` with lifecycle hooks (`beforeScan`, `afterScan`, `onFinding`, `onError`)
- [x] Add `PluginLoader` for dynamic plugin discovery and validation
- [x] Build `@kodeaman/bot-gitea` with HMAC-SHA256 webhook verification and Forgejo compatibility
- [x] Build `@kodeaman/vscode-extension` with inline diagnostics and scan command
- [x] Add SARIF output documentation for VS Code and JetBrains integration
- [x] Add `@kodeaman/telemetry` with JSONL file writer for scan validation output
- [x] Add `@kodeaman/test-utils` with shared mock finding factories
- [x] Add npm registry metadata to all packages for publishing readiness
- [ ] Publish all packages to npm registry
- [ ] Submit VS Code extension to Visual Studio Marketplace
- [ ] End-to-end test Gitea bot with Forgejo instance
- [ ] Add 10 more bilingual coaching templates

## Repository Organization

- [x] Source code lives in `apps/*/src` and `packages/*/src`
- [x] Root operational files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `tsconfig.base.json`, `docker-compose.yml`
- [x] GitHub configuration under `.github/` (issue templates, workflows, CODEOWNERS)
- [x] README files beside all app and package folders
- [x] Onboarding guides under `docs/`
- [x] Demo projects under `examples/`
- [x] Example `.kodeaman.yml` configurations under `examples/configs/`

---

## Future

- Advanced autofix patch generation
- Team leaderboard and challenge quests
- Lightweight analytics dashboard
- Multi-language support beyond Bahasa Indonesia and English
- Enterprise policy engine with custom rule authoring
