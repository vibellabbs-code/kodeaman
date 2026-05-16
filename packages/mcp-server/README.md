# @kodeaman/mcp-server

KodeAman MCP Server exposes KodeAman's security scanning workflow through the Model Context Protocol (MCP), so AI coding assistants can run scans, inspect findings, produce reports, and request remediation guidance from inside a development session.

## Overview

The server runs over MCP stdio and registers KodeAman tools for project-level application security checks. It connects assistants such as Claude Code, Cursor, and Windsurf to the same scanner adapters and report converters used by the KodeAman CLI.

Use it to:

- Run general KodeAman security scans against a local project directory.
- Execute OWASP Top 10 focused scans with evidence output.
- Check scanner availability before a scan.
- Explain findings in developer-friendly language.
- Request fix suggestions and convert scan output into SARIF or coverage reports.

## Installation

Install the package globally from npm:

```bash
npm install -g @kodeaman/mcp-server
```

Or run it without a global install:

```bash
npx @kodeaman/mcp-server
```

For local monorepo development, build the package first:

```bash
pnpm --filter @kodeaman/mcp-server build
node packages/mcp-server/dist/index.js
```

The published binary is named `kodeaman-mcp`.

## Available Tools

| Tool | Purpose | Typical use |
| --- | --- | --- |
| `scan` | Runs a KodeAman scan for a project directory. | Broad security review before opening a PR. |
| `owasp-scan` | Runs an OWASP Top 10 focused scan with evidence. | Mapping scanner output to OWASP risk categories. |
| `preflight` | Checks environment readiness, including scanner availability. | Confirming local prerequisites before a scan. |
| `list-scanners` | Lists available KodeAman scanner adapters. | Discovering which scanners can run in the current environment. |
| `explain-finding` | Explains a normalized security finding with coaching context. | Understanding severity, impact, and remediation direction. |
| `suggest-fix` | Suggests remediation steps for a finding. | Planning code changes for a vulnerability. |
| `convert-sarif` | Converts findings into SARIF output. | Uploading results to code scanning or CI systems. |
| `coverage-report` | Generates an OWASP coverage report. | Showing which OWASP categories were checked and covered. |

## Assistant Configuration

### Claude Code

Add the server with Claude Code's MCP command:

```bash
claude mcp add kodeaman -- kodeaman-mcp
```

For a local development build, point Claude Code at the compiled entrypoint:

```bash
claude mcp add kodeaman -- node C:/Users/user2/work/os/kodeaman/packages/mcp-server/dist/index.js
```

### Cursor

Add an MCP server entry to Cursor's MCP configuration:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "kodeaman-mcp",
      "args": []
    }
  }
}
```

For local development, use `node` with the built JavaScript file:

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

### Windsurf

Add KodeAman to Windsurf's MCP server configuration:

```json
{
  "mcpServers": {
    "kodeaman": {
      "command": "kodeaman-mcp",
      "args": []
    }
  }
}
```

For a repository checkout, configure Windsurf to run the built server through Node:

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

## Usage Examples

### Check scanner readiness

Ask your assistant:

```text
Use KodeAman to run preflight checks for this repository.
```

The assistant should call `preflight` and report which scanners and runtime dependencies are available.

### Run a security scan

```text
Use KodeAman to scan C:/Users/user2/work/os/my-app and summarize high severity findings.
```

The assistant should call `scan` with the target project path and then summarize the normalized findings.

### Run an OWASP scan

```text
Use KodeAman to run an OWASP Top 10 scan for the current project and show evidence for each finding.
```

The assistant should call `owasp-scan`, then group results by OWASP category.

### Explain and fix a finding

```text
Use KodeAman to explain this finding and suggest a safe fix: SQL injection in src/routes/users.ts.
```

The assistant should call `explain-finding` for context and `suggest-fix` for remediation guidance.

### Generate SARIF output

```text
Use KodeAman to convert the latest findings to SARIF for CI upload.
```

The assistant should call `convert-sarif` and provide the generated SARIF content or output location according to the tool response.

## Notes

- The MCP server communicates over stdio and is intended to be launched by an MCP-compatible assistant.
- Scanner availability depends on the local environment and installed scanner tools.
- Run `preflight` first when diagnosing missing scanner output or unexpected scan coverage.
