import * as vscode from 'vscode';

export class MarkdownOutlineProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'markdownOutline';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        vscode.window.onDidChangeActiveTextEditor(() => {
            this.update();
        });

        this.update();
    }

    private update() {
        const editor = vscode.window.activeTextEditor;

        if (editor && editor.document.languageId === 'markdown') {
            const outline = this.getMarkdownOutline(editor.document.getText());
            this._view?.webview.postMessage({ type: 'update', body: outline });
        }
    }

    private getMarkdownOutline(text: string): string[] {
        const lines = text.split('\n');
        const outline: string[] = [];

        const regex = /^(#{1,6})\s+(.+)/;  // Matches Markdown headers (e.g., # Title, ## Subtitle)
        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const level = match[1].length;
                const title = match[2];
                outline.push(`${' '.repeat(level - 1)}- ${title}`);
            }
        }

        return outline;
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = this.getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Markdown Outline</title>
            </head>
            <body>
                <ul id="outline"></ul>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();

                    window.addEventListener('message', event => {
                        const outline = event.data.body;
                        const outlineList = document.getElementById('outline');
                        outlineList.innerHTML = '';

                        outline.forEach(item => {
                            const listItem = document.createElement('li');
                            listItem.textContent = item;
                            outlineList.appendChild(listItem);
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
