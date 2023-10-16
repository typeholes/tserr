import { plugin } from './lib/handleDiagnostics';

export { plugin } from './lib/handleDiagnostics';

import * as vscode from 'vscode';

export function activate() {
  vscode.window.showInformationMessage('activate ts-morph');
  return { tsErrPlugin: plugin };
}
