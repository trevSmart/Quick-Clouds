import * as vscode from 'vscode';
import { HTTP_STATUS_OK } from '../constants';

let qualityCenterButtonInstance: vscode.StatusBarItem | null = null;

export function getQualityCenterButtonInstance(): vscode.StatusBarItem {
    if (!qualityCenterButtonInstance) {
        qualityCenterButtonInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        qualityCenterButtonInstance.text = '$(issues) Quality Center';
        qualityCenterButtonInstance.command = 'quick-clouds.myIssues';
    }
    return qualityCenterButtonInstance;
}

export async function updateQualityCenterButtonVisibility(storageManager: any): Promise<void> {
    const qualityCenterButton = getQualityCenterButtonInstance();
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');

    if ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated)) {
        qualityCenterButton.show();
    } else {
        qualityCenterButton.hide();
    }
}