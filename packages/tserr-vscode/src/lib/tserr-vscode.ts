import {
  commands,
  ExtensionContext,
  window,
  workspace,
  env,
  Uri,
} from 'vscode';
import * as vscode from 'vscode';

import { plugin as tsmorphPlugin } from '@typeholes/tserr-ts-morph';

import { startServer } from '@typeholes/tserr-server';
import { ProblemViewProvider } from './ProblemViewProvider';
import { ts } from 'ts-morph';

// let server: ReturnType<typeof startServer> | undefined = undefined;

// export function deactivate() {
//   console.log('tserr-vscode deactivate');
//   if (server) {
//     server.shutdownServer();
//   }
//   server = undefined;
// }

export function activate(context: ExtensionContext) {
  window.showInformationMessage('activating tserr');
  const server = startServer(__dirname + '../../../../tserr-vue/');
  const tserr = server.mkPluginInterface({
    key: 'vscode',
    displayName: 'vscode',
    register: () => {
      /**/
    },
  });

  server.mkPluginInterface(tsmorphPlugin);

  workspace.findFiles('**/tsconfig.json').then((uris) => {
    const shortest = uris
      .map((uri) => [uri, workspace.asRelativePath(uri).split('/')] as const)
      .sort((a, b) => a[1].length - b[1].length)[0][0];
    console.log({ shortest });
    tserr.send.openProject(shortest.fsPath.replace('tsconfig.json', ''));
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

  if (server.onGotoDefinition instanceof Function) {
    server.onGotoDefinition(handleGotoDefinition);
  } else {
    console.log('server.onGotoDefinition not a function', server);
    // eslint-disable-next-line no-debugger
    debugger;
  }


  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'typescript', pattern: '**/*.ts' },
      {
        provideHover(document, position) {
          // eslint-disable-next-line no-debugger
          const editor = window.activeTextEditor;
          const range = document.getWordRangeAtPosition(position);
          const message = document.getText(editor!.selection);

          const content = getHoverMarkDown();
          return { contents: [content] };
        },
      }
    )
  );
}

async function handleGotoDefinition(
  uriString: string,
  text: string,
  searchFromLine: number,
  searchToLine: number
) {
  const uri = vscode.Uri.parse(uriString);
  console.log('in vscode gotoDefinition');
  // eslint-disable-next-line no-debugger
  let editor = vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() === uri.toString()
  );
  if (!editor) {
    const document = vscode.workspace.textDocuments.find(
      (document) => document.uri.toString() === uri.toString()
    );
    if (document) {
      editor = await vscode.window.showTextDocument(document);
    } else {
      await vscode.commands.executeCommand('vscode.open', uri);
      const document = vscode.workspace.textDocuments.find(
        (document) => document.uri.toString() === uri.toString()
      );
      if (document) {
        editor = await vscode.window.showTextDocument(document);
      }
    }
  }
  if (editor) {
    const document = editor.document;
    for (let line = searchFromLine - 1; line < searchToLine; line++) {
      const lineText = document.lineAt(line).text;
      const re = new RegExp(`\\b(${text})\\b`, 'g');
      let match: ReturnType<typeof re.exec>;
      while ((match = re.exec(lineText))) {
        console.log('found', match, line, match.index);
        const position = new vscode.Position(line, match.index);
        vscode.commands
          .executeCommand(
            // 'vscode.executeTypeDefinitionProvider',
            'vscode.executeDefinitionProvider',
            document.uri,
            position
          )
          .then((result) => {
            if (Array.isArray(result) && result.length > 0) {
              vscode.commands.executeCommand(
                'editor.action.goToLocations',
                document.uri,
                position,
                result,
                'goto',
                'No Type Definition Found'
              );
            }
            console.log('result', result);
          });
      }
    }
  }
}


  function getHoverMarkDown() {
    const hoverInfo = [
      [
        { type: 'text', body: 'from', color: '#f00', backgroundColor: '#00f' },
        { type: 'text', body: 'to', color: '#f00', backgroundColor: '#00f' },
      ],
      [
        {
          type: 'code',
          body: '{a: 1}',
          color: '#f00',
          backgroundColor: '#00f',
        },
        {
          type: 'code',
          body: 'ZipTied',
          color: '#f00',
          backgroundColor: '#00f',
        },
      ],
    ];

    const md = new vscode.MarkdownString('\n');
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown('<table>');
    for (const row of hoverInfo) {
      md.appendMarkdown('<tr>');
      for (const col of row) {
        md.appendMarkdown('<td>');
        const color = col.color ? 'color=' + col.color + ';' : '';
        const backgroundColor = col.backgroundColor
          ? 'background-color=' + col.backgroundColor + ';'
          : '';
        if (col.type === 'text') {
          //prettier-ignore
          md.appendMarkdown( `<span style="${color}${backgroundColor}">${col.body}</span>`);
        } else if (col.type === 'code') {
          md.appendMarkdown(`<span style="${color}${backgroundColor}">`);
          md.appendText('\n');
          md.appendCodeblock(col.body, 'ts');
          md.appendText('\n');
          md.appendMarkdown(`</span>`);
        }
        md.appendMarkdown('</td>');
      }
      md.appendMarkdown('</tr>');
    }
    md.appendMarkdown('</table>');

    return md;
  }
