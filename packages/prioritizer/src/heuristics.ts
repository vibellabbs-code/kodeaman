export function isAuthRelatedPath(filePath: string): boolean {
  const authPatterns = [
    /auth/i,
    /login/i,
    /logout/i,
    /signin/i,
    /signup/i,
    /register/i,
    /password/i,
    /credential/i,
    /session/i,
    /token/i,
    /oauth/i,
    /sso/i,
    /jwt/i,
    /permission/i,
    /rbac/i,
    /acl/i,
    /middleware\/auth/i,
    /guard/i,
  ];
  return authPatterns.some((p) => p.test(filePath));
}

export function isPublicRoute(filePath: string, framework?: string): boolean {
  const publicPatterns = [
    /public/i,
    /static/i,
    /assets/i,
    /health/i,
    /status/i,
    /webhook/i,
    /callback/i,
    /api\/v\d+\/public/i,
  ];

  if (framework === "nextjs" || framework === "next") {
    if (/pages\/api/i.test(filePath) || /app\/api/i.test(filePath)) return true;
  }
  if (framework === "express" || framework === "fastify") {
    if (/routes?\/(public|open|external)/i.test(filePath)) return true;
  }

  return publicPatterns.some((p) => p.test(filePath));
}

export function isDependencyDirect(finding: { surface?: string; category?: string; occurrences?: { target?: string }[] }): boolean {
  if (finding.surface !== "dependency" && finding.category !== "sca") return false;

  const dependencyScopes = ["dependencies", "optionalDependencies", "peerDependencies"];
  return finding.occurrences?.some((occurrence) =>
    occurrence.target ? dependencyScopes.includes(occurrence.target) : false,
  ) ?? false;
}

export function hasFixAvailable(finding: { fixCommands?: unknown[]; coaching?: { autofixEligible?: boolean } }): boolean {
  return Boolean(finding.fixCommands?.length || finding.coaching?.autofixEligible);
}

export function estimateFixEffort(category: string): "trivial" | "easy" | "moderate" | "hard" {
  const trivialFixes = ["misconfiguration", "config", "info-leak"];
  const easyFixes = ["xss", "csrf", "secrets"];
  const hardFixes = ["auth", "rce", "sqli"];

  if (trivialFixes.includes(category)) return "trivial";
  if (easyFixes.includes(category)) return "easy";
  if (hardFixes.includes(category)) return "hard";
  return "moderate";
}

export function detectSensitiveData(snippet?: string): boolean {
  if (!snippet) return false;

  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /private[_-]?key/i,
    /credential/i,
    /bearer\s+/i,
    /authorization/i,
    /ssn|social.security/i,
    /credit.card/i,
    /card.number/i,
    /\bnik\b/i,       // Indonesian national ID
    /\bktp\b/i,       // Indonesian ID card
    /\bnpwp\b/i,      // Indonesian tax ID
    /bpjs/i,          // Indonesian health insurance ID
    /email.*@/i,
    /phone.*\d{8,}/i,
  ];

  return sensitivePatterns.some((p) => p.test(snippet));
}

export function isInternetExposed(filePath?: string, url?: string): boolean {
  if (url) return true;

  if (!filePath) return false;

  const exposedPatterns = [
    /controller/i,
    /handler/i,
    /endpoint/i,
    /route/i,
    /api/i,
    /view/i,
    /servlet/i,
    /webhook/i,
  ];

  return exposedPatterns.some((p) => p.test(filePath));
}
