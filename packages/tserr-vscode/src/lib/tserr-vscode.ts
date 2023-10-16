import { commands, ExtensionContext, workspace, env, Uri } from 'vscode';
import * as vscode from 'vscode';

import { ProblemViewProvider } from './ProblemViewProvider';

import { startServer, TserrPluginApi } from '@typeholes/tserr-server';
import { FlatErr, parseError, PluginName } from '@typeholes/tserr-common';
import { join as joinPath } from 'path';
import { useVscodeDiagnostics } from '../config';

let errors: Record<string, FlatErr[]> = {};

let server: ReturnType<typeof startServer> = undefined as never;

let TserrExtensionId: string | undefined;

export function activate(context: ExtensionContext) {
  TserrExtensionId = context.extension.id;

  const extPath =
    (vscode.extensions.getExtension('typeholes.tserr-vscode')?.extensionPath ??
      __dirname + '../../../tserr-vue') + '/dist';

  const projectPath =
    (workspace.workspaceFolders ?? [])[0]?.uri?.fsPath ?? __dirname;
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
    server.getPort(),
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ProblemViewProvider.viewType,
      viewProvider,
    ),
  );

  const configs = tserr.getConfigs();

  commands.registerCommand('tserr-problems-view.openExternal', () => {
    env.openExternal(Uri.parse(`http://localhost:${server.getPort()}/`));
  });

  commands.registerCommand('tserr-problems-view.loadPlugins', () => {
    activatePlugins();
  });

  // context.subscriptions.push(disposable);

  if (server.onGotoDefinition instanceof Function) {
    server.onGotoDefinition(handleGotoDefinition);
  } else {
    console.log('server.onGotoDefinition not a function', server);
    // eslint-disable-next-line no-debugger
    debugger;
  }

  if (server.onGotoFileLine instanceof Function) {
    server.onGotoFileLine(handleGotoFileLine);
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
      },
    ),
  );

  registerDiagnosticChangeHandler(tserr);

  activatePlugins();

  for (const path in configs) {
    const config = configs[path];
    config.config?.openProjects.forEach((projectFile) => {
      tserr.send.openProject(joinPath(projectPath, projectFile));
    });
    config.tsconfig?.forEach((fileName) => {
      tserr.send.hasProject(joinPath(path, fileName));
    });
  }
}

async function handleGotoFileLine(uriString: string, line: number) {
  const editor = await openEditor(uriString);
  if (editor) {
    const position = new vscode.Position(line - 1, 1);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.AtTop,
    );
  }
}

async function handleGotoDefinition(
  uriString: string,
  text: string,
  searchFromLine: number,
  searchToLine: number,
) {
  console.log('in vscode gotoDefinition');
  // eslint-disable-next-line no-debugger
  const editor = await openEditor(uriString);
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
            position,
          )
          .then((result) => {
            if (Array.isArray(result) && result.length > 0) {
              vscode.commands.executeCommand(
                'editor.action.goToLocations',
                document.uri,
                position,
                result,
                'goto',
                'No Type Definition Found',
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

async function openEditor(uriString: string) {
  const uri = vscode.Uri.parse(uriString);
  let editor = vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() === uri.toString(),
  );
  if (!editor) {
    const document = vscode.workspace.textDocuments.find(
      (document) => document.uri.toString() === uri.toString(),
    );
    if (document) {
      editor = await vscode.window.showTextDocument(document);
    } else {
      await vscode.commands.executeCommand('vscode.open', uri);
      const document = vscode.workspace.textDocuments.find(
        (document) => document.uri.toString() === uri.toString(),
      );
      if (document) {
        editor = await vscode.window.showTextDocument(document);
      }
    }
  }
  return editor;
}

function getHoverMarkDown(uri: vscode.Uri, range: vscode.Range) {
  const fileName = uri.fsPath;
  const info: HoverInfo = [];
  for (const err of errors[fileName] ?? []) {
    //todo really should check position as well
    for (const _plugin in err.sources) {
      const plugin = PluginName.for(_plugin);
      for (const detail of err.sources[plugin][fileName]) {
        const detailRange = new vscode.Range(
          detail.span.start.line - 1,
          detail.span.start.char - 1,
          detail.span.end.line - 1,
          detail.span.end.char - 1,
        );
        if (detailRange.contains(range)) {
          info.push(...getErrorHoverInfo(err), []);
        }
      }
    }
  }

  return hoverInfoToMarkdown(info);
}

let disposeDiagnosticsChangeHandler: vscode.Disposable | undefined;

function registerDiagnosticChangeHandler(plugin: TserrPluginApi) {
  disposeDiagnosticsChangeHandler?.dispose();
  if (!useVscodeDiagnostics) return;

  disposeDiagnosticsChangeHandler = vscode.languages.onDidChangeDiagnostics(
    (event) => {
      event.uris.forEach((uri) => {
        const fileName = uri.fsPath;
        const diagnostics = vscode.languages.getDiagnostics(uri);
        const errs: FlatErr[] = [];
        diagnostics.forEach((diag) => {
          const err: FlatErr = {
            sources: {
              [plugin.pluginName]: {
                [uri.fsPath]: [
                  {
                    code: `${diag.code}`,
                    raw: [diag.message],
                    span: {
                      start: {
                        line: diag.range.start.line + 1,
                        char: diag.range.start.character + 1,
                      },
                      end: {
                        line: diag.range.end.line + 1,
                        char: diag.range.end.character + 1,
                      },
                    },
                  },
                ],
              },
            },
            parsed: diag.message
              .split('\n')
              .map((text, depth) => ({ depth, value: parseError(text) })),
          };
          errors[fileName] ??= [];
          errors[fileName].push(err);
          errs.push(err);
        });
        plugin.send.resolvedErrors(uri.fsPath, errs);
      });
    },
  );
}

function getErrorHoverInfo(err: FlatErr): HoverInfo {
  const hoverInfo: HoverInfo = [];

  err.parsed.forEach((p) => {
    const { value } = p;
    if (value.type === 'unknownError') {
      const keys = value.parts.filter((_, idx) => idx % 2 === 0);
      // const values = parsed.parts.filter((_, idx) => idx % 2 === 1);
      const keyCells = keys.map((x) => ({ type: 'text', body: x }) as const);
      const values = value.parts.filter((_, idx) => idx % 2 === 1);
      const valueCells = values.map(
        (x) => ({ type: 'code', body: x }) as const,
      );
      hoverInfo.push(keyCells, valueCells);
    } else {
      const keys = [];
      const values = [];
      for (const key of ['type', 'key', 'from', 'to']) {
        if (key in value) {
          if (key === 'type') {
            keys.push(value[key as never]);
            values.push('');
          } else {
            keys.push(key);
            values.push(value[key as never]);
          }
        }
      }
      const keyCells = keys.map((x) => ({ type: 'text', body: x }) as const);
      const valueCells = values.map(
        (x) => ({ type: 'code', body: x }) as const,
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

const plugins: string[] = [];

export function deactivate() {
  server?.shutdownServer();
}
async function activatePlugins() {
  if (!server) return;
  vscode.extensions.all.forEach(async (ext) => {
    if (
      !(
        'extensionDependencies' in ext.packageJSON &&
        Array.isArray(ext.packageJSON.extensionDependencies)
      )
    ) {
      return;
    }

    if (!ext.packageJSON.extensionDependencies.includes(TserrExtensionId)) {
      return;
    }

    if (!ext.isActive) {
      await ext.activate();
    }

    if (('tserrPlugin' in ext.exports, 'tsErrPlugin')) {
      const plugin = ext.exports.tsErrPlugin;
      if ('key' in plugin && !plugins.includes(plugin.key)) {
        await server.loadPlugin(plugin);
      }
    }
  });
}

vscode.extensions.onDidChange(activatePlugins);
