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
exports.writeIssues = void 0;
const vscode = require("vscode");
const WRITE_OFF_APPROVED = 'APPROVED';
const WRITE_OFF_REJECTED = 'REJECTED';
function writeIssues(document, element, diagnosticsArray, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const qualityGatesActive = yield storageManager.getUserData('qualityGatesActive');
        const line = Math.max(0, Number(element.lineNumber) - 1);
        const issueType = formatIssueType(element);
        const severity = determineSeverity(element, qualityGatesActive);
        if (element.writeOff && element.writeOff.writeOffStatus === WRITE_OFF_APPROVED) {
            return;
        }
        const diagnostic = createDiagnostic(document, line, issueType, severity, element);
        if (element.writeOff) {
            const related = createRelatedInformation(document, line, element);
            if (related.length > 0) {
                diagnostic.relatedInformation = related;
            }
        }
        diagnosticsArray.push(diagnostic);
    });
}
exports.writeIssues = writeIssues;
function formatIssueType(element) {
    var _a;
    const tags = ((_a = element.tags) === null || _a === void 0 ? void 0 : _a.map(tag => tag.name).join(', ')) || '';
    return tags ? `${tags} - ${element.issueType}` : element.issueType;
}
function determineSeverity(element, qualityGatesActive) {
    if (qualityGatesActive && element.qualityGateBreaker) {
        return vscode.DiagnosticSeverity.Error;
    }
    if (!qualityGatesActive && element.aboveRadar) {
        return vscode.DiagnosticSeverity.Error;
    }
    // Make this check consistent with the one in writeIssues
    if (element.issueType && element.issueType.toString().trim().startsWith('0.-')) {
        return vscode.DiagnosticSeverity.Information;
    }
    return vscode.DiagnosticSeverity.Warning;
}
function createDiagnostic(document, line, issueType, severity, element) {
    const diagnostic = new vscode.Diagnostic(new vscode.Range(line, 0, line, 100), issueType, severity);
    diagnostic.source = `Severity - ${element.severity} Quality Gate - ${element.qualityGateTag || 'N/A'}`;
    diagnostic.code = { value: 'QualityClouds documentation', target: vscode.Uri.parse(element.documentationURL) };
    return diagnostic;
}
function createRelatedInformation(document, line, element) {
    const writeOff = element.writeOff;
    if (!writeOff) {
        return [];
    }
    if (writeOff.writeOffStatus === WRITE_OFF_APPROVED && !writeOff.expirationDate) {
        return [];
    }
    if (writeOff.writeOffStatus === WRITE_OFF_APPROVED && writeOff.expirationDate) {
        const date = new Date(writeOff.expirationDate);
        return [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(line, 0, line, 0)), `Write off status is ${writeOff.writeOffStatus} by ${writeOff.validator} until ${date.toDateString()} with the reason ${writeOff.validationReason}`)
        ];
    }
    if (writeOff.writeOffStatus === WRITE_OFF_REJECTED) {
        return [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(line, 0, line, 0)), `Write off status is ${writeOff.writeOffStatus} by ${writeOff.validator} with the reason ${writeOff.validationReason}`)
        ];
    }
    return [
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(line, 0, line, 0)), `Write off status is ${writeOff.writeOffStatus} with the reason ${writeOff.requestReason} requested by ${writeOff.requester} on ${writeOff.requestedDate} with description ${writeOff.requestDescription}`)
    ];
}
//# sourceMappingURL=WriteIssues.js.map