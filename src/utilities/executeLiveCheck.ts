import * as vscode from 'vscode';
import * as path from 'path';
import { handleLicenseInfo } from './handleLicenseInfo';
import GetWriteOffReasons from '../services/GetWriteOffReasons';
import { runLivecheck } from '../services/LiveCheck';
import { updateDiagnostics } from './UpdateDiagnostics';
import { QuickCloudsLogger } from './logger';
import { setButtonLCSpinning } from './buttonLCSingleton';
import { WriteOffMenuPanel } from '../panels/WriteOffMenuPanel';

// Prevent concurrent Live Check runs
let liveCheckInProgress = false;

export async function executeLiveCheck(context: vscode.ExtensionContext, newWO: vscode.StatusBarItem, storageManager: any): Promise<void> {
    try {
        // Concurrency guard: if already running, do nothing
        if (liveCheckInProgress) {
            const logger = QuickCloudsLogger.getInstance();
            logger.info('ExecuteLiveCheck: A run is already in progress. Ignoring new request.');
            return;
        }
        liveCheckInProgress = true;
        // Get current file name for tooltip
        const activeEditor = vscode.window.activeTextEditor;
        const fileName = activeEditor ? path.basename(activeEditor.document.fileName) : undefined;

        // Set button to spinning state
        setButtonLCSpinning(true, fileName);

        const { response, documentPath, qualityGatesPassed } = await runLivecheck(context, storageManager);

        // Log final results
        const logger = QuickCloudsLogger.getInstance();
        logger.info('ExecuteLiveCheck: LiveCheck completed successfully');
        logger.info('ExecuteLiveCheck: Final issues count: ' + (response ? response.length : 'No response'));
        logger.info('ExecuteLiveCheck: Document path: ' + documentPath);
        // Do not auto-open the scanned file after Live Check completes
        // Intentionally skipping showTextDocument to avoid stealing focus
        if (vscode.window.activeTextEditor) {
            await updateDiagnostics(vscode.window.activeTextEditor.document, response, context, storageManager);
            newWO.show();
        }
        // If the Write‑off panel is open, refresh its data so it reflects the latest scan
        try {
            const panel: any = (WriteOffMenuPanel as any).currentPanel;
            if (panel && typeof panel.refreshData === 'function') {
                logger.info('ExecuteLiveCheck: Refreshing Write-off panel after Live Check');
                await panel.refreshData();
            }
        } catch (e: any) {
            logger.warn('ExecuteLiveCheck: Failed to refresh Write-off panel: ' + (e?.message));
        }
        if (response.length > 0) {
            GetWriteOffReasons(storageManager, context);
            await handleLicenseInfo(storageManager, context);
        } else {
            logger.info('ExecuteLiveCheck: No issues found, no write-off panel will be shown');
        }

        const totalIssues = response.length;
        const hasValidResult = typeof qualityGatesPassed === 'boolean';
        const counts = { high: 0, medium: 0, low: 0 };
        for (const issue of response) {
            const severity = (issue.severity || '').toLowerCase();
            if (severity === 'high') {
                counts.high++;
            } else if (severity === 'medium') {
                counts.medium++;
            } else if (severity === 'low') {
                counts.low++;
            }
        }
        const parts: string[] = [];
        if (counts.high) { parts.push(`${counts.high} high`); }
        if (counts.medium) { parts.push(`${counts.medium} medium`); }
        if (counts.low) { parts.push(`${counts.low} low`); }
        const summary = parts.join(', ');
        const summarySuffix = summary ? ` (${summary})` : '';

        if (hasValidResult && qualityGatesPassed) {
            if (totalIssues === 0) {
                vscode.window.showInformationMessage('Live check PASSED');
            } else if (counts.high === 0) {
                const plural = totalIssues === 1 ? 'issue' : 'issues';
                const warnMsg = `Live check PASSED with ${totalIssues} ${plural} found${summarySuffix}`;
                vscode.window.showWarningMessage(warnMsg);
            } else {
                const message = `Live check FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                vscode.window.showErrorMessage(message);
            }
        } else if (hasValidResult) {
            const message = `Live check FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
            if (counts.high > 0) {
                vscode.window.showErrorMessage(message);
            } else if (totalIssues > 0) {
                vscode.window.showWarningMessage(message);
            }
        }
    } catch (error) {
        const logger = QuickCloudsLogger.getInstance();
        logger.error('ExecuteLiveCheck failed:', error);

        // Enhanced error message
        const errorMessage = error.message || error.toString();
        const detailedMessage = `LiveCheck execution failed: ${errorMessage}`;

        vscode.window.showInformationMessage(detailedMessage);
        logger.error('LiveCheck execution error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    } finally {
        // Always reset button to normal state
        setButtonLCSpinning(false);
        liveCheckInProgress = false;
    }
}
