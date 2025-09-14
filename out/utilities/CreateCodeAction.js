"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCodeActionProvider = registerCodeActionProvider;
const vscode = __importStar(require("vscode"));
async function registerCodeActionProvider(context, storageManager) {
    const provider = new CodeActionProvider(storageManager);
    // Register the code action provider with proper metadata for lightbulb functionality
    const disposable = vscode.languages.registerCodeActionsProvider('*', // Apply to all languages
    provider, {
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
    });
    context.subscriptions.push(disposable);
    provider.disposables.push(disposable);
}
class CodeActionProvider {
    constructor(storageManager) {
        this.disposables = [];
        this._storageManager = storageManager;
    }
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        try {
            const hasQCCopilot = (await this._storageManager.getUserData('hasQCCopilot')) || false;
            for (const diagnostic of context.diagnostics) {
                // Show actions only for Quick Clouds diagnostics
                const isQC = this.isQuickCloudsDiagnostic(diagnostic);
                if (!isQC) {
                    continue;
                }
                // Create write-off action with proper QuickFix kind for lightbulb
                const writeOffAction = new vscode.CodeAction('Request write-off', vscode.CodeActionKind.QuickFix);
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
                    const copilotAction = new vscode.CodeAction('Get QC Copilot Suggestion', vscode.CodeActionKind.QuickFix);
                    copilotAction.command = {
                        command: 'quick-clouds.getAISuggestion',
                        title: 'Get QC Copilot Suggestion',
                        arguments: [document, diagnostic]
                    };
                    copilotAction.diagnostics = [diagnostic];
                    actions.push(copilotAction);
                }
            }
        }
        catch (error) {
            console.error('Error in provideCodeActions:', error);
        }
        return actions;
    }
    isQuickCloudsDiagnostic(diagnostic) {
        const code = diagnostic.code;
        if (!code) {
            return false;
        }
        // When created by WriteIssues, code is an object with a stable `value`
        if (typeof code === 'object' && 'value' in code) {
            try {
                // @ts-ignore - VSCode typing allows string | number | { value, target }
                return String(code.value) === 'QualityClouds documentation';
            }
            catch (_) {
                return false;
            }
        }
        return false;
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
CodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
];
//# sourceMappingURL=CreateCodeAction.js.map