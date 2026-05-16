import type { KodeamanPlugin, PluginConfig } from "./types.js";

type PluginFactory = () => KodeamanPlugin | Promise<KodeamanPlugin>;
type PluginExport = KodeamanPlugin | PluginFactory;
type PluginModule = KodeamanPlugin | { default?: PluginExport; plugin?: PluginExport };

export class PluginLoader {
  async load(configs: PluginConfig[] = []): Promise<KodeamanPlugin[]> {
    const plugins: KodeamanPlugin[] = [];

    for (const config of configs) {
      if (config.enabled === false) {
        continue;
      }

      const plugin = await this.loadPlugin(config);
      await plugin.configure?.(config);
      plugins.push(plugin);
    }

    return plugins;
  }

  private async loadPlugin(config: PluginConfig): Promise<KodeamanPlugin> {
    const moduleName = config.package ?? config.name;
    const imported = (await import(moduleName)) as PluginModule;
    const candidate = await this.resolvePlugin(imported);

    if (!candidate || typeof candidate.name !== "string") {
      throw new Error(`Plugin ${config.name} did not export a valid KodeamanPlugin`);
    }

    return candidate;
  }

  private async resolvePlugin(module: PluginModule): Promise<KodeamanPlugin | undefined> {
    if ("name" in module && typeof module.name === "string") {
      return module;
    }

    let candidate: PluginExport | undefined;
    if ("default" in module) {
      candidate = module.default;
    } else if ("plugin" in module) {
      candidate = module.plugin;
    }

    if (typeof candidate === "function") {
      return candidate();
    }

    return candidate;
  }
}
