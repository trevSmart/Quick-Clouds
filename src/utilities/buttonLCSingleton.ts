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
exports.updateButtonLCVisibility = exports.getButtonLCInstance = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
let buttonLCInstance = null;
function getButtonLCInstance() {
    if (!buttonLCInstance) {
        buttonLCInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        buttonLCInstance.text = 'LiveCheck';
        buttonLCInstance.command = 'qc2.check';
    }
    return buttonLCInstance;
}
exports.getButtonLCInstance = getButtonLCInstance;
function updateButtonLCVisibility(storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const buttonLC = getButtonLCInstance();
        const authType = yield storageManager.getUserData('authType');
        const apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
        const isAuthenticated = yield storageManager.getUserData('isAuthenticated');
        const hasActiveEditor = !!vscode.window.activeTextEditor;
        if (hasActiveEditor && ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK) ||
            (authType === 'credentials' && isAuthenticated))) {
            buttonLC.show();
        }
        else {
            buttonLC.hide();
        }
    });
}
exports.updateButtonLCVisibility = updateButtonLCVisibility;
//# sourceMappingURL=buttonLCSingleton.js.map