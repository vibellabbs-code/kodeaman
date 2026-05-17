import type { FixCommand, NormalizedFinding, RepoContext } from "@kodeaman/schema";
import type { NpmAuditResult, NpmAuditScanContext, NpmVulnerability } from "./types.js";
import {
  mapSeverity,
  mapConfidence,
  extractCweIds,
  extractCveIds,
  getAdvisoryTitle,
  getAdvisoryUrl,
  getViaDetails,
  generateDedupeKey,
  generateFindingId,
} from "./mapper.js";

/**
 * Generic scan context compatible with the core ScannerAdapter interface.
 * Accepts either `targetPath` (npm-audit specific) or `repoRoot` (core pipeline).
 */
export interface GenericScanContext {
  targetPath?: string;
  repoRoot?: string;
  packageManager?: "npm" | "pnpm";
  extraArgs?: string[];
  timeout?: number;
  [key: string]: unknown;
}

export interface ScannerAdapter {
  readonly name: string;
  scan(context: GenericScanContext, repoContext?: RepoContext): Promise<NormalizedFinding[]>;
}

export class NpmAuditAdapter implements ScannerAdapter {
  readonly name = "npm-audit";

  async scan(
    context: GenericScanContext,
    repoContext?: RepoContext,
  ): Promise<NormalizedFinding[]> {
    // Support both NpmAuditScanContext.targetPath and core ScanContext.repoRoot
    const targetPath = context.targetPath ?? context.repoRoot;
    if (!targetPath) {
      throw new Error(
        "npm-audit adapter requires either 'targetPath' or 'repoRoot' in scan context. " +
        "Provide the path to the project directory containing package.json.",
      );
    }

    // Verify package.json exists at the target path
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const pkgJsonPath = join(targetPath, "package.json");
    if (!existsSync(pkgJsonPath)) {
      throw new Error(
        `No package.json found at ${targetPath}. npm-audit requires a Node.js project with a package.json file.`,
      );
    }

    const resolvedContext: NpmAuditScanContext = {
      targetPath,
      packageManager: context.packageManager,
      extraArgs: context.extraArgs,
      timeout: context.timeout as number | undefined,
    };

    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    const pm = resolvedContext.packageManager ?? (await this.detectPackageManager(targetPath));
    let stdout: string;

    try {
      const result = await this.runAudit(execFileAsync, pm, resolvedContext);
      stdout = result;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "stdout" in error) {
        stdout = (error as { stdout: string }).stdout;
        if (!stdout) throw error;
      } else {
        throw error;
      }
    }

    const raw: NpmAuditResult = JSON.parse(stdout);
    return this.parseAuditOutput(raw, repoContext, {
      packageManager: pm,
      targetPath,
    });
  }

  private async runAudit(
    execFileAsync: (cmd: string, args: string[], opts: object) => Promise<{ stdout: string }>,
    pm: "npm" | "pnpm",
    context: NpmAuditScanContext,
  ): Promise<string> {
    const args = ["audit", "--json"];

    if (context.extraArgs) {
      args.push(...context.extraArgs);
    }

    const command = process.platform === "win32" ? "cmd.exe" : pm;
    const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", `${pm}.cmd`, ...args] : args;
    const { stdout } = await execFileAsync(command, commandArgs, {
      timeout: context.timeout ?? 120_000,
      maxBuffer: 50 * 1024 * 1024,
      cwd: context.targetPath,
    });

    return stdout;
  }

  private async detectPackageManager(targetPath: string): Promise<"npm" | "pnpm"> {
    const { access } = await import("node:fs/promises");
    const { join } = await import("node:path");

    try {
      await access(join(targetPath, "pnpm-lock.yaml"));
      return "pnpm";
    } catch {
      return "npm";
    }
  }

  private buildFixCommands(
    packageName: string,
    vuln: NpmVulnerability,
    scanContext?: Pick<NpmAuditScanContext, "packageManager" | "targetPath">,
  ): FixCommand[] | undefined {
    if (!vuln.fixAvailable) return undefined;

    const packageManager = scanContext?.packageManager ?? "npm";
    const cwd = scanContext?.targetPath;

    if (vuln.fixAvailable === true) {
      return [
        {
          command: packageManager === "pnpm" ? "pnpm audit --fix" : "npm audit fix",
          cwd,
          description: "Apply available non-breaking audit fixes",
          descriptionId: "Terapkan perbaikan audit tanpa breaking change yang tersedia",
          isBreaking: false,
          packageManager,
        },
      ];
    }

    const isBreaking = vuln.fixAvailable.isSemVerMajor;
    const fixPackageName = vuln.fixAvailable.name;
    const fixVersion = vuln.fixAvailable.version;
    const isDirectPackageFix = packageName === fixPackageName;
    const command = packageManager === "pnpm"
      ? isBreaking
        ? `pnpm update ${fixPackageName}@${fixVersion}`
        : "pnpm audit --fix"
      : isBreaking
        ? `npm install ${fixPackageName}@${fixVersion}`
        : "npm audit fix";

    return [
      {
        command,
        cwd,
        description: isBreaking
          ? isDirectPackageFix
            ? `Upgrade ${packageName} to ${fixVersion}; review breaking changes before merging`
            : `Fix ${packageName} vulnerability by upgrading ${fixPackageName} to ${fixVersion}; review breaking changes`
          : "Apply available non-breaking audit fixes",
        descriptionId: isBreaking
          ? isDirectPackageFix
            ? `Upgrade ${packageName} ke ${fixVersion}; tinjau breaking change sebelum merge`
            : `Perbaiki kerentanan ${packageName} dengan meng-upgrade ${fixPackageName} ke ${fixVersion}; tinjau breaking change`
          : "Terapkan perbaikan audit tanpa breaking change yang tersedia",
        isBreaking,
        packageManager,
      },
    ];
  }

  parseAuditOutput(
    raw: NpmAuditResult,
    repoContext?: RepoContext,
    scanContext?: Pick<NpmAuditScanContext, "packageManager" | "targetPath">,
  ): NormalizedFinding[] {
    const findings: NormalizedFinding[] = [];

    for (const [packageName, vuln] of Object.entries(raw.vulnerabilities)) {
      const viaDetails = getViaDetails(vuln);
      if (viaDetails.length === 0) continue;

      findings.push(this.mapVulnerability(packageName, vuln, repoContext, scanContext));
    }

    return findings;
  }

  private mapVulnerability(
    packageName: string,
    vuln: NpmVulnerability,
    repoContext?: RepoContext,
    scanContext?: Pick<NpmAuditScanContext, "packageManager" | "targetPath">,
  ): NormalizedFinding {
    const severity = mapSeverity(vuln.severity);
    const confidence = mapConfidence(vuln);
    const cwes = extractCweIds(vuln);
    const cves = extractCveIds(vuln);
    const advisoryTitle = getAdvisoryTitle(vuln);
    const advisoryUrl = getAdvisoryUrl(vuln);
    const viaDetails = getViaDetails(vuln);

    const fixCommands = this.buildFixCommands(packageName, vuln, scanContext);

    const evidenceContent = [
      `Package: ${packageName}`,
      `Affected range: ${vuln.range}`,
      `Severity: ${vuln.severity}`,
      viaDetails[0]?.title ? `Advisory: ${viaDetails[0].title}` : "",
      advisoryUrl ? `URL: ${advisoryUrl}` : "",
      vuln.fixAvailable
        ? typeof vuln.fixAvailable === "object"
          ? `Fix: upgrade to ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}${vuln.fixAvailable.isSemVerMajor ? " (BREAKING)" : ""}`
          : "Fix available via npm audit fix"
        : "No fix available",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      schemaVersion: "1.0.0",
      findingId: generateFindingId(packageName, vuln),
      dedupeKey: generateDedupeKey(packageName, vuln),
      source: "npm-audit",
      category: "sca",
      surface: "dependency",
      owaspCategory: "A06-vulnerable-components",

      severity,
      confidence,
      status: "open",

      title: `${advisoryTitle} in ${packageName}`,
      description: `Vulnerable dependency ${packageName} (${vuln.range}): ${advisoryTitle}`,

      location: {
        filePath: "package.json",
        component: packageName,
      },

      evidence: [
        {
          type: "scanner-message",
          label: "npm audit advisory",
          content: evidenceContent,
        },
      ],

      classification: {
        cwe: cwes.length > 0 ? cwes : undefined,
        cve: cves.length > 0 ? cves : undefined,
        owasp: ["A06:2021"],
        tags: [
          "dependency",
          "sca",
          vuln.isDirect ? "direct" : "transitive",
        ],
      },

      raw: {
        tool: "npm-audit",
        toolRuleId: `npm-audit:${viaDetails[0]?.source ?? packageName}`,
        toolFindingId: generateFindingId(packageName, vuln),
        toolUrl: advisoryUrl,
        rawSeverity: vuln.severity,
        rawConfidence: viaDetails[0]?.cvss.score?.toString(),
        rawCategory: "sca",
      },

      repoContext,
      fixCommands,

      prioritization: {
        baseSeverity: severity,
        adjustedSeverity: severity,
        priorityScore: 0,
        confidenceScore: confidence === "high" ? 90 : confidence === "medium" ? 60 : 30,
        reasons: [
          vuln.isDirect ? "Direct dependency" : "Transitive dependency",
          ...(typeof vuln.fixAvailable === "object"
            ? [vuln.fixAvailable.isSemVerMajor ? "Major version upgrade required" : "Patch available"]
            : vuln.fixAvailable
              ? ["Fix available"]
              : ["No fix available"]),
        ],
      },

      coaching: {
        titleEn: `Vulnerable Dependency: ${packageName}`,
        titleId: `Dependensi Rentan: ${packageName}`,
        summaryEn: `The package ${packageName} has a known vulnerability: ${advisoryTitle}.`,
        summaryId: `Paket ${packageName} memiliki kerentanan yang diketahui: ${advisoryTitle}.`,
        whyItMattersEn:
          "Using dependencies with known vulnerabilities exposes your application to attacks that are well-documented and often automated.",
        whyItMattersId:
          "Menggunakan dependensi dengan kerentanan yang diketahui mengekspos aplikasi Anda terhadap serangan yang terdokumentasi dengan baik dan sering diotomasi.",
        remediationEn: [
          typeof vuln.fixAvailable === "object"
            ? packageName === vuln.fixAvailable.name
              ? `Upgrade ${packageName} to version ${vuln.fixAvailable.version}`
              : `Update ${packageName} by upgrading its parent dependency ${vuln.fixAvailable.name} to version ${vuln.fixAvailable.version}`
            : "Run npm audit fix to apply available patches",
          "Review the advisory for specific impact and workarounds",
          "Consider alternative packages if no fix is available",
        ],
        remediationId: [
          typeof vuln.fixAvailable === "object"
            ? packageName === vuln.fixAvailable.name
              ? `Upgrade ${packageName} ke versi ${vuln.fixAvailable.version}`
              : `Perbarui ${packageName} dengan meng-upgrade dependensi induknya ${vuln.fixAvailable.name} ke versi ${vuln.fixAvailable.version}`
            : "Jalankan npm audit fix untuk menerapkan patch yang tersedia",
          "Tinjau advisory untuk dampak spesifik dan solusi sementara",
          "Pertimbangkan paket alternatif jika tidak ada perbaikan yang tersedia",
        ],
        lessonId: "sca-001",
      },

      gamification: {
        issueFamily: "sca",
      },

      detectedAt: new Date().toISOString(),
    };
  }
}
