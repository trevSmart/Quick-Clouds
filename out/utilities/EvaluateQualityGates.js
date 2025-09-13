"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function evaluateQualityGates(qualityGates) {
    var vscode = require("vscode");
    if (qualityGates.length === 1) {
        if (qualityGates[0].passed) {
            vscode.window.showInformationMessage('Quality Gates passed');
            return true;
        }
        else {
            vscode.window.showInformationMessage('Quality Gates failed: ' + qualityGates[0].message);
            return true;
        }
    }
    else {
        return false;
    }
}
exports.default = evaluateQualityGates;
//# sourceMappingURL=EvaluateQualityGates.js.map