import {
  commands,
  ExtensionContext,
  window,
  workspace,
  env,
  Uri,
} from 'vscode';
import * as vscode from 'vscode';

import { ProblemViewProvider } from './ProblemViewProvider';

import { startServer, TserrPluginApi } from '@typeholes/tserr-server';
import { FlatErr, parseError } from '@typeholes/tserr-common';
import { join as joinPath } from 'path';

// let server: ReturnType<typeof startServer> | undefined = undefined;

// export function deactivate() {
//   console.log('tserr-vscode deactivate');
//   if (server) {
//     server.shutdownServer();
//   }
//   server = undefined;
// }

let errors: Record<string, FlatErr[]> = {};

let server: ReturnType<typeof startServer> = undefined as never;

export function activate(context: ExtensionContext) {
  console.log(vscode.extensions.all.map((e) => e.id));

  const extPath =
    vscode.extensions.getExtension('typeholes.tserr-vscode')?.extensionPath ??
    __dirname + '../../../tserr-vue/dist';

  const projectPath =
    (workspace.workspaceFolders ?? [])[0]?.uri?.fsPath ?? __dirname;
  window.showInformationMessage('activating tserr');
  server = startServer(extPath, projectPath);
  const tserr = server.mkPluginInterface({
    key: 'vscode',
    displayName: 'vscode',
    register: () => {
      /**/
    },
  });

  tserr.on.resetResolvedErrors(() => (errors = {}));

  tserr.on.resolvedErrors((fileName, resolvedErrors) => {
    errors[fileName] ??= [];
    errors[fileName].push(...resolvedErrors);
  });

  // const tsmorph = server.mkPluginInterface(tsmorphPlugin);

  const viewProvider = new ProblemViewProvider(
    context.extensionUri,
    server.getPort()
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ProblemViewProvider.viewType,
      viewProvider
    )
  );

  const configs = tserr.getConfigs();

  for (const path in configs) {
    const config = configs[path];
    config.config?.openProjects.forEach((projectFile) => {
      tserr.send.openProject(joinPath(projectPath, projectFile));
    });
    config.tsconfig?.forEach((fileName) => {
      tserr.send.hasProject(joinPath(path, fileName));
    });
  }

  commands.registerCommand('tserr-problems-view.openExternal', () => {
    env.openExternal(Uri.parse(`http://localhost:${server.getPort()}/`));
  });

  // context.subscriptions.push(disposable);

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
          const range = document.getWordRangeAtPosition(position);
          if (!range) {
            return { contents: [] };
          }
          // const message = document.getText(editor.selection);

          const content = getHoverMarkDown(document.uri, range);
          return { contents: [content] };
        },
      }
    )
  );

  registerDiagnosticChangeHandler(tserr);
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

type HoverInfo = {
  type: 'text' | 'code';
  body: string;
  color?: string | undefined;
  backgroundColor?: string | undefined;
}[][];

function getHoverMarkDown(uri: vscode.Uri, range: vscode.Range) {
  const fileName = uri.fsPath;
  const info: HoverInfo = [];
  for (const err of errors[fileName] ?? []) {
    //todo really should check position as well
    if (range.start.line >= err.line - 1 && range.end.line <= err.endLine - 1) {
      info.push(...getErrorHoverInfo(err), []);
    }
  }

  return hoverInfoToMarkdown(info);
}

function registerDiagnosticChangeHandler(plugin: TserrPluginApi) {
  let id = 0;
  vscode.languages.onDidChangeDiagnostics((event) => {
    event.uris.forEach((uri) => {
      plugin.send.resetResolvedErrors([uri.fsPath]);
      const diagnostics = vscode.languages.getDiagnostics(uri);
      diagnostics.forEach((diag) => {
        const err: FlatErr = {
          code: `${diag.code}`,
          start: diag.range.start.line,
          line: diag.range.start.line,
          endLine: diag.range.end.line,
          codes: [typeof diag.code === 'number' ? diag.code : 0],
          lines: [diag.message],
          parsed: diag.message
            .split('\n')
            .map((text, depth) => [id++, depth, parseError(text)]),
        };

        plugin.send.resolvedErrors(uri.fsPath, [err]);
      });
    });
  });
}

function getErrorHoverInfo(err: FlatErr): HoverInfo {
  const hoverInfo: HoverInfo = [];
  //   [
  //     { type: 'text', body: 'from', color: '#f00', backgroundColor: '#00f' },
  //     { type: 'text', body: 'to', color: '#f00', backgroundColor: '#00f' },
  //   ],
  //   [
  //     {
  //       type: 'code',
  //       body: '{a: 1}',
  //       color: '#f00',
  //       backgroundColor: '#00f',
  //     },
  //     {
  //       type: 'code',
  //       body: 'ZipTied',
  //       color: '#f00',
  //       backgroundColor: '#00f',
  //     },
  //   ],
  // ];

  err.parsed.forEach((p) => {
    const [_id, _depth, parsed] = p;
    if (parsed.type === 'unknownError') {
      const keys = parsed.parts.filter((_, idx) => idx % 2 === 0);
      // const values = parsed.parts.filter((_, idx) => idx % 2 === 1);
      const keyCells = keys.map((x) => ({ type: 'text', body: x } as const));
      const valueCells = keys.map((x) => ({ type: 'code', body: x } as const));
      hoverInfo.push(keyCells, valueCells);
    } else {
      const keys = [];
      const values = [];
      for (const key of ['type', 'key', 'from', 'to']) {
        if (key in parsed) {
          if (key === 'type') {
            keys.push(parsed[key as never]);
            values.push('');
          } else {
            keys.push(key);
            values.push(parsed[key as never]);
          }
        }
      }
      const keyCells = keys.map((x) => ({ type: 'text', body: x } as const));
      const valueCells = values.map(
        (x) => ({ type: 'code', body: x } as const)
      );
      hoverInfo.push(keyCells, valueCells);
    }
  });

  return hoverInfo;
}

function hoverInfoToMarkdown(hoverInfo: HoverInfo) {
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

export function deactivate() {
  server?.shutdownServer();
}
