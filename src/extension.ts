import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "concise-notes" is now active!');

	// _note: declared in package.json/contributes/commands
	const disposable = vscode.commands.registerCommand('concise-notes.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from concise notes!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
