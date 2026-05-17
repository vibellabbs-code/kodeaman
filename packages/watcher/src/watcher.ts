import { EventEmitter } from "node:events";
import { type FSWatcher, watch } from "node:fs";
import { relative, resolve, sep } from "node:path";

export interface WatcherOptions {
  path: string;
  debounceMs?: number;
  include?: string[];
  exclude?: string[];
}

export interface FileChangeEvent {
  path: string;
  eventType: "rename" | "change";
}

const DEFAULT_DEBOUNCE_MS = 300;

function normalizePath(path: string): string {
  return path.split(sep).join("/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(glob: string): RegExp {
  let pattern = "";

  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    const next = glob[i + 1];

    if (char === "*" && next === "*") {
      const afterGlobstar = glob[i + 2];
      if (afterGlobstar === "/") {
        pattern += "(?:.*/)?";
        i += 2;
      } else {
        pattern += ".*";
        i += 1;
      }
    } else if (char === "*") {
      pattern += "[^/]*";
    } else if (char === "?") {
      pattern += "[^/]";
    } else {
      pattern += escapeRegExp(char);
    }
  }

  return new RegExp(`^${pattern}$`);
}

export class FileWatcher extends EventEmitter {
  private watcher?: FSWatcher;
  private debounceTimer?: NodeJS.Timeout;
  private readonly rootPath: string;
  private readonly debounceMs: number;
  private readonly includePatterns: RegExp[];
  private readonly excludePatterns: RegExp[];
  private pendingEvent?: FileChangeEvent;

  constructor(options: WatcherOptions) {
    super();
    this.rootPath = resolve(options.path);
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.includePatterns = (options.include ?? ["**/*"]).map(globToRegExp);
    this.excludePatterns = (options.exclude ?? []).map(globToRegExp);
  }

  start(): void {
    if (this.watcher) {
      return;
    }

    this.watcher = watch(this.rootPath, { recursive: true }, (eventType, filename) => {
      if (!filename) {
        return;
      }

      const changedPath = resolve(this.rootPath, filename.toString());
      if (!this.matchesFilters(changedPath)) {
        return;
      }

      this.queueChange({ path: changedPath, eventType });
    });
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    this.watcher?.close();
    this.watcher = undefined;
    this.pendingEvent = undefined;
  }

  private queueChange(event: FileChangeEvent): void {
    this.pendingEvent = event;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.pendingEvent) {
        this.emit("change", this.pendingEvent);
        this.pendingEvent = undefined;
      }
    }, this.debounceMs);
  }

  private matchesFilters(path: string): boolean {
    const relativePath = normalizePath(relative(this.rootPath, path));
    const included = this.includePatterns.some((pattern) => pattern.test(relativePath));
    const excluded = this.excludePatterns.some((pattern) => pattern.test(relativePath));

    return included && !excluded;
  }
}
