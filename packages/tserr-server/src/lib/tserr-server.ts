import express, { application } from 'express';
import { Server } from 'socket.io';

import {
  U2T,
  type FlatErr,
  type ParsedError,
  tupleToObject,
} from '@typeholes/tserr-common';
import * as http from 'http';
import * as path from 'path';
import { Node } from 'ts-morph';
import {
  PluginState,
  ProjectEventHandlers,
  TserrPluginApi,
  TserrPluginEvents,
  TserrPlugin,
} from './tserr-server.types';
import { Project, mkProject } from './project';

export { TserrPluginApi, TserrPlugin } from './tserr-server.types';

export const tserrPluginEvents: U2T<keyof TserrPluginEvents> = [
  'resolvedErrors',
  'resetResolvedErrors',
  'supplement',
  'fixes',
  'openProject',
];

const doNothing = () => {
  /* */
};
const doNothingEvents = tupleToObject<TserrPluginEvents>(tserrPluginEvents)(
  (_) => doNothing
);

//Object.fromEntries(tserrPluginEvents.map(event => [event, doNothing] as const)) as unknown as TserrPluginEvents
const _doNothingEvents: TserrPluginEvents = {
  fixes: doNothing,
  openProject: doNothing,
  resetResolvedErrors: doNothing,
  resolvedErrors: doNothing,
  supplement: doNothing,
};

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
  searchFromLine: number,
  searchToLine: number
) => {
  /* todo */ console.log({ fileName, text, searchFromLine, searchToLine });
};

export type ErrorServer = ReturnType<typeof startServer>;
export function startServer(basePath: string) {
  console.log('in start server');
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
      (filename, text, searchFromLine, searchToLine) => {
        gotoDefinition(filename, text, searchFromLine, searchToLine);
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

  const sendSupplement =
    (pluginKey: string) => (id: number, supplement: string) => {
      io.emit('supplement', id, supplement);
    };

  const sendResolvedErrors =
    (pluginKey: string) => (fileName: string, resolvedError: FlatErr[]) => {
      io.emit('resolvedError', pluginKey, fileName, resolvedError);
    };

  function onGotoDefinition(
    callback: (
      fileName: string,
      text: string,
      searchFromLine: number,
      searchToLine: number
    ) => void
  ) {
    gotoDefinition = callback;
  }

  let fixFunctions: Record<number, () => void> = {};
  const sendResetResolvedErrors = (pluginKey: string) => () => {
    io.emit('resetResolvedErrors', pluginKey);
    fixFunctions = {};
  };

  const sendFixes =
    (pluginKey: string) =>
    (
      fixesRec: Record<
        number,
        [fixId: number, fixDescription: string, fn: () => void][]
      >
    ) => {
      for (const fixes of Object.values(fixesRec)) {
        for (const fix of fixes) {
          fixFunctions[fix[0]] = fix[2];
        }
      }
      io.emit('fixes', fixesRec);
    };

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

  const sendOpenProject = (pluginKey: string) => (path: string) => {
    projectPath = path;
    project = mkProject(path, plugins);
    for (const pluginKey in plugins) {
      plugins[pluginKey].on.openProject(path);
    }
  };

  const addProjectEventHandlers = (pluginKey: string) =>
    function (...handlers: ProjectEventHandlers) {
      plugins[pluginKey].projectEventHandlers.push(...handlers);
    };

  // addSemanticErrorIdentifiers(...arkTypePlugin.semanticErrorIdentifiers);

  function mkPluginInterface(plugin: TserrPlugin): TserrPluginApi {
    if (plugin.key in plugins) {
      throw new Error(`plugin key ${plugin.key} already registered`);
    }

    const api = {
      // sendDiagnostic,
      // onGotoDefinition,
      send: {
        fixes: app(sendFixes),
        openProject: app(sendOpenProject),
        resetResolvedErrors: app(sendResetResolvedErrors),
        resolvedErrors: app(sendResolvedErrors),
        supplement: app(sendSupplement),
      },
      on: tupleToObject<TserrPluginEvents>(tserrPluginEvents)((event) =>
        store(event)
      ),
      // addSemanticErrorIdentifiers,
      getProjectPath,
      addProjectEventHandlers: app(addProjectEventHandlers),
      // sendOpenProject: app(openProject),
    };

    plugins[plugin.key] = {
      active: true,
      displayName: plugin.displayName,
      api,
      on: doNothingEvents,
      projectEventHandlers: [() => api.send.resetResolvedErrors()],
    };

    plugin.register(api);

    sendAddPlugin(plugin.key);

    return api;

    function app<T>(fn: (key: string) => T) {
      return fn(plugin.key);
    }
    function store<T extends keyof TserrPluginApi['on']>(key: T) {
      return (on: PluginState['on'][T]) => (plugins[plugin.key].on[key] = on);
    }
  }

  const plugins: Record<string, PluginState> = {};

  async function importPlugin(pluginPath: string) {
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

      const api = mkPluginInterface(plugin);
      return api;
    });
  }

  function shutdownServer() {
    httpServer.close();
    io.close();
    httpServer.closeAllConnections();
  }

  const ret = {
    importPlugin,
    onGotoDefinition,
    shutdownServer,
    mkPluginInterface,
  };
  console.log('start server returning', ret);
  return ret;
}
