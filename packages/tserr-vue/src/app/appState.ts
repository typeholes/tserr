import { reactive } from 'vue';
import { FlatErr, flatErr } from './resolvedError';
import {
  FileName,
  PluginName,
  ProjectPath,
  ProjectConfigs,
} from '@typeholes/tserr-common';
import { emitters } from './socket';

export const socketHandlers = {
  connect: () => (appState.connected = true),
  error: handleRequestError,
  success: handleRequestSuccess,
  diagnostics: handleDiagnostic,
  resolvedError: handleResolvedError,
  resetResolvedErrors: handleResetResolvedErrors,
  supplement: handleSupplement,
  fixes: handleFixes,
  configs: handleConfigs,
  addPlugin: handleAddPlugin,
  openProject: handleOpenProject,
  hasProject: handleHasProject,
  projectRoot: (path: string) => (appState.projectRoot = path),
};

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
  diagnostics: new Map<FileName, Diagnostic[]>(),
  resolvedErrors: {} as Record<FileName, Record<PluginName, FlatErr[]>>,
  supplements: {} as Record<number, string[]>,
  fixes: {} as Record<number, [fixId: number, fixDescription: string][]>,
  projects: {} as Record<ProjectPath, undefined | boolean>,
  configs: {} as ProjectConfigs,
  projectRoot: '',
});

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

function handleDiagnostic(fileName: FileName, diagnostics: Diagnostic[]) {
  appState.diagnostics.set(fileName, diagnostics);
}

function handleResolvedError(
  pluginKey: string,
  fileName: string,
  resolved: [unknown][]
) {
  const pName = PluginName.for(pluginKey);
  const fName = FileName.for(fileName);
  appState.resolvedErrors[fName] ??= {};
  appState.resolvedErrors[fName][pName] ??= [];

  for (const err of resolved) {
    if (flatErr.err.allows(err)) {
      appState.resolvedErrors[fName][pName].push(err);
    }
  }
}

function handleResetResolvedErrors(pluginKey: string, fileNames?: string[]) {
  const fileArr = fileNames ?? Object.keys(appState.resolvedErrors);
  for (const fileName of fileArr) {
    const filePath = FileName.for(fileName);
    if (!appState.resolvedErrors[filePath]) {
      continue;
    }
    appState.resolvedErrors[filePath][PluginName.for(pluginKey)] = [];
    if (
      Object.entries(appState.resolvedErrors[filePath]).every(
        (e) => e[1].length === 0
      )
    ) {
      delete appState.resolvedErrors[FileName.for(fileName)];
    }
  }
  appState.supplements = [];
  appState.fixes = {};
}

function handleSupplement(id: number, supplement: string) {
  appState.supplements[id] ??= [];
  appState.supplements[id].push(supplement);
}

function handleFixes(
  fixes: Record<number, [fixId: number, fixDescription: string][]>
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

// const ignoredCommands = [
//   'quickinfo',
//   'encodedSemanticClassifications-full',
//   'getApplicableRefactors',
//   'documentHighlights',
//   'updateOpen',
//   'provideInlayHints',
//   'getOutliningSpans'
// ]

// const ignoredEvents = [
//   'requestCompleted',
//   'suggestionDiag',
//   // 'semanticDiag'
//   'syntaxDiag'
// ]

function relativeProjectPath(path: string) {
  return ProjectPath.for(
    (path.startsWith(appState.projectRoot)
      ? path.replace(appState.projectRoot, '')
      : path
    ).replace(/^\.?\/?/, '')
  );
}
