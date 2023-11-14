import { boot } from 'quasar/wrappers';
import { schema } from '../../../tserr-common/src/lib/schema/schema';
import { type } from 'arktype';
import {
  PluginDesc,
  eventbus,
  initTsErrorDescriptions,
  onEvent,
} from '../../../tserr-common/src';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  initTsErrorDescriptions(schema);

  const pluginDesc: PluginDesc = {
    name: 'main',
    events: {
      fileChanges: {
        sends: false,
        handles: true,
        type: type([
          {
            operation: "'add'|'change'|'unlink'",
            filePath: 'string',
          },
          [],
        ]),
      },
    },
  };

  schema.Plugin.add(pluginDesc);

  onEvent('main', 'fileChanges', (x) => console.log({ fileChangesEvent: x }));

  const pluginNames = (window as any).tserrPlugins ?? [];
  console.log(pluginNames);

  for (const path of pluginNames.slice(1)) {
    const module = require(path);
    // import(/* @vite-ignore */ 'file://'+path)
    // .then((module) => {
    if (
      typeof module === 'object' &&
      'activate' in module &&
      typeof module.activate === 'function'
    ) {
      module.activate(schema, eventbus);
    } else {
      throw new Error(`invalid plugin ${path}`);
    }
    // })
    // .catch((e) => {
    // throw new Error(`import failed for ${path}: ${e}`);
    // });
  }
});
