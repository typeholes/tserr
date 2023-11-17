import { boot } from 'quasar/wrappers';
import { type } from 'arktype';
import {
  PluginDesc,
  Schema,
  eventbus,
  initTsErrorDescriptions,
  onEvent,
} from '../../../tserr-common/src';
import { loadConfig } from 'src/app/config';
import { plugins } from 'postcss.config.cjs';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  const schema = window.tserrSchema.schema;
  initTsErrorDescriptions(schema);

  if (window.tserrConfigPath) {
    loadConfig(window.tserrConfigPath);
  }

  const pluginDesc: PluginDesc = {
    name: 'main',
    events: {
      fileChanges: {
        sends: false,
        handles: true,
        type: type([
          {
            floperation: "'add'|'change'|'unlink'",
            filePath: 'string',
          },
          [],
        ]),
      },
    },
  };

  schema.Plugin.add(pluginDesc);

  onEvent(schema, 'main', 'fileChanges', (x) =>
    console.log({ fileChangesEvent: x }),
  );

  const pluginNames = (window as any).tserrPlugins ?? [];
  console.log(pluginNames);

  for (const path of pluginNames.slice(1)) {
    loadPlugin(schema, path);
    // })
    // .catch((e) => {
    // throw new Error(`import failed for ${path}: ${e}`);
    // });
  }
});

export const activations: Record<string, () => void> = {};

export function loadPlugin(schema: Schema, path: string) {
  const module = require(path);
  // import(/* @vite-ignore */ 'file://'+path)
  // .then((module) => {
  if (
    typeof module === 'object' &&
    'activate' in module &&
    typeof module.activate === 'function'
  ) {
    const { desc, activate } = module.activate(schema, eventbus);
    schema.Plugin.add(desc);
    activations[desc.name] = activate;
    activate(schema, eventbus);
  } else {
    throw new Error(`invalid plugin ${path}`);
  }
}
