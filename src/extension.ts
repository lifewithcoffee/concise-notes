import * as vscode from 'vscode';
import { WordCountViewProvider } from './wordCountView';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "wordcount" is now active!');

    let disposable = vscode.commands.registerCommand('extension.showWordCount', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const text = editor.document.getText();
            const wordCount = text.split(/\s+/).length;
            vscode.window.showInformationMessage(`Word Count: ${wordCount}`);
        }
    });

    context.subscriptions.push(disposable);

    // Create a status bar item
    const wordCountStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(wordCountStatusBarItem);

		// In the activate function, add:
		context.subscriptions.push(
				vscode.window.registerWebviewViewProvider(
						WordCountViewProvider.viewType,
						new WordCountViewProvider(context.extensionUri)
				)
		);

    vscode.window.onDidChangeActiveTextEditor(updateWordCount);
    vscode.workspace.onDidChangeTextDocument(updateWordCount);

    function updateWordCount() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            wordCountStatusBarItem.hide();
            return;
        }
        const text = editor.document.getText();
        const wordCount = text.split(/\s+/).length;
        wordCountStatusBarItem.text = `Word Count: ${wordCount}`;
        wordCountStatusBarItem.show();
    }

    // Initial update
    updateWordCount();
}

export function deactivate() {}
