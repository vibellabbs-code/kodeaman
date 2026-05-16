export { ScanPipeline } from "./pipeline.js";
export { PluginLoader } from "./plugin-loader.js";
export { deduplicateFindings } from "./dedup.js";
export {
  SCANNER_OWASP_COVERAGE,
  SCANNER_SURFACE_COVERAGE,
  buildCoverageReport,
} from "./coverage.js";
export type {
  ScannerAdapter,
  ScanContext,
  ScanResult,
  ScanSummary,
  TimingInfo,
  ScannerCoverage,
  CoverageReport,
  KodeamanConfig,
  KodeamanPlugin,
  PluginConfig,
  PluginHooks,
  PrioritizationConfig,
  GamificationConfig,
  OutputConfig,
} from "./types.js";
