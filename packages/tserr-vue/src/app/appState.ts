import { reactive } from 'vue'
// import {} from '@/socket'
import { deserialize } from './resolvedError'

export const socketHandlers = {
  connect: () => (appState.connected = true),
  error: handleRequestError,
  success: handleRequestSuccess,
  diagnostics: handleDiagnostic,
  resolvedError: handleResolvedError,
  resetResolvedErrors: handleResetResolvedErrors,
  supplement: handleSupplement
}

type FileName = string

export type Diagnostic = {
  message: string
  start: {
    line: number
    character: number
  }
  end: {
    line: number
    character: number
  }
}

export const appState = reactive({
  connected: false,
  currentMsgType: '',
  currentMsg: '',
  lastObject: {},
  socketStarted: false,
  error: '',
  requests: new Map<
    number,
    { resolve: (...args: any[]) => void; reject: (...args: any[]) => void }
  >(),
  diagnostics: new Map<FileName, Diagnostic[]>(),
  resolvedErrors: new Map<FileName, ReturnType<typeof deserialize>>(),
  supplements: {} as Record<number, string>
})

function handleRequestError(requestId: number, ...args: any[]) {
  const request = appState.requests.get(requestId)
  if (!request) {
    unknownRequest(requestId)
    return
  }
  request.reject(...args)
  appState.requests.delete(requestId)
  appState.error = `${appState.error} - request ${requestId} failed`
}

function handleRequestSuccess(requestId: number, ...args: any[]) {
  const request = appState.requests.get(requestId)
  if (!request) {
    unknownRequest(requestId)
    return
  }
  request.resolve(...args)
  appState.requests.delete(requestId)
}

export const unknownRequest = (requestId: any) =>
  (appState.error = `request id not found ${requestId}`)

function handleDiagnostic(fileName: FileName, diagnostics: Diagnostic[]) {
  appState.diagnostics.set(fileName, diagnostics)
}

function handleResolvedError(filename: FileName, resolved: [unknown][]) {
  appState.resolvedErrors.set(filename, deserialize(resolved))
}

function handleResetResolvedErrors() {
  appState.resolvedErrors = new Map();
  appState.supplements = [];
}

function handleSupplement(id: number, supplement: string) {
  appState.supplements[id] = supplement
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
