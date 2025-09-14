import * as vscode from 'vscode';
import { HTTP_STATUS_OK } from '../constants';
import isElementToAnalize from './IsElementToAnalize';

let buttonLCInstance: vscode.StatusBarItem | null = null;
// Track if a Live Check run is currently in progress to control visibility
let liveCheckInProgressForUI = false;

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

export function setButtonLCSpinning(isSpinning: boolean, fileName?: string): void {
    const buttonLC = getButtonLCInstance();
    if (isSpinning) {
        liveCheckInProgressForUI = true;
        buttonLC.text = '$(loading~spin) Live check';
        buttonLC.tooltip = fileName ? `Checking ${fileName}...` : 'Live check in progress...';
        // Ensure the button is visible while spinning regardless of context
        buttonLC.show();
    } else {
        liveCheckInProgressForUI = false;
        buttonLC.text = 'Live check';
        buttonLC.tooltip = undefined;
    }
}

export async function updateButtonLCVisibility(storageManager: any): Promise<void> {
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
    const isSupportedFile = hasActiveEditor ? isElementToAnalize(activePath) : false;

    if (hasActiveEditor && isSupportedFile && ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated))) {
        buttonLC.show();
    } else {
        buttonLC.hide();
    }
}
