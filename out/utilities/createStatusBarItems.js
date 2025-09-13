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
exports.createStatusBarItems = createStatusBarItems;
const vscode = __importStar(require("vscode"));
const buttonLCSingleton_2 = require("./buttonLCSingleton");
const buttonQualityCenterSingleton_2 = require("./buttonQualityCenterSingleton");
const constants_2 = require("../constants");
function createStatusBarItems(apiKeyStatus, authType, isAuthenticated = false, storageManager) {
    const buttonLC = (0, buttonLCSingleton_2.getButtonLCInstance)();
    if (authType === 'apiKey') {
        (apiKeyStatus && apiKeyStatus.statusCode === constants_2.HTTP_STATUS_OK) ? buttonLC.show() : buttonLC.hide();
    }
    else if (authType === 'credentials') {
        isAuthenticated ? buttonLC.show() : buttonLC.hide();
    }
    else {
        buttonLC.hide();
    }
    // Check debug mode setting
    const debugMode = vscode.workspace.getConfiguration("QuickClouds").get("debugMode", false);
    // Priority 20 to sit between LiveCheck (30) and Quality Center (10)
    const newWO = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 20);
    // Display plain text without codicon
    newWO.text = '$(comment-unresolved) Write-off';
    newWO.command = 'quick-clouds.writeoff';
    // Show write-off button if debug mode is enabled, otherwise hide it
    if (debugMode) {
        newWO.show();
    }
    else {
        newWO.hide();
    }
    let tooltip = '';
    if (authType === 'credentials') {
        tooltip = isAuthenticated
            ? 'Logged in with Quality Clouds credentials'
            : 'Not logged in. Click to authenticate with Quality Clouds credentials.';
    }
    else if (authType === 'apiKey') {
        tooltip = (apiKeyStatus && apiKeyStatus.statusCode === constants_2.HTTP_STATUS_OK)
            ? 'Connected with API Key'
            : 'API Key not valid. Click to validate or update your API Key.';
    }
    const loginButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    // Align label with TS source and branding
    loginButton.text = '$(account) Quick Clouds settings';
    loginButton.command = 'quick-clouds.settings';
    loginButton.tooltip = tooltip;
    // Respect `QuickClouds.showSettingsButton` setting
    const showSettingsButton = vscode.workspace
        .getConfiguration('QuickClouds')
        .get('showSettingsButton', true);
    showSettingsButton ? loginButton.show() : loginButton.hide();
    const myIssues = (0, buttonQualityCenterSingleton_2.getQualityCenterButtonInstance)();
    if (storageManager) {
        (0, buttonQualityCenterSingleton_2.updateQualityCenterVisibility)(storageManager);
    }
    else {
        myIssues.hide();
    }
    const applyChangesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    applyChangesButton.text = '$(check) Apply Changes';
    applyChangesButton.tooltip = 'Apply the changes from the fixed document to the original document.';
    applyChangesButton.command = 'quick-clouds.applyChanges';
    applyChangesButton.hide();
    const discardChangesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    discardChangesButton.text = '$(close) Discard Changes';
    discardChangesButton.tooltip = 'Discard the changes and keep the original document unchanged.';
    discardChangesButton.command = 'quick-clouds.discardChanges';
    discardChangesButton.hide();
    return { buttonLC, newWO, myIssues, applyChangesButton, discardChangesButton, loginButton };
}
//# sourceMappingURL=createStatusBarItems.js.map
