import * as vscode from 'vscode';

export class ProblemViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'TsErr.problems';

  private readonly _disposables: vscode.Disposable[] = [];

  private _view?: vscode.WebviewView;
  private _currentCacheKey: CacheKey = cacheKeyNone;
  private _loading?: { cts: vscode.CancellationTokenSource };
  private _serverPort: number;

  constructor(private readonly _extensionUri: vscode.Uri, serverPort: number) {
    this._serverPort = serverPort
    vscode.workspace.onDidChangeConfiguration(
      () => {
        this.updateConfiguration();
      },
      null,
      this._disposables
    );

    this.updateConfiguration();
  }

  dispose() {
    let item: vscode.Disposable | undefined;
    while ((item = this._disposables.pop())) {
      item.dispose();
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.onDidChangeVisibility(() => {
      if (this._view?.visible) {
        // this.update(/* force */ true);
      }
    });

    webviewView.onDidDispose(() => {
      this._view = undefined;
    });

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
                </head>

                <body>
     <iframe src="http://localhost:${this._serverPort}/" style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;">></iframe>
			</body>
			</html>`;
  }

  private updateConfiguration() {
    //   const config = vscode.workspace.getConfiguration('docsView');
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

type CacheKey = typeof cacheKeyNone | DocumentCacheKey;

const cacheKeyNone = { type: 'none' } as const;

class DocumentCacheKey {
  readonly type = 'document';

  constructor(
    public readonly url: vscode.Uri,
    public readonly version: number,
    public readonly wordRange: vscode.Range | undefined
  ) {}

  public equals(other: DocumentCacheKey): boolean {
    if (this.url.toString() !== other.url.toString()) {
      return false;
    }

    if (this.version !== other.version) {
      return false;
    }

    if (other.wordRange === this.wordRange) {
      return true;
    }

    if (!other.wordRange || !this.wordRange) {
      return false;
    }

    return this.wordRange.isEqual(other.wordRange);
  }
}

function cacheKeyEquals(a: CacheKey, b: CacheKey): boolean {
  if (a === b) {
    return true;
  }

  if (a.type !== b.type) {
    return false;
  }

  if (a.type === 'none' || b.type === 'none') {
    return false;
  }

  return a.equals(b);
}

function createCacheKey(editor: vscode.TextEditor | undefined): CacheKey {
  if (!editor) {
    return cacheKeyNone;
  }

  return new DocumentCacheKey(
    editor.document.uri,
    editor.document.version,
    editor.document.getWordRangeAtPosition(editor.selection.active)
  );
}
