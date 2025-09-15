import * as vscode from 'vscode';
import { HTTP_STATUS_OK } from '../constants';

let qualityCenterButtonInstance: vscode.StatusBarItem | null = null;

export function getQualityCenterButtonInstance(): vscode.StatusBarItem {
    if (!qualityCenterButtonInstance) {
        // Priority 10 to be rightmost among our three buttons
        // Order left-to-right on the Right side: LiveCheck (30) -> Write-off (20) -> Quality Center (10)
        qualityCenterButtonInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
        qualityCenterButtonInstance.text = '$(library) Quality Center';
        qualityCenterButtonInstance.command = 'quick-clouds.myIssues';
    }
    return qualityCenterButtonInstance;
}

export function setQualityCenterButtonErrorState(hasHighUnapprovedIssues: boolean): void {
    const qualityCenterButton = getQualityCenterButtonInstance();

    if (hasHighUnapprovedIssues) {
        // Set red background and white text for error state
        qualityCenterButton.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        qualityCenterButton.color = new vscode.ThemeColor('statusBarItem.errorForeground');
    } else {
        // Reset to default colors
        qualityCenterButton.backgroundColor = undefined;
        qualityCenterButton.color = undefined;
    }
}

export function setQualityCenterButtonStatus(status: 'error' | 'warning' | 'normal'): void {
    const qualityCenterButton = getQualityCenterButtonInstance();

    console.log(`🎨 Setting Quality Center button status to: ${status}`);

    switch (status) {
        case 'error':
            // Set red background and white text for HIGH issues
            console.log('🔴 Setting ERROR colors (red background)');
            qualityCenterButton.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            qualityCenterButton.color = new vscode.ThemeColor('statusBarItem.errorForeground');
            break;
        case 'warning':
            // Set orange/yellow background and dark text for MEDIUM issues
            console.log('🟡 Setting WARNING colors (yellow background)');
            qualityCenterButton.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            qualityCenterButton.color = new vscode.ThemeColor('statusBarItem.warningForeground');
            break;
        case 'normal':
        default:
            // Reset to default colors
            console.log('⚪ Setting NORMAL colors (default)');
            qualityCenterButton.backgroundColor = undefined;
            qualityCenterButton.color = undefined;
            break;
    }

    console.log(`✅ Button colors updated. Background: ${qualityCenterButton.backgroundColor}, Color: ${qualityCenterButton.color}`);
}

export async function updateQualityCenterButtonVisibility(storageManager: any): Promise<void> {
    const qualityCenterButton = getQualityCenterButtonInstance();
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');
    const showQualityCenterButton = vscode.workspace
        .getConfiguration('QuickClouds')
        .get('showQualityCenterButton', true);

    const isAuthenticatedAndVisible = showQualityCenterButton &&
        ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === HTTP_STATUS_OK) ||
            (authType === 'credentials' && isAuthenticated));

    if (isAuthenticatedAndVisible) {
        console.log('👁️ Quality Center button is visible, checking for unapproved issues...');
        qualityCenterButton.show();

        // Check for unapproved issues and update button color
        try {
            console.log('🔍 Calling getUnapprovedIssuesStatus...');
            const issuesStatus = await storageManager.getUnapprovedIssuesStatus();
            console.log(`📊 Received status from storage: ${issuesStatus}`);
            setQualityCenterButtonStatus(issuesStatus);
        } catch (error) {
            console.error('❌ Error checking for unapproved issues:', error);
            // Reset to default colors on error
            setQualityCenterButtonStatus('normal');
        }
    } else {
        console.log('👁️ Quality Center button is hidden');
        qualityCenterButton.hide();
        // Reset to default colors when hidden
        setQualityCenterButtonStatus('normal');
    }
}

// Export alias for backward compatibility
export const updateQualityCenterVisibility = updateQualityCenterButtonVisibility;
