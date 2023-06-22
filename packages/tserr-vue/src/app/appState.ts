import { reactive } from 'vue';
// import {} from '@/socket'
import { FlatErr, flatErr } from './resolvedError';
import { FileName, PluginName, ProjectPath } from '@typeholes/tserr-common';

export const socketHandlers = {
  connect: () => (appState.connected = true),
  error: handleRequestError,
  success: handleRequestSuccess,
  diagnostics: handleDiagnostic,
  resolvedError: handleResolvedError,
  resetResolvedErrors: handleResetResolvedErrors,
  supplement: handleSupplement,
  fixes: handleFixes,
  addPlugin: handleAddPlugin,
  openProject: handleOpenProject,
  hasProject: handleHasProject,
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

function handleResetResolvedErrors(pluginKey: string) {
  for (const fileName in appState.resolvedErrors) {
    appState.resolvedErrors[FileName.for(fileName)][PluginName.for(pluginKey)] =
      [];
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

function handleHasProject(path: string) {
  if (!(path in appState.projects)) {
    appState.projects[ProjectPath(path)] ??= false;
  }
}

function handleOpenProject(path: string) {
  if (path in appState.projects) {
    appState.projects[ProjectPath(path)] = true;
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
