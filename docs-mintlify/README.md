# AspidaSec Documentation (Mintlify)

Source for the AspidaSec documentation site, built with [Mintlify](https://mintlify.com).

## Local preview

```bash
# Install the Mintlify CLI once
npm install -g mint

# From this directory
cd docs-mintlify
mint dev
```

The site is served at `http://localhost:3000`. Edits to `.mdx` files and `docs.json` hot-reload.

## Validate before pushing

```bash
mint broken-links   # report dead internal links
```

## Project layout

```
docs-mintlify/
├── docs.json              # site config: theme, colors, navigation, SEO
├── favicon.svg            # browser tab icon
├── logo/                  # light + dark wordmarks
├── index.mdx              # home page
├── get-started/           # introduction, quickstart, installation, configuration
├── features/              # scanners, prioritization, output formats
├── security-analysis/     # OWASP scan, trust model
├── concepts/              # architecture
├── cli/                   # per-command CLI reference
├── api-reference/         # MCP tools (AspidaSec exposes no HTTP REST API)
└── integrations/          # AI assistants, CI, bots, IDE, Mintlify docs MCP
```

## Deployment

Mintlify hosts the published site. Connect this repository in the Mintlify dashboard
and set the content directory to `docs-mintlify`. Pushes to `main` trigger a redeploy.

## Secrets

This repository never stores credentials. Anything secret (for example the Mintlify
Docs MCP client secret used to connect AI tools to the published docs) is read from an
environment variable at the point of use — see
[`integrations/docs-mcp.mdx`](./integrations/docs-mcp.mdx). Do not commit secrets to
`docs.json`, `.mdx` files, or any tracked file.
