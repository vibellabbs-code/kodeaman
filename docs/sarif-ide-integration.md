# SARIF IDE and CI Integration

SARIF (Static Analysis Results Interchange Format) is a JSON format for static-analysis results. KodeAman can emit SARIF v2.1.0 so findings can be reviewed in IDEs, uploaded to GitHub Code Scanning, or consumed by other SARIF-compatible security tools.

## What SARIF provides

A SARIF file describes:

- The tool that produced results.
- The rules or checks that produced each finding.
- Result severity, message, and classification metadata.
- File locations, regions, and snippets for each issue.
- Optional help text and remediation guidance.

For KodeAman, SARIF is the interchange format between scan findings and downstream security review tools. The normalized KodeAman findings remain the source data; SARIF is the portable representation for IDEs and CI systems.

## Creating SARIF with the MCP server

KodeAman exposes SARIF in two MCP paths:

1. Run `kodeaman_scan` or `kodeaman_owasp_scan` with `format: "sarif"`.
2. Convert an existing findings array with `kodeaman_convert_sarif`.

Use direct SARIF scan output when the assistant is scanning and exporting in one step:

```json
{
  "tool": "kodeaman_scan",
  "arguments": {
    "repoRoot": "C:/Users/user2/work/os/my-app",
    "format": "sarif",
    "language": "en"
  }
}
```

Use `kodeaman_convert_sarif` when the assistant already has JSON scan findings and you want to convert only the findings array:

```json
{
  "tool": "kodeaman_convert_sarif",
  "arguments": {
    "findings": "[{...stringified NormalizedFinding...}]"
  }
}
```

The tool returns raw SARIF JSON. Save that JSON to a file such as `kodeaman-results.sarif` or `kodeaman-results.sarif.json` before loading it into an IDE or uploading it to CI.

## Loading SARIF in VS Code

VS Code can display SARIF results with a SARIF viewer extension.

### Setup

1. Install a SARIF viewer extension from the VS Code Marketplace, such as **SARIF Viewer**.
2. Generate a KodeAman SARIF file using either `kodeaman_scan` with `format: "sarif"` or `kodeaman_convert_sarif`.
3. Save the result as `kodeaman-results.sarif` in or near the scanned workspace.
4. Open the workspace in VS Code.
5. Open the SARIF file or use the SARIF viewer command provided by the extension to import it.

### Recommended assistant workflow

Ask your MCP-enabled assistant:

```text
Scan this workspace with KodeAman, convert the findings to SARIF, and save the raw SARIF JSON as kodeaman-results.sarif.
```

The assistant should:

1. Call `kodeaman_scan` with the workspace absolute path.
2. Extract the `findings` array from the JSON response.
3. Call `kodeaman_convert_sarif` with the stringified findings array.
4. Write only the returned SARIF JSON to `kodeaman-results.sarif`.

When the SARIF file is loaded, VS Code displays findings at their source locations so developers can navigate from the result list to vulnerable code.

## Loading SARIF in JetBrains IDEs

JetBrains IDE support SARIF through built-in inspections in some products and through plugins in others. The exact UI varies by IDE and version, but the workflow is the same:

1. Generate `kodeaman-results.sarif` from KodeAman.
2. Open the scanned project in the JetBrains IDE.
3. Use the IDE's SARIF import action or SARIF plugin import action.
4. Select the generated SARIF file.
5. Review imported results in the Problems, Security, or inspection results tool window, depending on the IDE.

If your JetBrains IDE does not expose a SARIF import action, install a SARIF-compatible plugin or use CI integration with GitHub Code Scanning as the review surface.

## CI integration with GitHub Code Scanning

GitHub Code Scanning accepts SARIF uploads. A typical CI flow is:

1. Install dependencies.
2. Run KodeAman and produce SARIF.
3. Upload the SARIF file with GitHub's code scanning upload action.

Example GitHub Actions workflow:

```yaml
name: KodeAman Security Scan

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  kodeaman:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install KodeAman
        run: npm install --global kodeaman

      - name: Run KodeAman SARIF scan
        run: kodeaman scan --format sarif --output kodeaman-results.sarif .

      - name: Upload SARIF to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: kodeaman-results.sarif
```

If your CI job uses the MCP server rather than the CLI, make sure the automation writes the MCP tool response as raw JSON without Markdown fences or assistant commentary.

## Choosing the right SARIF path

| Scenario | Recommended path |
| --- | --- |
| You want one assistant call to scan and export. | `kodeaman_scan` with `format: "sarif"`. |
| You already have JSON findings from a scan. | `kodeaman_convert_sarif` with the stringified findings array. |
| You need OWASP category evidence and SARIF output. | `kodeaman_owasp_scan` with `format: "sarif"`. |
| You want GitHub Code Scanning alerts. | Save SARIF in CI and upload with `github/codeql-action/upload-sarif`. |
| You want local IDE navigation. | Save SARIF locally and import it into VS Code or JetBrains. |

## Troubleshooting

### The SARIF file opens as text but no results appear

- Confirm the file contains only SARIF JSON.
- Remove Markdown fences such as ```json if an assistant included them.
- Confirm the file extension is `.sarif` or `.sarif.json`.
- Regenerate the file using `format: "sarif"` or `kodeaman_convert_sarif`.

### Results do not map to source files

- Generate SARIF from the same checkout that you open in the IDE.
- Keep the SARIF file associated with the scanned repository root.
- Avoid moving source files between scanning and importing.

### GitHub upload fails

- Ensure the workflow has `security-events: write` permission.
- Confirm the SARIF file exists at the path passed to `sarif_file`.
- Confirm the workflow runs on a branch or event where code scanning upload is allowed.
- Check that the SARIF file is not wrapped in assistant text or logs.

### The MCP conversion tool fails

- Pass `findings` as a stringified JSON array, not a JavaScript object or partial scan response.
- Extract the `findings` field from `kodeaman_scan` output before calling `kodeaman_convert_sarif`.
- If the scan returned an error message instead of findings, resolve the scan error first.
