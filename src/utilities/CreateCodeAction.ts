"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCodeActionProvider = void 0;
const vscode = require("vscode");
function registerCodeActionProvider(context, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new CodeActionProvider(storageManager);
        const disposable = vscode.languages.registerCodeActionsProvider('*', provider, {
            providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds
        });
        context.subscriptions.push(disposable);
        provider.disposables.push(disposable);
    });
}
exports.registerCodeActionProvider = registerCodeActionProvider;
class CodeActionProvider {
    constructor(storageManager) {
        this.disposables = [];
        this._storageManager = storageManager;
    }
    provideCodeActions(document, range, context, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const actions = [];
            const hasQCCopilot = (yield this._storageManager.getUserData('hasQCCopilot')) || false;
            for (const diagnostic of context.diagnostics) {
                const writeOffAction = new vscode.CodeAction(`Request write-off`, vscode.CodeActionKind.QuickFix);
                writeOffAction.command = {
                    command: 'quick-clouds.writeoff',
                    title: 'Request write-off',
                    arguments: [document, diagnostic]
                };
                actions.push(writeOffAction);
                if (hasQCCopilot) {
                    const action = new vscode.CodeAction(`Get QC Copilot Suggestion`, vscode.CodeActionKind.QuickFix);
                    action.command = {
                        command: 'quick-clouds.getAISuggestion',
                        title: 'Get QC Copilot Suggestion',
                        arguments: [document, diagnostic]
                    };
                    actions.push(action);
                }
            }
            return actions;
        });
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
CodeActionProvider.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
//# sourceMappingURL=CreateCodeAction.js.map