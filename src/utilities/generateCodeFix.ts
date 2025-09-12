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
exports.generateCodeFix = void 0;
const vscode = require("vscode");
const AIReService_1 = require("../services/AIReService");
function generateCodeFix(document, diagnostic, storageManager, applyChangesButton, discardChangesButton, buttonLC, newWO, myIssues, env, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const lastScanHistoryId = yield storageManager.getLastScanHistoryId();
        const writeOffData = yield storageManager.getWriteOffData(lastScanHistoryId);
        const userID = (writeOffData === null || writeOffData === void 0 ? void 0 : writeOffData.developer) || 'defaultUserId';
        const code = document.getText();
        const issueType = diagnostic.message;
        const lineNumber = diagnostic.range.start.line + 1;
        const storedRuleID = yield storageManager.getRuleIdByName(issueType);
        const result = yield vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Requesting QC Copilot suggestion...",
            cancellable: false,
        }, () => __awaiter(this, void 0, void 0, function* () {
            return yield AIReService_1.AIReService.getSuggestion(userID, code, issueType, diagnostic.message, lineNumber, storedRuleID, env, storageManager, context);
        }));
        if (result && !(result instanceof Error)) {
            const assistantMessage = result.messages.find((msg) => msg.role === 'ASSISTANT');
            if (assistantMessage && assistantMessage.data) {
                const fixedCode = assistantMessage.data.fixed_code || 'No fixed code provided';
                const originalUri = document.uri;
                const fixedUri = vscode.Uri.parse('untitled:FixedCode');
                yield showDiffEditor(originalUri, fixedUri, fixedCode);
                applyChangesButton.show();
                discardChangesButton.show();
                newWO.hide();
                myIssues.hide();
                buttonLC.hide();
                vscode.window.showInformationMessage(`Recommendation powered by Azure OpenAI ChatGPT.
                 AI-generated code may be wrong.
                 Ensure that you understand and test the recommended fix before applying it.`);
                const applyCommand = vscode.commands.registerCommand('qc2.applyChanges', () => __awaiter(this, void 0, void 0, function* () {
                    yield applyChangesToOriginal(document, fixedUri);
                    yield discardAndClose(fixedUri);
                    applyChangesButton.hide();
                    discardChangesButton.hide();
                    myIssues.show();
                    buttonLC.show();
                    yield promptForRating(result.conversationId, env, storageManager, context);
                    applyCommand.dispose();
                    discardCommand.dispose();
                }));
                const discardCommand = vscode.commands.registerCommand('qc2.discardChanges', () => __awaiter(this, void 0, void 0, function* () {
                    yield discardAndClose(fixedUri);
                    applyChangesButton.hide();
                    discardChangesButton.hide();
                    myIssues.show();
                    buttonLC.show();
                    yield promptForRating(result.conversationId, env, storageManager, context);
                    applyCommand.dispose();
                    discardCommand.dispose();
                }));
            }
            else {
                vscode.window.showWarningMessage('No valid suggestion found in the response.');
            }
        }
        else if (result instanceof Error) {
            vscode.window.showErrorMessage(`Error fetching suggestion: ${result.message}`);
        }
        else {
            vscode.window.showWarningMessage('No suggestion found.');
        }
    });
}
exports.generateCodeFix = generateCodeFix;
function showDiffEditor(originalUri, fixedUri, fixedCode) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.workspace.openTextDocument(fixedUri);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(fixedUri, new vscode.Position(0, 0), fixedCode);
        yield vscode.workspace.applyEdit(edit);
        yield vscode.commands.executeCommand('vscode.diff', originalUri, fixedUri, 'QC Copilot Recommended Fix');
    });
}
function applyChangesToOriginal(document, fixedUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const fixedDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === fixedUri.toString());
        if (fixedDoc) {
            const fixedCode = fixedDoc.getText();
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
            edit.replace(document.uri, fullRange, fixedCode);
            yield vscode.workspace.applyEdit(edit);
            yield document.save();
        }
    });
}
function discardAndClose(fixedUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const fixedDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === fixedUri.toString());
        if (fixedDoc) {
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === fixedUri.toString());
            if (editor) {
                yield vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
            }
        }
    });
}
function promptForRating(conversationId, env, storageManager, context) {
    return __awaiter(this, void 0, void 0, function* () {
        vscode.window.showInformationMessage("Please rate this suggestion.", "★", "★★", "★★★", "★★★★", "★★★★★").then((selection) => __awaiter(this, void 0, void 0, function* () {
            if (selection) {
                yield AIReService_1.AIReService.rateSuggestion(conversationId, selection.length, env, storageManager, context);
                vscode.window.showInformationMessage(`Thank you for rating: ${selection.length} stars.`);
            }
        }));
    });
}
//# sourceMappingURL=generateCodeFix.js.map