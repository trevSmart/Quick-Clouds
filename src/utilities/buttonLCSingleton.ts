import * as vscode from 'vscode';
import { HTTP_STATUS_OK } from '../constants';
import isElementToAnalize from './IsElementToAnalize';

let buttonLCInstance: vscode.StatusBarItem | null = null;

export function getButtonLCInstance(): vscode.StatusBarItem {
    if (!buttonLCInstance) {
        // Higher priority appears more to the left on the Right side
        // Set to 30 to keep order: LiveCheck (30) -> Write-off (20) -> Quality Center (10)
        buttonLCInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 30);
        buttonLCInstance.text = 'Live check';
        buttonLCInstance.command = 'quick-clouds.check';
    }
    return buttonLCInstance;
}

export async function updateButtonLCVisibility(storageManager: any): Promise<void> {
    const buttonLC = getButtonLCInstance();
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');
    const activeEditor = vscode.window.activeTextEditor;
    const hasActiveEditor = !!activeEditor;
    const activePath = activeEditor?.document?.uri?.fsPath || '';
    const isSupportedFile = hasActiveEditor ? isElementToAnalize(activePath) : false;

    if (hasActiveEditor && isSupportedFile && ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated))) {
        buttonLC.show();
    } else {
        buttonLC.hide();
    }
}
