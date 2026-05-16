# Roadmap

This roadmap tracks product milestones and repository-organization work for KodeAman. Source code should remain in the owning `apps/*/src` or `packages/*/src` folder, generated output should stay out of source edits, and package/app-level documentation should live beside the package or app it describes.

## Sprint 0 — Repo Ready (Week 0)

- [x] Initialize monorepo with pnpm + turbo + TypeScript
- [x] Add Apache 2.0 license and governance files
- [x] Create schema package with NormalizedFinding
- [x] Set up CI workflow
- [x] Create issue templates and labels
- [x] Add README and ROADMAP
- [x] Add repository agent instructions in `AGENTS.md`

## Sprint 1 — Core Scan Flow (Week 1)

- [x] Build CLI skeleton `kodeaman scan`
- [x] Add Semgrep adapter parser
- [x] Add markdown output package
- [x] Add prioritizer v0
- [x] Add 10 Bahasa coaching templates
- [x] Add package-level documentation for core scan packages
- [x] Add demo project under `examples/demo-node-express`

## Sprint 2 — PR Bot First Usable Version (Week 2)

- [x] GitHub bot app scaffold (Probot)
- [x] Connect bot to CLI/core pipeline
- [x] Comment formatting with top 3 findings
- [x] Add badges and XP note to comment
- [x] Add config file support `.kodeaman.yml`
- [x] Add app-level documentation for CLI and bot apps
- [ ] Pilot dry run on 2 demo repos
- [ ] Fix noise and false positive presentation

## Sprint 3 — GitLab + Lessons + Self-Hosting (Week 3)

- [x] GitLab webhook service scaffold
- [x] Reuse core pipeline in GitLab bot
- [x] Add Docker Compose deployment
- [x] Add micro-lesson registry and links
- [x] Add Laravel preset v0
- [x] Add package-level documentation for lessons, presets, i18n, config, and gamification
- [ ] Add validation telemetry file output
- [ ] Pilot with 3–4 external repos

## Sprint 4 — OWASP, Polish, and Pilot Execution (Week 4)

- [x] Add ZAP baseline adapter
- [x] Add OWASP Top 10 scan mode and HTML evidence report output
- [x] Add npm audit adapter for vulnerable dependency findings
- [x] Document OWASP evidence policy and scanner coverage expectations
- [x] Add package-level documentation for OWASP, output, and scanner adapter packages
- [ ] Improve prioritizer with context flags
- [ ] Add 10 more Bahasa lessons/templates
- [ ] Write detailed onboarding docs under `docs/` for GitHub, GitLab, CLI, and self-hosting
- [ ] Run 15 interviews and collect repo pilots
- [ ] Triage pilot feedback into roadmap

## Repository Organization Backlog

- [x] Keep source-of-truth code in `apps/*/src` and `packages/*/src`
- [x] Keep root operational files at repository root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `tsconfig.base.json`, `docker-compose.yml`, and governance docs
- [x] Keep GitHub issue templates, workflows, and CODEOWNERS under `.github/`
- [x] Add README files beside important app and package folders so responsibilities are discoverable without opening implementation files
- [x] Add `docs/` guides for onboarding, deployment, CI usage, and bot setup
- [x] Add `examples/` demo repositories for Node/Express, Laravel, and WordPress pilot flows
- [x] Add `.kodeaman.yml` example configurations for local CLI, GitHub bot, GitLab bot, and OWASP mode

## Future

- VS Code extension
- Advanced autofix patches
- Team leaderboard and challenge quests
- Lightweight analytics dashboard
- Gitea support
- Multi-language support beyond Bahasa and English
- Enterprise policy engine
