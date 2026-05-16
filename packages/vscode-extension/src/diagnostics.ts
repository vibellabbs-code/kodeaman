import * as vscode from "vscode";

export type KodeAmanSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface NormalizedFinding {
  findingId: string;
  title: string;
  description?: string;
  severity: KodeAmanSeverity;
  category?: string;
  owaspCategory?: string;
  location: {
    filePath: string;
    startLine?: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  };
}

export interface DiagnosticEntry {
  uri: vscode.Uri;
  diagnostic: vscode.Diagnostic;
}

export function findingsToDiagnostics(findings: NormalizedFinding[], workspaceRoot: string): DiagnosticEntry[] {
  return findings
    .filter((finding) => finding.location?.filePath)
    .map((finding) => {
      const uri = findingUri(finding.location.filePath, workspaceRoot);
      const diagnostic = new vscode.Diagnostic(
        findingRange(finding),
        diagnosticMessage(finding),
        diagnosticSeverity(finding.severity),
      );

      diagnostic.source = "KodeAman";
      diagnostic.code = finding.findingId;

      return { uri, diagnostic };
    });
}

function findingUri(filePath: string, workspaceRoot: string): vscode.Uri {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(filePath) || filePath.startsWith("/")) {
    return vscode.Uri.file(filePath);
  }

  return vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), filePath);
}

function findingRange(finding: NormalizedFinding): vscode.Range {
  const startLine = toZeroBased(finding.location.startLine ?? 1);
  const endLine = toZeroBased(finding.location.endLine ?? finding.location.startLine ?? 1);
  const startColumn = toZeroBased(finding.location.startColumn ?? 1);
  const endColumn = Math.max(startColumn + 1, toZeroBased(finding.location.endColumn ?? finding.location.startColumn ?? 2));

  return new vscode.Range(startLine, startColumn, endLine, endColumn);
}

function toZeroBased(value: number): number {
  return Math.max(0, value - 1);
}

function diagnosticMessage(finding: NormalizedFinding): string {
  const parts = [finding.title];

  if (finding.owaspCategory) {
    parts.push(`OWASP ${finding.owaspCategory}`);
  }

  if (finding.category) {
    parts.push(finding.category);
  }

  if (finding.description) {
    parts.push(finding.description);
  }

  return parts.join(" — ");
}

function diagnosticSeverity(severity: KodeAmanSeverity): vscode.DiagnosticSeverity {
  switch (severity) {
    case "critical":
    case "high":
      return vscode.DiagnosticSeverity.Error;
    case "medium":
      return vscode.DiagnosticSeverity.Warning;
    case "low":
      return vscode.DiagnosticSeverity.Information;
    case "info":
      return vscode.DiagnosticSeverity.Hint;
  }
}
