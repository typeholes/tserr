
// import * as vscode from 'vscode';

import { EventBus, PluginDesc, Schema } from "@typeholes/tserr-common";
import { type } from "arktype";
import { processFileEvents, setSchema } from "./lib/handleDiagnostics";

export const pluginDesc = {
  name: 'tserr-tsmorph',
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
} satisfies PluginDesc;

export function activate(schema: Schema, eventbus: EventBus) {
  // vscode.window.showInformationMessage('activate ts-morph');

  setSchema(schema);

  schema.Plugin.add(pluginDesc)
  eventbus.onEvent(pluginDesc.name, 'fileChanges', (x: any) => processFileEvents(x));

  return { };
}
