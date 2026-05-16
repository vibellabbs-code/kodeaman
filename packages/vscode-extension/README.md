# KodeAman VS Code Extension

The KodeAman VS Code extension runs the KodeAman CLI against the current workspace and displays security findings as native VS Code diagnostics.

## Features

- `KodeAman: Scan Workspace` command runs `kodeaman scan --format json <workspace>`.
- `KodeAman: Clear Diagnostics` command removes KodeAman diagnostics from the Problems panel.
- Converts KodeAman `NormalizedFinding[]` results into `vscode.Diagnostic` entries.
- Maps critical and high findings to errors, medium findings to warnings, low findings to information, and info findings to hints.
- Supports multi-root workspaces by prompting for the workspace folder to scan.

## Install

This scaffold is intended for extension development. To test it locally:

1. Install dependencies in this package:

   ```bash
   pnpm install
   ```

2. Compile the extension:

   ```bash
   pnpm --dir packages/vscode-extension compile
   ```

3. Open `packages/vscode-extension` in VS Code.
4. Press `F5` to launch an Extension Development Host.
5. In the development host, open a project and run `KodeAman: Scan Workspace` from the Command Palette.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `kodeaman.cliPath` | `kodeaman` | Path to the KodeAman CLI executable. Set this to an absolute path if the CLI is not on `PATH`. |
| `kodeaman.scanFormat` | `json` | Output format requested from the CLI. The extension currently expects JSON. |
| `kodeaman.maxBuffer` | `10485760` | Maximum stdout buffer in bytes for scan output. Increase this for very large scan results. |

Example workspace settings:

```json
{
  "kodeaman.cliPath": "C:/Users/user2/AppData/Roaming/npm/kodeaman.cmd",
  "kodeaman.maxBuffer": 20971520
}
```

## How it works

The extension activates when a KodeAman command is invoked. `src/extension.ts` registers commands, selects the workspace folder, reads configuration, and owns the diagnostic collection.

`src/scan-runner.ts` spawns the configured KodeAman CLI with:

```bash
kodeaman scan --format json <workspaceRoot>
```

It parses JSON output and extracts findings from either a standard scan result (`findings`) or an OWASP scan-like result (`phases[].findings`).

`src/diagnostics.ts` converts each finding into a VS Code diagnostic. Relative paths are resolved against the scanned workspace root. Absolute paths are used as-is.

## Development notes

- This package intentionally uses CommonJS because VS Code extensions run against VS Code's extension host expectations.
- `tsconfig.json` does not extend the monorepo ESM base config.
- This scaffold is not intended to participate in the repository Turborepo build pipeline.
- Keep extension commands and settings in `package.json` synchronized with command IDs in `src/extension.ts`.

## Troubleshooting

### The scan command fails

- Confirm `kodeaman.cliPath` points to a working CLI executable.
- Run `kodeaman scan --format json <workspaceRoot>` manually to confirm the CLI returns JSON.
- Increase `kodeaman.maxBuffer` if the scan output is large.

### No diagnostics appear

- Confirm the scan returned findings with `location.filePath` values.
- Confirm finding file paths point to files inside the open workspace or to valid absolute paths.
- Run `KodeAman: Clear Diagnostics`, then scan again.

### Multi-root workspace scans the wrong project

Run `KodeAman: Scan Workspace` again and select the intended workspace folder in the folder picker.
