import * as vscode from 'vscode';

export async function registerCodeActionProvider(context: vscode.ExtensionContext, storageManager: any): Promise<void> {
    const provider = new CodeActionProvider(storageManager);

    // Register the code action provider with proper metadata for lightbulb functionality
    const disposable = vscode.languages.registerCodeActionsProvider(
        '*', // Apply to all languages
        provider,
        {
            providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds,
            // Add documentation for better lightbulb integration
            documentation: [
                {
                    command: {
                        command: 'quick-clouds.writeoff',
                        title: 'Request write-off for Quick Clouds issues'
                    },
                    kind: vscode.CodeActionKind.QuickFix
                }
            ]
        }
    );

    context.subscriptions.push(disposable);
    provider.disposables.push(disposable);
}

class CodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public disposables: vscode.Disposable[] = [];
    private _storageManager: any;

    constructor(storageManager: any) {
        this._storageManager = storageManager;
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        try {
            const hasQCCopilot = (await this._storageManager.getUserData('hasQCCopilot')) || false;

            for (const diagnostic of context.diagnostics) {
                // Show actions only for Quick Clouds diagnostics
                const isQC = this.isQuickCloudsDiagnostic(diagnostic);

                if (!isQC) continue;

                // Create write-off action with proper QuickFix kind for lightbulb
                const writeOffAction = new vscode.CodeAction(
                    'Request write-off',
                    vscode.CodeActionKind.QuickFix
                );
                writeOffAction.command = {
                    command: 'quick-clouds.writeoff',
                    title: 'Request write-off',
                    arguments: [document, diagnostic]
                };
                // Mark as preferred for better lightbulb visibility
                writeOffAction.isPreferred = true;
                // Add diagnostics to help with lightbulb context
                writeOffAction.diagnostics = [diagnostic];

                actions.push(writeOffAction);

                // Add QC Copilot action if available
                if (hasQCCopilot) {
                    const copilotAction = new vscode.CodeAction(
                        'Get QC Copilot Suggestion',
                        vscode.CodeActionKind.QuickFix
                    );
                    copilotAction.command = {
                        command: 'quick-clouds.getAISuggestion',
                        title: 'Get QC Copilot Suggestion',
                        arguments: [document, diagnostic]
                    };
                    copilotAction.diagnostics = [diagnostic];

                    actions.push(copilotAction);
                }
            }
        } catch (error) {
            console.error('Error in provideCodeActions:', error);
        }

        return actions;
    }

    private isQuickCloudsDiagnostic(diagnostic: vscode.Diagnostic): boolean {
        const code = diagnostic.code;
        if (!code) return false;

        // When created by WriteIssues, code is an object with a stable `value`
        if (typeof code === 'object' && 'value' in code) {
            try {
                // @ts-ignore - VSCode typing allows string | number | { value, target }
                return String(code.value) === 'QualityClouds documentation';
            } catch (_) {
                return false;
            }
        }

        return false;
    }

    dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
