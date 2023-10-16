/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

const BaseKey = '"TsErr';
const VsCodeDiagnosticsKey = `${BaseKey}.useVscodeDiagnostics`;
export let useVscodeDiagnostics = true;

vscode.workspace.onDidChangeConfiguration(onChange);

function onChange(event: vscode.ConfigurationChangeEvent) {
  if (event.affectsConfiguration(VsCodeDiagnosticsKey)) {
    getUseVscodeDiagnostics();
  }
}

function getUseVscodeDiagnostics() {
  useVscodeDiagnostics =
    vscode.workspace.getConfiguration().TsErr.useVscodeDiagnostics ?? true;
}

getUseVscodeDiagnostics();
