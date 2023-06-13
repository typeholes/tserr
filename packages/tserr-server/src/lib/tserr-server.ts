import express from 'express';
import { Server } from 'socket.io';

import { type FlatErr, type ParsedError } from '@typeholes/tserr-common';
import * as http from 'http';
import * as path from 'path';
import { Node } from 'ts-morph';
import { ProjectEventHandlers, TserrPluginApi } from './tserr-server.types';
import { Project, ProjectEvent, mkProject } from './project';
import { stringify } from 'querystring';

export { TserrPluginApi, TserrPlugin } from './tserr-server.types';

export type PluginStates = Record<
  string,
  {
    active: boolean;
    displayName: string;
    api: TserrPluginApi;
    onOpenProject: (projectPath: string) => void;
    projectEventHandlers: ProjectEventHandlers;
  }
>;

export const semanticErrorIdentifiers: ((
  err: ParsedError,
  fromNode: Node
) => { isSemantic: boolean; fixes: { label: string; fn: () => void }[] })[] =
  [];

export type Diagnostic = {
  message: string;
  start: {
    line: number;
    character: number;
  };
  end: {
    line: number;
    character: number;
  };
};

process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log(err);
});

// Do not use these until startServer is called
let app: ReturnType<typeof express> = undefined as never;
let httpServer: http.Server /*<
   typeof http.IncomingMessage,
   typeof http.ServerResponse
>*/ = undefined as never;
let io: Server = undefined as never;

let gotoDefinition = (
  fileName: string,
  text: string,
  diagnostic: Diagnostic
) => {
  /* todo */ console.log({ fileName, text, diagnostic });
};

export type ErrorServer = ReturnType<typeof startServer>;
export function startServer(basePath: string) {
  app = express();
  httpServer = http.createServer(app);
  io = new Server(httpServer, { cors: { origin: 'http://localhost:4200' } });
  app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'index.html'));
  });

  app.use(express.static(basePath));

  io.on('connection', (socket) => {
    socket.use((packet, next) => {
      console.log(packet);
      next();
    });
    socket.on(
      'gotoDefinition',
      (_requestId: number, filename, text, diagnostic) => {
        gotoDefinition(filename, text, diagnostic);
      }
    );
    socket.on('applyFix', (fixId: number) => fixFunctions[fixId]());
    socket.on(
      'setPlugin',
      (pluginKey: string, active: boolean) =>
        (plugins[pluginKey].active = active)
    );

    for (const pluginKey in plugins) {
      sendAddPlugin(pluginKey);
    }
  });

  httpServer.listen(3000, () => {
    console.log('listening on *:3000');
  });

  function sendAddPlugin(pluginKey: string) {
    const { active, displayName } = plugins[pluginKey];
    io.emit('addPlugin', pluginKey, active, displayName);
  }

  function sendSupplement(id: number, supplement: string) {
    io.emit('supplement', id, supplement);
  }

  function sendDiagnostic(fileName: string, diagnostics: Diagnostic[]) {
    io.emit('diagnostics', fileName, diagnostics);
  }

  const sendResolvedErrors = (pluginKey: string) =>
    function (fileName: string, resolvedError: FlatErr[]) {
      io.emit('resolvedError', pluginKey, fileName, resolvedError);
    };

  function onGotoDefinition(
    callback: (fileName: string, text: string, diagnostic: Diagnostic) => void
  ) {
    gotoDefinition = callback;
  }

  let fixFunctions: Record<number, () => void> = {};
  const sendResetResolvedErrors = (pluginKey: string) =>
    function () {
      io.emit('resetResolvedErrors', pluginKey);
      fixFunctions = {};
    };

  function sendFixes(
    fixesRec: Record<
      number,
      [fixId: number, fixDescription: string, fn: () => void][]
    >
  ) {
    for (const fixes of Object.values(fixesRec)) {
      for (const fix of fixes) {
        fixFunctions[fix[0]] = fix[2];
      }
    }
    io.emit('fixes', fixesRec);
  }

  // let idx = 0;
  // setInterval(() => {
  //    idx++;
  //    onDiagnostic('testFile', [
  //       `type 'foo${idx}' is not assignable to type 'Foo<number>'.`,
  //    ]);
  //    console.log('emitted test diagnostic');
  // }, 1000);

  console.log(semanticErrorIdentifiers);

  function addSemanticErrorIdentifiers(
    ...identifiers: typeof semanticErrorIdentifiers
  ) {
    semanticErrorIdentifiers.push(...identifiers);
  }

  let projectPath: undefined | string = undefined;
  let project: undefined | Project = undefined;
  function getProjectPath() {
    return projectPath;
  }

  function openProject(path: string) {
    projectPath = path;
    project = mkProject(path, plugins);
    for (const pluginKey in plugins) {
      plugins[pluginKey].onOpenProject(path);
    }
  }

  const addProjectEventHandlers = (pluginKey: string) =>
    function (...handlers: ProjectEventHandlers) {
      plugins[pluginKey].projectEventHandlers.push(...handlers);
    };

  // addSemanticErrorIdentifiers(...arkTypePlugin.semanticErrorIdentifiers);

  function mkPluginInterface(pluginKey: string): TserrPluginApi {
    return {
      // sendDiagnostic,
      // onGotoDefinition,
      sendResolvedError: sendResolvedErrors(pluginKey),
      sendResetResolvedErrors: sendResetResolvedErrors(pluginKey),
      sendSupplement,
      sendFixes,
      // addSemanticErrorIdentifiers,
      getProjectPath,
      addProjectEventHandlers: addProjectEventHandlers(pluginKey),
      onOpenProject: (on: (projectPath: string) => void) => {
        plugins[pluginKey].onOpenProject = on;
      },
    };
  }

  const plugins: PluginStates = {};

  async function loadPlugin(pluginPath: string) {
    await import(pluginPath).then((module) => {
      const plugin = module.plugin;
      if (
        !(
          plugin.register instanceof Function &&
          typeof plugin.key == 'string' &&
          typeof plugin.displayName === 'string'
        )
      ) {
        throw new Error('invalid plugin');
      }

      if (plugin.key in plugins) {
        throw new Error(`plugin key ${plugin.key} already registered`);
      }

      const api = mkPluginInterface(plugin.key);

      plugins[plugin.key] = {
        active: true,
        displayName: plugin.displayName,
        api,
        onOpenProject: () => {
          /**/
        },
        projectEventHandlers: [() => api.sendResetResolvedErrors()],
      };

      plugin.register(api);

      sendAddPlugin(plugin.key);
    });
  }

  return { openProject, loadPlugin };
}
