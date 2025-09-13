"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDiagnostics = void 0;
const WriteIssues_1 = require("./WriteIssues");
const extension_1 = require("../extension");
function updateDiagnostics(document, response, context, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!document || !response) {
            extension_1.collection.clear();
            return;
        }
        extension_1.collection.clear();
        const diagnosticsArray = [];
        const displayOnlyBlockerIssues = (yield storageManager.getUserData('OnlyBlockerIssues')) || false;
        if (!shouldWriteIssues(response)) {
            return;
        }
        for (const issue of response.filter(issue => shouldIncludeIssue(issue, displayOnlyBlockerIssues))) {
            yield (0, WriteIssues_1.writeIssues)(document, issue, diagnosticsArray, storageManager);
        }
        extension_1.collection.set(document.uri, sortDiagnostics(diagnosticsArray));
    });
}
exports.updateDiagnostics = updateDiagnostics;
function shouldIncludeIssue(issue, displayOnlyBlockerIssues) {
    return (displayOnlyBlockerIssues && issue.qualityGateBreaker) || !displayOnlyBlockerIssues;
}
function sortDiagnostics(diagnostics) {
    return diagnostics.sort((a, b) => b.message.localeCompare(a.message));
}
function shouldWriteIssues(issues) {
    return issues.some(issue => issue.issueType && !issue.issueType.toString().trim().startsWith('0.-'));
}
