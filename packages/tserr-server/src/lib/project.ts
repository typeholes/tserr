import { watch } from 'chokidar';
import { PluginState } from './tserr-server.types';
import { FSWatcher } from 'fs';

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
    const dir = projectPath.replace(/\/[^\/]*\.json$/, '');
    watcher = watch(dir + '/**/*.ts', {
      awaitWriteFinish: { pollInterval: 100, stabilityThreshold: 100}, // need to play with these values
      atomic: true,
      ignored: ['**/node_modules','**/dist', '**/out'], // should come from tsconfig
    }
    );
    watcher.on('all', handleWatcher);
    eventInterval = setInterval(processEvents, 100);
  }

  function close() {
    clearInterval(eventInterval);
    watcher?.close();
  }

  return { close, open };
}
