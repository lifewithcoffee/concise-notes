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
    
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.type === 'jumpToLine') {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const position = new vscode.Position(message.line, 0);
                    const range = new vscode.Range(position, position);
                    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
                    editor.selection = new vscode.Selection(position, position);
                }
            }
        });
    
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
  
    private getMarkdownOutline(text: string): { title: string, line: number, indent: number }[] {
        const lines = text.split('\n');
        const outline: { title: string, line: number, indent: number }[] = [];

        const regex = /^(#{1,6})\s+(.+)/;  // Matches Markdown headers (e.g., # Title, ## Subtitle)
        lines.forEach((line, index) => {
            const match = line.match(regex);
            if (match) {
                const level = match[1].length;
                const title = match[2];
                outline.push({ title, line: index, indent: level });
            }
        });

        return outline;
    }

    // RL: not tested
    private getRstOutline(text: string): { title: string, line: number, indent: number }[] {
        const lines = text.split('\n');
        const outline: { title: string, line: number, indent: number }[] = [];
    
        const regex = /^([=+-]+)$/;  // Matches reStructuredText header underline
        let title: string | null = null;
        let level: number | null = null;
        let underlineLevel: number | null = null;
    
        lines.forEach((line, index) => {
            const match = line.match(regex);
            if (match) {
                if (title !== null) {
                    // This is the underline for the previous title
                    if (underlineLevel !== null) {
                        outline.push({ title, line: index - 2, indent: underlineLevel });
                    }
                    title = null;
                    level = null;
                    underlineLevel = null;
                } else {
                    // This is the underline for the next title
                    level = match[1].length;
                }
            } else if (title === null && level !== null) {
                // This is the title
                title = line.trim();
            }
        });
    
        // If there's a title left over at the end, add it to the outline
        if (title !== null && level !== null) {
            outline.push({ title, line: lines.length - 1, indent: level });
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
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Markdown Outline</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                ul {
                    list-style-type: none;
                    padding-left: 0;
                    margin: 0;
                }
                li {
                    padding: 5px 10px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                li:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
            </style>
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
                        listItem.textContent = '#'.repeat(item.indent) + ' ' + item.title;
                        listItem.addEventListener('click', () => {
                            vscode.postMessage({ type: 'jumpToLine', line: item.line });
                        });
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
