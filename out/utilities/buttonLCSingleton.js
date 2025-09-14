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
exports.setButtonLCSpinning = setButtonLCSpinning;
exports.updateButtonLCVisibility = updateButtonLCVisibility;
const vscode = __importStar(require("vscode"));
const constants_2 = require("../constants");
const IsElementToAnalize_2 = __importDefault(require("./IsElementToAnalize"));
let buttonLCInstance = null;
// Track if a scan run is currently in progress to control visibility
let liveCheckInProgressForUI = false;
function getButtonLCInstance() {
    if (!buttonLCInstance) {
        // Higher priority appears more to the left on the Right side
        // Set to 30 to keep order: Scan (30) -> Write-off (20) -> Quality Center (10)
        buttonLCInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
        buttonLCInstance.text = 'Scan';
        buttonLCInstance.command = constants_2.CMD_SCAN;
    }
    return buttonLCInstance;
}
function setButtonLCSpinning(isSpinning, fileName) {
    const buttonLC = getButtonLCInstance();
    if (isSpinning) {
        liveCheckInProgressForUI = true;
        buttonLC.text = '$(loading~spin) Scan';
        buttonLC.tooltip = fileName ? `Scanning ${fileName}...` : 'Scan in progress...';
        // Ensure the button is visible while spinning regardless of context
        buttonLC.show();
    }
    else {
        liveCheckInProgressForUI = false;
        buttonLC.text = 'Scan';
        buttonLC.tooltip = undefined;
    }
}
async function updateButtonLCVisibility(storageManager) {
    const buttonLC = getButtonLCInstance();
    // If a Live Check is running, always show the button (spinner state managed elsewhere)
    if (liveCheckInProgressForUI) {
        buttonLC.show();
        return;
    }
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');
    const activeEditor = vscode.window.activeTextEditor;
    const hasActiveEditor = !!activeEditor;
    const activePath = activeEditor?.document?.uri?.fsPath || '';
    const isSupportedFile = hasActiveEditor ? (0, IsElementToAnalize_2.default)(activePath) : false;
    if (hasActiveEditor && isSupportedFile && ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === constants_2.HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated))) {
        buttonLC.show();
    }
    else {
        buttonLC.hide();
    }
}
//# sourceMappingURL=buttonLCSingleton.js.map