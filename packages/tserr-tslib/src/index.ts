import { setSchema, watchMain } from './project';

// console.log(process.argv[2]);

// const consfigFile = process.argv[2];

// watchMain(consfigFile);

// import * as vscode from 'vscode';

import { EventBus, PluginDesc, Schema } from '@typeholes/tserr-common';
import { type } from 'arktype';

import * as ts from 'typescript';

export const pluginDesc = {
  name: 'tserr-tslib',
  events: {
    fileChanges: {
      sends: true,
      handles: false,
      type: type([
        {
          operation: "'add'|'change'|'unlink'",
          filePath: 'string',
        },
        [],
      ]),
    },
  },
} satisfies PluginDesc;

export function activate() {
  return {
    desc: pluginDesc,
    activate: (schema: Schema, eventbus: EventBus) => {
      // vscode.window.showInformationMessage('activate ts-morph');

      setSchema(schema);

      schema.Plugin.add(pluginDesc);
      // eventbus.onEvent(schema, pluginDesc.name, 'fileChanges', (x: any) =>
      //   processFileEvents(x),
      // );

      (window as any).tserrFileApi ??= {};
      (window as any).tserrFileApi.ts = ts;
    },
  };
}
