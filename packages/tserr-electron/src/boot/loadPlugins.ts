// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore editor vs build conflict
import { boot } from 'quasar/wrappers';
import { type, } from 'arktype';
import {
  PluginDesc,
  Schema,
  eventbus,
  initTsErrorDescriptions,
  onEvent,
} from '../../../tserr-common/src';
import { loadConfig } from 'src/app/config';

declare global {
  interface Window {
    codeToHtml: (code: string, theme?: string, lang?: string) => string;
    tserrPlugins: string[];
    tserrConfigPath: string | undefined;
    tserrFileApi: {
      readFile: (path: string | number, options?: {
    encoding?: null | undefined;
    flag?: string | undefined;
} | null) => Buffer;
      writeFile: (path: string | number, data: any, options?: any) => void;
    };
    tserrSchema: { schema: Schema };
  }
}


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
        type: type(
          // [
          {
            floperation: "'add'|'change'|'unlink'",
            filePath: 'string',
          },
          // [],
        // ]
        ),
      },
    },
  };

  pluginDesc.events.fileChanges.type

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
    const { desc, activate, debugFN } = module.activate(schema, eventbus);
    schema.Plugin.add(desc);
    activations[desc.name] = activate;
    if (debugFN && typeof debugFN === 'function') {
      debugFN(schema, eventbus)
    } //else {
    activate(schema, eventbus);
    // }
  } else {
    throw new Error(`invalid plugin ${path}`);
  }
}
