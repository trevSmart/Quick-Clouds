import * as vscode from 'vscode';
import { runPostLoginBackgroundTasks } from './runPostLoginBackgroundTasks';
import { QuickCloudsLogger } from './logger';

/**
 * Fetches all required user/environment data after login.
 * Sets a 'environmentReady' flag in storage on success, or clears it on failure.
 * Retries up to 2 times on failure, and shows error messages to the user.
 * Logs progress to QC2 output channel instead of showing notifications.
 */
export async function fetchUserEnvironment(storageManager: any, context: any): Promise<boolean> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            QuickCloudsLogger.getInstance().info('Loading Quality Clouds environment...');
            await runPostLoginBackgroundTasks(storageManager, context);
            await storageManager.setUserData('environmentReady', true);
            QuickCloudsLogger.getInstance().info('Quality Clouds environment loaded successfully');
            return true;
        } catch (err) {
            lastError = err;
            await storageManager.setUserData('environmentReady', false);
            QuickCloudsLogger.getInstance().error(`Failed to load Quality Clouds environment (attempt ${attempt})`, err);

            if (attempt === 2) {
                vscode.window.showErrorMessage('Failed to load Quality Clouds environment. Please try again.');
            }
        }
    }

    return false;
}