"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatusBarItems = void 0;
const vscode = require("vscode");
const buttonLCSingleton_1 = require("./buttonLCSingleton");
const buttonQualityCenterSingleton_1 = require("./buttonQualityCenterSingleton");
const constants_1 = require("../constants");
function createStatusBarItems(apiKeyStatus, authType, isAuthenticated = false, storageManager) {
    const buttonLC = (0, buttonLCSingleton_1.getButtonLCInstance)();
    if (authType === 'apiKey') {
        (apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK) ? buttonLC.show() : buttonLC.hide();
    }
    else if (authType === 'credentials') {
        isAuthenticated ? buttonLC.show() : buttonLC.hide();
    }
    else {
        buttonLC.hide();
    }

    // Check debug mode setting
    const debugMode = vscode.workspace.getConfiguration("QC2Configuration").get("debugMode", false);

    const newWO = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
    newWO.text = '$(comment-unresolved) Write off';
    newWO.command = 'qc2.writeoff';

    // Show write off button if debug mode is enabled, otherwise hide it
    if (debugMode) {
        newWO.show();
    } else {
        newWO.hide();
    }
    let tooltip = '';
    if (authType === 'credentials') {
        tooltip = isAuthenticated
            ? 'Logged in with Quality Clouds credentials'
            : 'Not logged in. Click to authenticate with Quality Clouds credentials.';
    }
    else if (authType === 'apiKey') {
        tooltip = (apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK)
            ? 'Connected with API Key'
            : 'API Key not valid. Click to validate or update your API Key.';
    }
    const loginButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    loginButton.text = '$(account) Quality Clouds';
    loginButton.command = 'qc2.settings';
    loginButton.tooltip = tooltip;
    loginButton.show();
    const myIssues = (0, buttonQualityCenterSingleton_1.getQualityCenterButtonInstance)();
    if (storageManager) {
        (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
    }
    else {
        myIssues.hide();
    }
    const applyChangesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    applyChangesButton.text = '$(check) Apply Changes';
    applyChangesButton.tooltip = 'Apply the changes from the fixed document to the original document.';
    applyChangesButton.command = 'qc2.applyChanges';
    applyChangesButton.hide();
    const discardChangesButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    discardChangesButton.text = '$(close) Discard Changes';
    discardChangesButton.tooltip = 'Discard the changes and keep the original document unchanged.';
    discardChangesButton.command = 'qc2.discardChanges';
    discardChangesButton.hide();
    return { buttonLC, newWO, myIssues, applyChangesButton, discardChangesButton, loginButton };
}
exports.createStatusBarItems = createStatusBarItems;
//# sourceMappingURL=createStatusBarItems.js.map