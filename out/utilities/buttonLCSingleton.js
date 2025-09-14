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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getButtonLCInstance = getButtonLCInstance;
exports.updateButtonLCVisibility = updateButtonLCVisibility;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const IsElementToAnalize_1 = __importDefault(require("./IsElementToAnalize"));
let buttonLCInstance = null;
function getButtonLCInstance() {
    if (!buttonLCInstance) {
        // Higher priority appears more to the left on the Right side
        // Set to 30 to keep order: Scan (30) -> Write-off (20) -> Quality Center (10)
        buttonLCInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
        buttonLCInstance.text = 'Scan';
        buttonLCInstance.command = 'quick-clouds.scan';
    }
    return buttonLCInstance;
}
async function updateButtonLCVisibility(storageManager) {
    var _a, _b;
    const buttonLC = getButtonLCInstance();
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');
    const activeEditor = vscode.window.activeTextEditor;
    const hasActiveEditor = !!activeEditor;
    const activePath = ((_b = (_a = activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.document) === null || _a === void 0 ? void 0 : _a.uri) === null || _b === void 0 ? void 0 : _b.fsPath) || '';
    const isSupportedFile = hasActiveEditor ? (0, IsElementToAnalize_1.default)(activePath) : false;
    if (hasActiveEditor && isSupportedFile && ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated))) {
        buttonLC.show();
    }
    else {
        buttonLC.hide();
    }
}
