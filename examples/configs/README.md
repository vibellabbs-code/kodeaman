# KodeAman Example Configurations

Annotated `.kodeaman.yml` templates for common deployment scenarios. Copy the relevant file to your project root as `.kodeaman.yml` and adjust to your needs.

## Available Configurations

| File | Use Case |
|------|----------|
| [cli-local.yml](./cli-local.yml) | Local development scanning with the CLI |
| [github-bot.yml](./github-bot.yml) | GitHub PR bot (Probot) |
| [gitlab-bot.yml](./gitlab-bot.yml) | GitLab MR bot (Hono) |
| [owasp-mode.yml](./owasp-mode.yml) | OWASP Top 10 structured scanning |

## Quick Start

```bash
# Copy a config to your project
cp examples/configs/cli-local.yml /path/to/your/project/.kodeaman.yml

# Or use the interactive wizard
kodeaman init
```

## Configuration Reference

All options are documented with inline comments in each template file. See also:

- [Getting Started](../../docs/getting-started.md) — CLI quickstart guide
- [GitHub Bot Setup](../../docs/github-bot-setup.md) — GitHub App and webhook setup
- [GitLab Bot Setup](../../docs/gitlab-bot-setup.md) — GitLab webhook and token setup
- [`packages/config/src/defaults.ts`](../../packages/config/src/defaults.ts) — default values
- [`packages/config/src/types.ts`](../../packages/config/src/types.ts) — TypeScript config interface
