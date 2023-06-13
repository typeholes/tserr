import {
  commands,
  ExtensionContext,
  window,
  workspace,
  env,
  Uri,
} from 'vscode';
import * as vscode from 'vscode';

import { startServer } from '@typeholes/tserr-server';
import { ProblemViewProvider } from './ProblemViewProvider';

// On activation
export function activate(context: ExtensionContext) {
  window.showInformationMessage('activating tserr');
  const server = startServer(__dirname + '../../../../tserr-vue/');
  server.loadPlugin(__dirname + '/../../../tserr-ts-morph/src/index.js');
  workspace.findFiles('**/tsconfig.json').then((uris) => {
    const shortest = uris
      .map((uri) => [uri, workspace.asRelativePath(uri).split('/')] as const)
      .sort((a, b) => a[1].length - b[1].length)[0][0];
    console.log({ shortest });
    server.openProject(shortest.fsPath.replace('tsconfig.json',''));
  });

  commands.registerCommand('tserr-problems-view.openExternal', () => {
    env.openExternal(Uri.parse('http://localhost:3000/'));
  });

  // context.subscriptions.push(disposable);

  const viewProvider = new ProblemViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ProblemViewProvider.viewType,
      viewProvider
    )
  );
}
