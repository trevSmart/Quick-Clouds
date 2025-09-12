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
exports.updateQualityCenterVisibility = exports.getQualityCenterButtonInstance = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
let qualityCenterButtonInstance = null;
function getQualityCenterButtonInstance() {
    if (!qualityCenterButtonInstance) {
        qualityCenterButtonInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        qualityCenterButtonInstance.text = 'Quality Center';
        qualityCenterButtonInstance.command = 'qc2.myIssues';
    }
    return qualityCenterButtonInstance;
}
exports.getQualityCenterButtonInstance = getQualityCenterButtonInstance;
function updateQualityCenterVisibility(storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const myIssues = getQualityCenterButtonInstance();
        const authType = yield storageManager.getUserData('authType');
        const apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
        const isAuthenticated = yield storageManager.getUserData('isAuthenticated');
        if ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK) ||
            (authType === 'credentials' && isAuthenticated)) {
            myIssues.show();
        }
        else {
            myIssues.hide();
        }
    });
}
exports.updateQualityCenterVisibility = updateQualityCenterVisibility;
//# sourceMappingURL=buttonQualityCenterSingleton.js.map