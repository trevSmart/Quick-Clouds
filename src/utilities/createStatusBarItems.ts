import * as vscode from 'vscode';
import { getButtonLCInstance } from './buttonLCSingleton';
import { getQualityCenterButtonInstance, updateQualityCenterVisibility } from './buttonQualityCenterSingleton';
import { HTTP_STATUS_OK } from '../constants';

export function createStatusBarItems(apiKeyStatus: any, authType: string, isAuthenticated: boolean = false, storageManager?: any) {
    const buttonLC = getButtonLCInstance();

    if (authType === 'apiKey') {
        (apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK) ? buttonLC.show() : buttonLC.hide();
    } else if (authType === 'credentials') {
        isAuthenticated ? buttonLC.show() : buttonLC.hide();
    } else {
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
    } else {
        newWO.hide();
    }

    let tooltip = '';
    if (authType === 'credentials') {
        tooltip = isAuthenticated
            ? 'Logged in with Quality Clouds credentials'
            : 'Not logged in. Click to authenticate with Quality Clouds credentials.';
    } else if (authType === 'apiKey') {
        tooltip = (apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK)
            ? 'Connected with API Key'
            : 'API Key not valid. Click to validate or update your API Key.';
    }

    const loginButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    loginButton.text = '$(account) Quality Clouds';
    loginButton.command = 'quick-clouds.settings';
    loginButton.tooltip = tooltip;
    loginButton.show();

    const myIssues = getQualityCenterButtonInstance();
    if (storageManager) {
        updateQualityCenterVisibility(storageManager);
    } else {
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
