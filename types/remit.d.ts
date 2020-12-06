import { Plugin, RollupOptions } from 'rollup'

// Redeclare FilterPattern instead of importing from @rollup/pluginutils
// in order to avoid missing estree error:
export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;

export interface RollupRemitPluginOptions {
  include?: FilterPattern
  exclude?: FilterPattern
  options?: RollupOptions | ((options: RollupOptions) => RollupOptions)
}

export default function createRemitPlugin(options?: RollupRemitPluginOptions): Plugin
