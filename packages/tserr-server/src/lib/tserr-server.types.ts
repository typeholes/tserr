import { FlatErr } from '@typeholes/tserr-common';
import { ProjectEvent } from './project';

export type TserrPluginApi = {
  // sendDiagnostic: (fileName: string, diagnostics: Diagnostic[]) => void;
  // onGotoDefinition: (callback: (fileName: string, text: string, diagnostic: Diagnostic) => void) => void;
  sendResolvedError: (fileName: string, resolvedError: FlatErr[]) => void;
  sendResetResolvedErrors: () => void;
  sendSupplement: (id: number, supplement: string) => void;
  sendFixes: (
    fixesRec: Record<
      number,
      [fixId: number, fixDescription: string, fn: () => void][]
    >
  ) => void;
  // addSemanticErrorIdentifiers: (...identifiers: typeof semanticErrorIdentifiers) => void;
  getProjectPath: () => string | undefined;
  addProjectEventHandlers: (
    ...handlers: ((projectEvents: ProjectEvent[]) => void)[]
  ) => void;
  onOpenProject: (on: (projectPath: string) => void) => void;
};

export type TserrPlugin = {
  key: string;
  register: (api: TserrPluginApi) => void;
  displayName: string;
};

export type ProjectEventHandlers = ((projectEvents: ProjectEvent[]) => void)[];
