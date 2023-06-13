import { reactive } from 'vue';
// import {} from '@/socket'
import { deserialize } from './resolvedError';

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
};

type FileName = string;

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
  plugins: {} as Record<string, { active: boolean; displayName: string }>,
  requests: new Map<
    number,
    { resolve: (...args: any[]) => void; reject: (...args: any[]) => void }
  >(),
  diagnostics: new Map<FileName, Diagnostic[]>(),
  resolvedErrors: {} as Record<string, Map<FileName, ReturnType<typeof deserialize>>>,
  supplements: {} as Record<number, string[]>,
  fixes: {} as Record<number, [fixId: number, fixDescription: string][]>,
});

function handleAddPlugin(key: string, active: boolean, displayName: string) {
  appState.plugins[key] = { active, displayName };
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

function handleResolvedError(pluginKey: string, filename: FileName, resolved: [unknown][]) {
  appState.resolvedErrors[pluginKey].set(filename, deserialize(resolved));
}

function handleResetResolvedErrors(pluginKey: string) {
  appState.resolvedErrors[pluginKey] = new Map();
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
