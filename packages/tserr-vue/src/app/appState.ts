import { reactive } from 'vue';
import {
  PluginName,
  ProjectPath,
  ProjectConfigs,
  FlatErrKey,
  errMap,
  FlatErrValue,
  mergeSources,
} from '@typeholes/tserr-common';
import { emitters } from './socket';

export const socketHandlers = {
  connect: () => (appState.connected = true),
  error: handleRequestError,
  success: handleRequestSuccess,
  supplement: handleSupplement,
  fixes: handleFixes,
  configs: handleConfigs,
  addPlugin: handleAddPlugin,
  openProject: handleOpenProject,
  hasProject: handleHasProject,
  projectRoot: (path: string) => (appState.projectRoot = path),
  newErrors: handleNewErrors,
  changedErrors: handleNewErrors,
  fixedErrors: handleFixedErrors,
  infoAtPosition,
};

export const resolvedErrors = errMap([], mergeSources);

export const appState = reactive({
  connected: false,
  currentMsgType: '',
  currentMsg: '',
  lastObject: {},
  socketStarted: false,
  error: '',
  plugins: {} as Record<PluginName, { active: boolean; displayName: string }>,
  requests: new Map<
    number,
    { resolve: (...args: any[]) => void; reject: (...args: any[]) => void }
  >(),
  supplements: {} as Record<number, string[]>,
  fixes: {} as Record<number, [fixId: number, fixDescription: string][]>,
  projects: {} as Record<ProjectPath, undefined | boolean>,
  configs: {} as ProjectConfigs,
  projectRoot: '',
  shikiTheme: 'dracula' as string,
});

export const positionInfo = reactive(
  {} as Record<
    PluginName,
    { filename: string; line: number; char: number; info: string[] }
  >,
);

function infoAtPosition(
  pluginName: string,
  filename: string,
  line: number,
  char: number,
  info: string[],
) {
  positionInfo[PluginName.for(pluginName)] = { filename, line, char, info };
}

function handleAddPlugin(key: string, active: boolean, displayName: string) {
  const pName = PluginName(key);
  appState.plugins[pName] = { active, displayName };
}

function handleRequestError(requestId: number, ...args: any[]) {
  const request = appState.requests.get(requestId);
  if (!request) {
    unknownRequest(requestId);
    return;
  }
  request.reject(...args);
  appState.requests.delete(requestId);
  appState.error = `${appState.error} - request ${requestId} failed`;
}

function handleRequestSuccess(requestId: number, ...args: any[]) {
  const request = appState.requests.get(requestId);
  if (!request) {
    unknownRequest(requestId);
    return;
  }
  request.resolve(...args);
  appState.requests.delete(requestId);
}

export const unknownRequest = (requestId: any) =>
  (appState.error = `request id not found ${requestId}`);

function handleNewErrors(entries: [FlatErrKey, FlatErrValue][]) {
  for (const entry of entries) {
    resolvedErrors.set(entry[0], entry[1]);
  }
}

function handleFixedErrors(keys: FlatErrKey[]) {
  for (const key of keys) {
    resolvedErrors.delete(key);
  }
}

function handleSupplement(id: number, supplement: string) {
  appState.supplements[id] ??= [];
  appState.supplements[id].push(supplement);
}

function handleFixes(
  fixes: Record<number, [fixId: number, fixDescription: string][]>,
) {
  for (const parseId in fixes) {
    appState.fixes[parseId] ??= [];
    appState.fixes[parseId].push(...fixes[parseId]);
  }
}

function handleConfigs(configs: ProjectConfigs) {
  appState.configs = configs;
}

function handleHasProject(path: string, isOpen?: boolean) {
  const relPath = relativeProjectPath(path);
  if (!(relPath in appState.projects)) {
    appState.projects[ProjectPath(relPath)] ??= false;
  }

  if (isOpen) {
    handleOpenProject(relPath);
  }
}

function handleOpenProject(path: string) {
  const relPath = relativeProjectPath(path);
  if (relPath in appState.projects) {
    appState.projects[relPath] = true;
  }
}

export function toggleProject(path: string) {
  const projectPath = ProjectPath.for(path);
  if (projectPath in appState.projects) {
    if (appState.projects[projectPath]) {
      appState.projects[projectPath] = false;
      emitters?.closeProject(projectPath);
    } else {
      appState.projects[projectPath] = true;
      emitters?.openProject(projectPath);
    }
  }
}

function relativeProjectPath(path: string) {
  return ProjectPath.for(
    (path.startsWith(appState.projectRoot)
      ? path.replace(appState.projectRoot, '')
      : path
    ).replace(/^\.?\/?/, ''),
  );
}
