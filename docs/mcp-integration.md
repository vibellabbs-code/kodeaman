# KodeAman MCP Integration

KodeAman ships an MCP (Model Context Protocol) server so AI coding assistants can run security scans, inspect findings, and request remediation guidance without leaving the assistant workflow. The server communicates over stdio and exposes KodeAman's scan pipeline as MCP tools.

## Server overview

The MCP server package is `@kodeaman/mcp-server`. Its executable is `kodeaman-mcp`, which starts a stdio MCP server named `kodeaman`.

The server registers eight tools:

1. `kodeaman_scan`
2. `kodeaman_owasp_scan`
3. `kodeaman_preflight`
4. `kodeaman_list_scanners`
5. `kodeaman_explain_finding`
6. `kodeaman_suggest_fix`
7. `kodeaman_convert_sarif`
8. `kodeaman_coverage_report`

Use the MCP server when an assistant needs to:

- Check whether the local environment can run KodeAman scanners.
- Scan a project directory and return prioritized security findings.
- Run an OWASP Top 10 focused scan with evidence by category.
- Explain a finding in English or Indonesian.
- Convert findings to SARIF for IDEs or CI systems.

## Prerequisites

- Node.js 20 or newer.
- KodeAman installed from npm or available from this repository.
- Scanner dependencies available for the checks you want to run, such as Semgrep, OWASP ZAP, npm audit, or Playwright.
- Absolute project paths. The MCP tools expect `repoRoot` values to be absolute paths.

Run a preflight check first if you are not sure whether the local machine is ready:

```json
{
  "tool": "kodeaman_preflight",
  "arguments": {
    "language": "en"
  }
}
```

## Client configuration

All examples below start the same stdio server. Use the command that matches how KodeAman is installed in your environment.

### Claude Code

Add the server to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "npx",
      "args": ["-y", "@kodeaman/mcp-server"]
    }
  }
}
```

For local repository development, point Claude Code at the package entrypoint after building the package:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "node",
      "args": ["C:/Users/user2/work/os/kodeaman/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Cursor

Add a `.cursor/mcp.json` file to the workspace or configure the server globally in Cursor settings:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "npx",
      "args": ["-y", "@kodeaman/mcp-server"]
    }
  }
}
```

Restart Cursor after changing MCP configuration so the tool list is refreshed.

### Windsurf

Add the server to Windsurf's MCP server configuration:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "npx",
      "args": ["-y", "@kodeaman/mcp-server"]
    }
  }
}
```

After saving the configuration, reload Windsurf and confirm that the KodeAman tools appear in the assistant's MCP tool list.

### Generic MCP clients

Generic MCP clients need a stdio server command. Use this shape unless your client uses a different key name for stdio transports:

```json
{
  "name": "kodeaman",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@kodeaman/mcp-server"]
}
```

For local development, build the package and use Node directly:

```json
{
  "name": "kodeaman",
  "transport": "stdio",
  "command": "node",
  "args": ["C:/Users/user2/work/os/kodeaman/packages/mcp-server/dist/index.js"]
}
```

## MCP tools reference

| Tool | Purpose | Parameters | Returns |
| --- | --- | --- | --- |
| `kodeaman_scan` | Runs the standard KodeAman security scan pipeline and returns deduplicated, prioritized findings with coaching content, OWASP classification, and fix suggestions. | `repoRoot` string, required absolute path. `language` optional enum: `en`, `id`. `format` optional enum: `json`, `markdown`, `sarif`. `scanners` optional object with boolean overrides for `semgrep`, `zapBaseline`, `npmAudit`, and `playwright`. | JSON scan summary and findings by default, Markdown report when `format` is `markdown`, or SARIF v2.1.0 when `format` is `sarif`. |
| `kodeaman_owasp_scan` | Runs an OWASP Top 10 scan with per-category evidence, remediation, and OWASP classification. | `repoRoot` string, required absolute path. `language` optional enum: `en`, `id`. `categories` optional string array such as `["A01", "A03", "A06"]`. `parallel` optional boolean. `confidenceGate` optional enum: `low`, `medium`, `high`. `format` optional enum: `json`, `sarif`, `markdown`. | Structured OWASP scan result by default, SARIF when requested, or Markdown report when requested. |
| `kodeaman_preflight` | Checks whether the environment is ready for scanning. It detects platform, WSL status on Windows, scanner availability, warnings, and install instructions. | `language` optional enum: `en`, `id`. | JSON readiness report with `canRun`, environment details, scanner status, missing scanners, warnings, install instructions, and Windows WSL details when applicable. |
| `kodeaman_list_scanners` | Lists supported scanners and whether each scanner is currently installed and available on `PATH`. | None. | JSON scanner list with name, source, availability, version, path, and a summary of available and missing scanners. |
| `kodeaman_explain_finding` | Explains a security finding with bilingual coaching content, classification, priority, gamification rewards, autofix eligibility, and fix commands. | `finding` required stringified `NormalizedFinding`. `language` optional enum: `en`, `id`. | JSON explanation with preferred-language fields first while retaining English and Indonesian content. |
| `kodeaman_suggest_fix` | Returns actionable remediation for a finding, including package-manager commands, remediation text, safe examples, and autofix eligibility. | `finding` required stringified `NormalizedFinding`. `language` optional enum: `en`, `id`. `packageManager` optional enum: `npm`, `pnpm`, `yarn`. | JSON fix guidance filtered to the selected package manager when matching commands exist. |
| `kodeaman_convert_sarif` | Converts KodeAman findings to SARIF v2.1.0 for GitHub Code Scanning, VS Code SARIF Viewer, JetBrains, and other SARIF-compatible tools. | `findings` required stringified JSON array of `NormalizedFinding` objects. | SARIF v2.1.0 JSON. |
| `kodeaman_coverage_report` | Generates OWASP Top 10 coverage details for scanner coverage and optional findings. | `scannerCoverage` optional stringified JSON array of `ScannerCoverage` objects. `findings` optional stringified JSON array of `NormalizedFinding` objects. `repoRoot` optional project root used to load config when `scannerCoverage` is omitted. | JSON coverage report showing OWASP category and attack-surface coverage. |

## Walkthrough: scanning a project from an AI assistant

This walkthrough assumes the MCP client has already started the `kodeaman` server and the assistant can call KodeAman tools.

### 1. Check the environment

Ask the assistant:

```text
Run KodeAman preflight in English and tell me which scanners are missing.
```

The assistant should call:

```json
{
  "tool": "kodeaman_preflight",
  "arguments": {
    "language": "en"
  }
}
```

Use the result to install missing scanner dependencies before running a full scan. On Windows, the response also reports WSL availability and install instructions when WSL is missing.

### 2. List scanner availability

Ask:

```text
List the KodeAman scanners available on this machine.
```

The assistant should call:

```json
{
  "tool": "kodeaman_list_scanners",
  "arguments": {}
}
```

Use this result to confirm which scanner engines will contribute findings.

### 3. Run a standard scan

Ask the assistant to scan an absolute path:

```text
Scan C:/Users/user2/work/os/my-app with KodeAman and return JSON findings in Indonesian.
```

The assistant should call:

```json
{
  "tool": "kodeaman_scan",
  "arguments": {
    "repoRoot": "C:/Users/user2/work/os/my-app",
    "language": "id",
    "format": "json"
  }
}
```

The JSON response includes totals, summary, timing, coverage report, preflight warnings, and findings.

### 4. Run an OWASP-focused scan

Ask:

```text
Run an OWASP scan for A01, A03, and A06 with medium confidence or higher.
```

The assistant should call:

```json
{
  "tool": "kodeaman_owasp_scan",
  "arguments": {
    "repoRoot": "C:/Users/user2/work/os/my-app",
    "categories": ["A01", "A03", "A06"],
    "confidenceGate": "medium",
    "parallel": true,
    "format": "json"
  }
}
```

Use OWASP scans when you need category-specific evidence rather than the default scan summary.

### 5. Explain and fix one finding

After a scan, pass one finding object back as a JSON string:

```json
{
  "tool": "kodeaman_explain_finding",
  "arguments": {
    "language": "id",
    "finding": "{...stringified NormalizedFinding...}"
  }
}
```

Then request package-manager-specific remediation:

```json
{
  "tool": "kodeaman_suggest_fix",
  "arguments": {
    "language": "id",
    "packageManager": "pnpm",
    "finding": "{...stringified NormalizedFinding...}"
  }
}
```

The explain tool is best for learning and review. The suggest-fix tool is best when you want concrete remediation steps or commands.

### 6. Export results

To generate SARIF from the findings array in a scan response:

```json
{
  "tool": "kodeaman_convert_sarif",
  "arguments": {
    "findings": "[{...stringified NormalizedFinding...}]"
  }
}
```

To get a coverage report using the current repository configuration:

```json
{
  "tool": "kodeaman_coverage_report",
  "arguments": {
    "repoRoot": "C:/Users/user2/work/os/my-app"
  }
}
```

## Troubleshooting

### The MCP server does not start

- Confirm Node.js 20 or newer is installed.
- If using `npx`, confirm the package can be resolved from your configured npm registry.
- If using a local development path, run the MCP server package build first so `dist/index.js` exists.
- Use absolute paths in client configuration to avoid working-directory ambiguity.

### The assistant cannot see KodeAman tools

- Restart or reload the MCP client after editing configuration.
- Confirm the server name is unique in the client's MCP config.
- Check client logs for stdio startup errors.
- Verify the configured command works outside the client.

### Scans return missing scanner warnings

- Run `kodeaman_preflight` and follow the install instructions in the response.
- Run `kodeaman_list_scanners` to check scanner availability and versions.
- On Windows, check the `wsl` section of `kodeaman_preflight` if Linux-based scanner tooling is required.
- Use the `scanners` override in `kodeaman_scan` to disable scanners that are intentionally unavailable.

### `repoRoot` errors or no files are scanned

- Pass an absolute path, not a relative path.
- Confirm the MCP client has filesystem access to the target directory.
- Confirm the target directory contains the project files and KodeAman configuration expected by the scan pipeline.

### SARIF output does not load in an IDE or CI system

- Generate SARIF directly with `format: "sarif"` on scan tools or with `kodeaman_convert_sarif`.
- Save the tool response as a `.sarif` or `.sarif.json` file.
- Validate that the response is raw JSON and does not include assistant prose around the SARIF object.
