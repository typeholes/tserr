import express from 'express';
import { Server } from 'socket.io';

import {
  U2T,
  type FlatErr,
  type ParsedError,
  tupleToObject,
  ProjectPath,
  PluginName,
  relPath,
  FlatErrKey,
  FlatErrMap,
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
import { parse as parsePath, join as joinPath } from 'path';

export { TserrPluginApi, TserrPlugin } from './tserr-server.types';

import { setOnUpdate, updateErrors } from './errorBus';

export const tserrPluginEvents: U2T<keyof TserrPluginEvents> = [
  'resolvedErrors',
  'resetResolvedErrors',
  'newErrors',
  'changedErrors',
  'fixedErrors',
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
  (_) => doNothing,
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
  newErrors: doNothing,
  changedErrors: doNothing,
  fixedErrors: doNothing,
};

export const semanticErrorIdentifiers: ((
  err: ParsedError,
  fromNode: Node,
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
  searchToLine: number,
) => {
  /* todo */ console.log({ fileName, text, searchFromLine, searchToLine });
};

export type ErrorServer = ReturnType<typeof startServer>;
export function startServer(servePath: string, projectRoot: string, port = 0) {
  console.log('in start server');

  const configs = findConfigs(projectRoot);
  console.log(configs);

  const plugins: Record<string, PluginState> = {};
  const pluginOrder: string[] = [];

  app = express();
  ('openProject');
  httpServer = app.listen(port);
  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Did not get AddressInfo from httpServer.address()');
  }
  const serverPort = address.port;
  console.log({ serverPort });
  const indexFileName = `index.${serverPort}.html`;
  // hacky way to set the port in the vue app.  Really should find a better way
  const indexFile = readFileSync(joinPath(servePath, 'index.html'))
    .toString()
    .replace("window.TsErrPort = '3100'", `window.TsErrPort = '${serverPort}'`);
  writeFileSync(joinPath(servePath, indexFileName), indexFile);

  io = new Server(httpServer, { cors: { origin: '*' } });
  app.get('/', (req, res) => {
    res.sendFile(path.join(servePath, indexFileName));
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
      const relative = relPath(projectRoot, path);
      writeConfig('openProject', relative);
      for (const pluginKey of pluginOrder) {
        plugins[pluginKey]?.on.openProject(relative);
      }
      projects[relative as ProjectPath]?.project.open();
    }),
      socket.on('closeProject', (path) => {
        const relative = relPath(projectRoot, path);
        writeConfig('closeProject', relative);
        const files = projects[relative as ProjectPath]?.project.close();
        for (const pluginKey of pluginOrder) {
          plugins[pluginKey]?.on.closeProject(relative);
          plugins[pluginKey]?.api.send.resetResolvedErrors(files);
        }
      }),
      socket.on(
        'gotoDefinition',
        (filename, text, searchFromLine, searchToLine) => {
          gotoDefinition(filename, text, searchFromLine, searchToLine);
        },
      );
    socket.on('applyFix', (fixId: number) => fixFunctions[fixId]());
    socket.on(
      'setPlugin',
      (pluginKey: string, active: boolean) =>
        (plugins[pluginKey].active = active),
    );

    socket.on('refreshFrontend', () => {
      sendProjectRoot();
      sendConfigs();
      for (const path in projects) {
        const projectPath = ProjectPath.for(path);
        sendHasProject(projectPath, projects[projectPath].project.isOpen());
      }
    });

    for (const pluginKey of pluginOrder) {
      sendAddPlugin(pluginKey);
    }

    for (const [event, args] of queuedEmits) {
      io.emit(event, ...args);
    }
    queuedEmits.length = 0;
  });

  function emit(event: string, ...args: any[]) {
    if (hasConnection) {
      console.log(event, ...args);
      io.emit(event, ...args);
    } else {
      queuedEmits.push([event, args]);
    }
  }

  function sendProjectRoot() {
    emit('projectRoot', projectRoot);
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

  function sendHasProject(projectPath: ProjectPath, isOpen?: boolean) {
    emit('hasProject', projectPath, isOpen);
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
      searchToLine: number,
    ) => void,
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
        >,
      ) => {
        for (const fixes of Object.values(fixesRec)) {
          for (const fix of fixes) {
            fixFunctions[fix[0]] = fix[2];
          }
        }
        emit('fixes', fixesRec);
      },
    hasProject: (pluginKey: string) => (path: string) => {
      const relative = relPath(projectRoot, path);
      if (relative in projects) {
        return;
      }
      const projectPath = ProjectPath(relative);

      projects[projectPath] = {
        project: mkProject(projectRoot, relative, plugins),
        openedBy: PluginName.for(pluginKey),
      };
      console.log('finished hasProject', projectPath, projects);
      sendHasProject(projectPath);
    },
    openProject: (pluginKey: string) => (path: string) => {
      const relative = relPath(projectRoot, path);
      const projectPath = ProjectPath(relative);

      if (relative in projects && projects[projectPath].project.isOpen()) {
        return;
      }
      if (!(projectPath in projects)) {
        console.log('opening new project', projectPath, projects);
        projects[projectPath] = {
          project: mkProject(projectRoot, relative, plugins),
          openedBy: PluginName.for(pluginKey),
        };
        sendHasProject(projectPath);
      } else {
        console.log('opening existing project');
      }

      projects[projectPath].project.open();
      sendOpenProject(projectPath);
    },
    closeProject: (_pluginKey: string) => (path: string) => {
      const relative = relPath(projectRoot, path);
      console.log('closeProject check', relative, projects);
      if (!(relative in projects)) {
        return;
      }
      const projectPath = ProjectPath(relative);

      projects[projectPath].project.close();
      sendCloseProject(projectPath);
    },
    resetResolvedErrors: (pluginKey: string) => (filenames?: string[]) => {
      // emit('resetResolvedErrors', pluginKey, filenames);
      fixFunctions = {};
    },
    resolvedErrors:
      (pluginKey: string) => (fileName: string, resolvedError: FlatErr[]) => {
        updateErrors(resolvedError, {
          plugin: pluginKey as PluginName,
          file: fileName,
        });
        // emit('resolvedError', pluginKey, fileName, resolvedError);
      },
    supplement: (_pluginKey: string) => (id: number, supplement: string) => {
      emit('supplement', id, supplement);
    },

    newErrors: (_pluginKey: string) => (errors: FlatErrMap) => {
      emit('newErrors', Array.from(errors.rawEntries()));
    },

    changedErrors: (_pluginKey: string) => (errors: FlatErrMap) => {
      emit('changedErrors', Array.from(errors.rawEntries()));
    },

    fixedErrors: (_pluginKey: string) => (errIds: FlatErrKey[]) => {
      emit('fixedErrors', errIds);
    },
  } as const;

  function mkPluginInterface(plugin: TserrPlugin): TserrPluginApi {
    if (plugin.key in plugins) {
      throw new Error(`plugin key ${plugin.key} already registered`);
    }

    const api = {
      pluginName: PluginName(plugin.key),
      send: tupleToObject<TserrPluginEvents>(tserrPluginEvents)((event) => {
        return app(event);
      }),
      on: tupleToObject<TserrPluginEvents>(tserrPluginEvents)((event) =>
        store(event),
      ),
      // addSemanticErrorIdentifiers,
      getProjectRoot: () => projectRoot,
      getConfigs: () => configs,
      getProjectPaths,
      addProjectEventHandlers: addProjectEventHandlers(plugin.key),
      newErrors: (errors: FlatErr[]) => {},
      changed: (errors: FlatErr[]) => {},
      fixedErrors: (errIds: number[]) => {},
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
          ...args,
        );

        // propogate to other plugins in order of registration
        for (const toPlugin of pluginOrder) {
          if (plugins[toPlugin].active && plugin.key !== toPlugin) {
            plugins[toPlugin].on[sendKey](
              // @ts-expect-error let me spread
              ...args,
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

  function writeConfig(event: string, atPath: string) {
    const parsed = parsePath(atPath);
    const fileName = parsed.base;
    let configPath = relPath(projectRoot, parsed.dir);
    if (!configPath.endsWith('/')) {
      configPath += '/';
    }
    const path = configPath + fileName;
    let config = configs[configPath];

    while (config?.tserr === undefined) {
      if (!config) {
        return;
      }
      config = configs[(configPath = config.parentPath)];
    }

    switch (event) {
      case 'openProject': {
        if (!config.config?.openProjects.includes(path)) {
          config.config?.openProjects.push(path);
        }
        break;
      }
      case 'closeProject': {
        if (config.config) {
          config.config.openProjects = config.config?.openProjects.filter(
            (p) => p !== path,
          );
        }
        break;
      }
    }

    config.tserr = JSON.stringify(config.config, null, 2);
    const tgtPath = joinPath(projectRoot, configPath, 'tserr.json');
    writeFileSync(tgtPath, config.tserr);
  }

  setOnUpdate({
    new: (errors: FlatErrMap) => {
      senders.newErrors('')(errors);
    },
    changed: (errors: FlatErrMap) => {
      senders.changedErrors('')(errors);
    },
    fixed: (errIds: FlatErrKey[]) => {
      senders.fixedErrors('')(errIds);
    },
  });

  const ret = {
    importPlugin,
    onGotoDefinition,
    shutdownServer,
    mkPluginInterface,
    getPort: () => serverPort,
  };

  sendProjectRoot();
  sendConfigs();
  console.log('start server returning', ret);
  return ret;
}
