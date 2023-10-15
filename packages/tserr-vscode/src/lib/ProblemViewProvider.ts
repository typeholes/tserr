import * as vscode from 'vscode';

export class ProblemViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'TsErr.problems';

  private readonly _disposables: vscode.Disposable[] = [];

  private _view?: vscode.WebviewView;
  private _serverPort: number;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    serverPort: number,
  ) {
    this._serverPort = serverPort;
    vscode.workspace.onDidChangeConfiguration(
      () => {
        this.updateConfiguration();
      },
      null,
      this._disposables,
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
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.onDidChangeVisibility(() => {
      if (this._view?.visible) {
      }
    });

    webviewView.onDidDispose(() => {
      this._view = undefined;
    });

    webviewView.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
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

  private updateConfiguration() {}
}
