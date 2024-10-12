import * as vscode from 'vscode';

export class WordCountViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'wordCountView';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this._getHtmlForWebview();

        // Update word count on text change
        vscode.window.onDidChangeActiveTextEditor(() => this._updateWordCount(webviewView));
        vscode.workspace.onDidChangeTextDocument(() => this._updateWordCount(webviewView));

        // Initial update
        this._updateWordCount(webviewView);
    }

    private _getHtmlForWebview(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <body>
                <div id="wordCount">Word Count: 0</div>
                <script>
                    const vscode = acquireVsCodeApi();
                    window.addEventListener('message', event => {
                        document.getElementById('wordCount').textContent = 'Word Count: ' + event.data.wordCount;
                    });
                </script>
            </body>
            </html>
        `;
    }

    private _updateWordCount(webviewView: vscode.WebviewView): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            webviewView.webview.postMessage({ wordCount: 0 });
            return;
        }
        const text = editor.document.getText();
        const wordCount = text.split(/\s+/).length;
        webviewView.webview.postMessage({ wordCount });
    }
}
