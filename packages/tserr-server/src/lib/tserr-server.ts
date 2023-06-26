import express from 'express';
import { Server } from 'socket.io';

import {
  U2T,
  type FlatErr,
  type ParsedError,
  tupleToObject,
  ProjectPath,
  PluginName,
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
import { Project, findConfigs, mkProject } from './project';
import { readFileSync, writeFileSync } from 'fs';
import { join as joinPath } from 'path';

export { TserrPluginApi, TserrPlugin } from './tserr-server.types';

export const tserrPluginEvents: U2T<keyof TserrPluginEvents> = [
  'resolvedErrors',
  'resetResolvedErrors',
  'supplement',
  'fixes',
  'hasProject',
  'openProject',
  'closeProject',
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
  hasProject: doNothing,
  openProject: doNothing,
  closeProject: doNothing,
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
export function startServer(
  servePath: string,
  projectRoot: string,
  serverPort = 3000
) {
  console.log('in start server');

  const configs = findConfigs(projectRoot);
  console.log(configs);

  // hacky way to set the port in the vue app.  Really should find a better way
  const indexFile = readFileSync(joinPath(servePath, 'index.html'))
    .toString()
    .replace("window.TsErrPort = '3100'", `window.TsErrPort = '${serverPort}'`);
  writeFileSync(joinPath(servePath, 'index.fixed.html'), indexFile);

  const plugins: Record<string, PluginState> = {};
  const pluginOrder: string[] = [];

  app = express();
  ('openProject');
  httpServer = http.createServer(app);
  io = new Server(httpServer, { cors: { origin: '*' } });
  //io = new Server(httpServer, { cors: { origin: 'http://localhost:4200' } });
  app.get('/', (req, res) => {
    res.sendFile(path.join(servePath, 'index.fixed.html'));
  });

  app.use(express.static(servePath));

  let hasConnection = false;
  const queuedEmits: [any, any[]][] = [];
  io.on('connection', (socket) => {
    hasConnection = true;
    socket.use((packet, next) => {
      console.log(packet);
      next();
    });
    socket.on('openProject', (path) => {
      for (const pluginKey of pluginOrder) {
        plugins[pluginKey]?.on.openProject(path);
      }
      projects[path]?.project.open();
    }),
      socket.on('closeProject', (path) => {
        for (const pluginKey of pluginOrder) {
          plugins[pluginKey]?.on.closeProject(path);
        }
        projects[path]?.project.close();
      }),
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

    for (const pluginKey of pluginOrder) {
      sendAddPlugin(pluginKey);
    }

    for (const [event, args] of queuedEmits) {
      io.emit(event, ...args);
    }
    queuedEmits.length = 0;
  });

  httpServer.listen(serverPort, () => {
    console.log(`listening on *:${serverPort}`);
  });

  function emit(event: string, ...args: any[]) {
    if (hasConnection) {
      io.emit(event, ...args);
    } else {
      queuedEmits.push([event, args]);
    }
  }

  function sendOpenProject(projectPath: ProjectPath) {
    emit('openProject', projectPath);
  }

  function sendConfigs() {
    emit('configs', configs);
  }

  function sendCloseProject(projectPath: ProjectPath) {
    emit('closeProject', projectPath);
  }

  function sendHasProject(projectPath: ProjectPath) {
    emit('hasProject', projectPath);
  }

  function sendAddPlugin(pluginKey: string) {
    const { active, displayName } = plugins[pluginKey];
    emit('addPlugin', pluginKey, active, displayName);
  }

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

  console.log(semanticErrorIdentifiers);

  function addSemanticErrorIdentifiers(
    ...identifiers: typeof semanticErrorIdentifiers
  ) {
    semanticErrorIdentifiers.push(...identifiers);
  }

  const projects: Record<
    ProjectPath,
    { project: Project; openedBy: PluginName }
  > = {};

  function getProjectPaths() {
    return Object.keys(projects) as ProjectPath[];
  }

  const addProjectEventHandlers = (pluginKey: string) =>
    function (...handlers: ProjectEventHandlers) {
      plugins[pluginKey].projectEventHandlers.push(...handlers);
    };

  // addSemanticErrorIdentifiers(...arkTypePlugin.semanticErrorIdentifiers);

  const senders = {
    fixes:
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
        emit('fixes', fixesRec);
      },
    hasProject: (pluginKey: string) => (path: string) => {
      if (path in projects) {
        return;
      }
      const projectPath = ProjectPath(path);

      projects[projectPath] = {
        project: mkProject(path, plugins),
        openedBy: PluginName.for(pluginKey),
      };
      sendHasProject(projectPath);
    },
    openProject: (pluginKey: string) => (path: string) => {
      if (path in projects) {
        throw new Error('project `${path}` is already open');
      }
      const projectPath = ProjectPath(path);

      if (!(projectPath in projects)) {
        projects[projectPath] = {
          project: mkProject(path, plugins),
          openedBy: PluginName.for(pluginKey),
        };
        sendHasProject(projectPath);
      }

      projects[projectPath].project.open();
      sendOpenProject(projectPath);
    },
    closeProject: (pluginKey: string) => (path: string) => {
      if (!(path in projects)) {
        return;
      }
      const projectPath = ProjectPath(path);

      projects[projectPath].project.close();
      sendCloseProject(projectPath);
    },
    resetResolvedErrors: (pluginKey: string) => () => {
      emit('resetResolvedErrors', pluginKey);
      fixFunctions = {};
    },
    resolvedErrors:
      (pluginKey: string) => (fileName: string, resolvedError: FlatErr[]) => {
        emit('resolvedError', pluginKey, fileName, resolvedError);
      },
    supplement: (pluginKey: string) => (id: number, supplement: string) => {
      emit('supplement', id, supplement);
    },
  } as const;

  function mkPluginInterface(plugin: TserrPlugin): TserrPluginApi {
    if (plugin.key in plugins) {
      throw new Error(`plugin key ${plugin.key} already registered`);
    }

    const api = {
      send: tupleToObject<TserrPluginEvents>(tserrPluginEvents)((event) => {
        return app(event);
      }),
      on: tupleToObject<TserrPluginEvents>(tserrPluginEvents)((event) =>
        store(event)
      ),
      // addSemanticErrorIdentifiers,
      getConfigs: () => configs,
      getProjectPaths,
      addProjectEventHandlers: addProjectEventHandlers(plugin.key),
      // sendOpenProject: app(openProject),
    };

    pluginOrder.push(plugin.key);
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

    function app<T extends keyof typeof senders>(sendKey: T) {
      const fn = senders[sendKey];
      return (...args: any[]) => {
        fn(plugin.key)(
          // @ts-expect-error let me spread
          ...args
        );

        // propogate to other plugins in order of registration
        for (const toPlugin of pluginOrder) {
          if (plugins[toPlugin].active && plugin.key !== toPlugin) {
            plugins[toPlugin].on[sendKey](
              // @ts-expect-error let me spread
              ...args
            );
          }
        }
      };
    }
    function store<T extends keyof TserrPluginApi['on']>(key: T) {
      return (on: PluginState['on'][T]) => (plugins[plugin.key].on[key] = on);
    }
  }

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

  sendConfigs();
  console.log('start server returning', ret);
  return ret;
}
