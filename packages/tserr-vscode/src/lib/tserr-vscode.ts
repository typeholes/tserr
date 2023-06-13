import { commands, ExtensionContext, window } from 'vscode';
import {
} from '@typeholes/tserr-server';

// On activation
export function activate(_context: ExtensionContext) {
  // Register command "start"
  commands.registerCommand('tserr-vscode-start', () => {
    window.showInformationMessage('Hello World');
  });
}
