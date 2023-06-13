import { watch } from 'chokidar';
import { PluginStates } from './tserr-server';

export type ProjectEventType =
  | 'add'
  | 'addDir'
  | 'change'
  | 'unlink'
  | 'unlinkDir';
export type ProjectEvent = { type: ProjectEventType; filePath: string };

export type Project = ReturnType<typeof mkProject>;

export function mkProject(projectPath: string, plugins: PluginStates) {
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

  const watcher = watch(projectPath);
  watcher.on('all', handleWatcher);

  const eventInterval = setInterval(processEvents, 100);

  function close() {
    clearInterval(eventInterval);
    watcher.close();
  }

  return { close };
}
