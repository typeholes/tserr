import { watch } from 'chokidar';
import { PluginState } from './tserr-server.types';
import { FSWatcher, readdirSync, statSync, readFileSync } from 'fs';
import { join as joinPath, parse as parsePath, sep as pathSep } from 'path';
import {
  ProjectConfigs,
  TsErrConfig,
  tsErrConfig,
} from '@typeholes/tserr-common';

export type ProjectEventType =
  | 'add'
  | 'addDir'
  | 'change'
  | 'unlink'
  | 'unlinkDir';
export type ProjectEvent = { type: ProjectEventType; filePath: string };

export type Project = ReturnType<typeof mkProject>;

export function mkProject(
  projectPath: string,
  plugins: Record<string, PluginState>
) {
  let waiting = true;
  let events: ProjectEvent[] = [];

  function handleWatcher(type: ProjectEventType, filePath: string) {
    events.push({ type, filePath });
    waiting = true;
  }

  function processEvents() {
    if (waiting) {
      waiting = false;
      return;
    }

    if (events.length > 0) {
      for (const pluginKey in plugins) {
        if (plugins[pluginKey].active) {
          plugins[pluginKey].projectEventHandlers.forEach((handler) =>
            handler(events)
          );
        }
      }

      events = [];
    }
  }

  let watcher: FSWatcher | undefined = undefined;

  let eventInterval: NodeJS.Timer | undefined = undefined;

  function open() {
    const dir = projectPath.replace(/\/[^/]*\.json$/, '');
    watcher = watch(dir + '/**/*.ts', {
      awaitWriteFinish: { pollInterval: 100, stabilityThreshold: 100 }, // need to play with these values
      atomic: true,
      ignored: ['**/node_modules', '**/dist', '**/out'], // should come from tsconfig
    });
    watcher.on('all', handleWatcher);
    eventInterval = setInterval(processEvents, 100);
  }

  function close() {
    clearInterval(eventInterval);
    watcher?.close();
  }

  return { close, open };
}

export function findConfigs(
  dirPath: string,
  resolved: ProjectConfigs = {}
): ProjectConfigs {
  const tsConfigs: string[] = [];
  const errConfigs: string[] = [];
  const dirs: string[] = [];
  readdirSync(dirPath).forEach((file) => {
    const path = joinPath(dirPath, file);
    if (file === 'node_modules' || file.startsWith('.')) {
      return;
    }
    if (statSync(path).isDirectory()) {
      dirs.push(path);
    } else {
      if (file.match(/^tsconfig.*\.json$/)) {
        tsConfigs.push(path);
        console.log('found project ${path}');
      }
      if (file.match(/^tserr.json$/)) {
        errConfigs.push(path);
        console.log('found tserr config ${path}');
      }
    }
  });

  Object.assign(resolved, resolveConfigs(tsConfigs, errConfigs));
  dirs.forEach((p) => findConfigs(p, resolved));

  return resolved;
}

function resolveConfigs(ts: string[], err: string[]) {
  const resolved: Record<
    string,
    {
      tsconfig?: string[];
      tserr?: string;
      parentPath: string;
      config?: TsErrConfig;
    }
  > = {};
  const tsPaths = ts.map(path2tuple).sort();
  const errPaths = err.map(path2tuple).sort();

  for (const ts of tsPaths) {
    if (resolved[ts[0]]) {
      resolved[ts[0]].tsconfig ??= [];
      resolved[ts[0]].tsconfig?.push(ts[1]);
    } else {
      resolved[ts[0]] = { tsconfig: [ts[1]], parentPath: ts[2] };
    }
  }
  for (const err of errPaths) {
    const parentConfig = resolved[err[0]].config;
    const config = mergeConfig(parentConfig, readConfig(err[0], err[1]));

    resolved[err[0]] = {
      tsconfig: resolved[err[0]]?.tsconfig,
      tserr: err[1],
      parentPath: err[2],
      config,
    };
  }

  return resolved;
}

function path2tuple(pathStr: string) {
  const p = parsePath(pathStr);
  const dirs = p.dir.split(pathSep);
  return [p.dir, p.base, joinPath(...dirs.slice(0, -2))] as const;
}

function readConfig(dir: string, fileName: string): TsErrConfig {
  const file = readFileSync(joinPath(dir, fileName));
  const json = JSON.parse(file.toString());
  const { data, problems } = tsErrConfig(json);
  if (problems) {
    throw new Error(problems.summary);
  }
  return data;
}

function mergeConfig(
  parentConfig: TsErrConfig | undefined,
  config: TsErrConfig
): TsErrConfig {
  if (parentConfig === undefined) {
    return config;
  }

  const ret = { ...parentConfig };
  ret.openProjects.push(...config.openProjects);
  ret.ignoreErrCodes.push(...config.ignoreErrCodes);

  return ret;
}
