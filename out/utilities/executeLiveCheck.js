"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeLiveCheck = void 0;
const vscode = require("vscode");
const path = require("path");
const { handleLicenseInfo } = require("./handleLicenseInfo");
const GetWriteOffReasons = require("../services/GetWriteOffReasons").default;
const { runLivecheck } = require("../services/LiveCheck");
const { updateDiagnostics } = require("./UpdateDiagnostics");
const { QuickCloudsLogger } = require("./logger");
const { WriteOffMenuPanel } = require("../panels/WriteOffMenuPanel");
const { env } = require("../extension");
const IsElementToAnalize = require("./IsElementToAnalize");

// Manage concurrent scan sessions per file
const latestSessionByFile = new Map();
const cancelledSessions = new Set();
function newSessionId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function executeLiveCheck(context, newWO, storageManager) {
    try {
        // Current editor info
        const activeEditor = vscode.window.activeTextEditor;
        const fileName = activeEditor ? path.basename(activeEditor.document.fileName) : undefined;
        const activePath = activeEditor ? activeEditor.document.fileName : undefined;
        const sessionId = newSessionId();
        if (activePath) {
            latestSessionByFile.set(activePath, sessionId);
        }

        // Guard: supported file types
        try {
            const supported = activePath ? (IsElementToAnalize && IsElementToAnalize.default ? IsElementToAnalize.default(activePath) : false) : false;
            if (!supported) {
                const logger = QuickCloudsLogger.getInstance();
                logger.info('Scan: Command invoked with unsupported file. Aborting.');
                vscode.window.showInformationMessage('Scan is only available for Apex classes, Apex triggers, Aura JS, and LWC JS under force-app. Open a supported file and try again.');
                return;
            }
        } catch (_) { }

        let response = [];
        let documentPath;
        let qualityGatesPassed;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: fileName ? `Scanning ${fileName}` : 'Scanning',
            cancellable: true
        }, async (_progress, token) => {
            const logger = QuickCloudsLogger.getInstance();
            let cancelled = false;
            if (token && token.onCancellationRequested) {
                token.onCancellationRequested(() => {
                    cancelled = true;
                    if (activePath) cancelledSessions.add(sessionId);
                    logger.info(`Scan: User canceled scan for ${fileName || 'unknown file'} (session ${sessionId})`);
                    if (fileName) {
                        vscode.window.showInformationMessage(`Scanning of ${fileName} was canceled`);
                    } else {
                        vscode.window.showInformationMessage('Scanning was canceled');
                    }
                });
            }

            const livePromise = runLivecheck(context, storageManager);
            const cancelPromise = new Promise((resolve) => token && token.onCancellationRequested && token.onCancellationRequested(() => resolve(undefined)));
            const winner = await Promise.race([livePromise, cancelPromise]);

            const handleResult = async (result) => {
                // Purge old issues before any further processing
                try {
                    const purgeResult = storageManager && typeof storageManager.deleteIssuesOlderThan === 'function'
                        ? await storageManager.deleteIssuesOlderThan(30)
                        : null;
                    logger.info(`Scan: Purged issues older than 30 days${purgeResult && purgeResult.deletedHistories !== undefined ? ` (histories removed: ${purgeResult.deletedHistories})` : ''}`);
                } catch (purgeErr) {
                    logger.warn('Scan: Failed to purge old issues: ' + ((purgeErr && purgeErr.message) || String(purgeErr)));
                }

                response = result.response || [];
                documentPath = result.documentPath;
                qualityGatesPassed = result.qualityGatesPassed;

                const fileKey = documentPath || activePath;
                const isStale = fileKey ? latestSessionByFile.get(fileKey) !== sessionId : false;
                if (cancelled || isStale || (fileKey && cancelledSessions.has(sessionId))) {
                    logger.info(`Scan: Result ignored (cancelled=${cancelled}, stale=${isStale}) for session ${sessionId}`);
                    return;
                }

                logger.info('Scan: Completed successfully');
                logger.info('Scan: Final issues count: ' + (response ? response.length : 'No response'));
                logger.info('Scan: Document path: ' + documentPath);

                if (vscode.window.activeTextEditor) {
                    await updateDiagnostics(vscode.window.activeTextEditor.document, response, context, storageManager);
                    newWO.show();
                }

                try {
                    const panel = WriteOffMenuPanel.currentPanel;
                    if (panel && typeof panel.refreshData === 'function') {
                        logger.info('Scan: Refreshing Write-off panel after scan');
                        await panel.refreshData();
                    }
                } catch (e) {
                    logger.warn('Scan: Failed to refresh Write-off panel: ' + (e && e.message));
                    try {
                        if (WriteOffMenuPanel.currentPanel) {
                            WriteOffMenuPanel.closeAll();
                            WriteOffMenuPanel.render(context.extensionUri, context, env, newWO, storageManager);
                            logger.info('Scan: Write-off panel reloaded as fallback');
                        }
                    } catch (e2) {
                        logger.error('Scan: Failed to reload Write-off panel: ' + (e2 && e2.message));
                    }
                }

                if (response.length > 0) {
                    GetWriteOffReasons(storageManager, context);
                    await handleLicenseInfo(storageManager, context);
                } else {
                    logger.info('Scan: No issues found, no write-off panel will be shown');
                }

                // Post-result summary messages
                const realIssues = response.filter((i) => {
                    const sev = ((i && i.severity) || '').toLowerCase();
                    const status = (((i && i.writeOff && i.writeOff.writeOffStatus) || (i && i.writeOffStatus) || '') + '').toUpperCase();
                    const isApproved = status === 'APPROVED';
                    return !isApproved && (sev === 'high' || sev === 'medium' || sev === 'low');
                });
                const totalIssues = realIssues.length;
                const hasValidResult = typeof qualityGatesPassed === 'boolean';
                const counts = { high: 0, medium: 0, low: 0 };
                for (const issue of realIssues) {
                    const severity = (issue.severity || '').toLowerCase();
                    if (severity === 'high') counts.high++;
                    else if (severity === 'medium') counts.medium++;
                    else if (severity === 'low') counts.low++;
                }
                const parts = [];
                if (counts.high) parts.push(`${counts.high} high`);
                if (counts.medium) parts.push(`${counts.medium} medium`);
                if (counts.low) parts.push(`${counts.low} low`);
                const summary = parts.join(', ');
                const summarySuffix = summary ? ` (${summary})` : '';

                if (hasValidResult && qualityGatesPassed) {
                    if (totalIssues === 0) {
                        vscode.window.showInformationMessage('Scan PASSED');
                    } else if (counts.high === 0) {
                        const plural = totalIssues === 1 ? 'issue' : 'issues';
                        const warnMsg = `Scan PASSED with ${totalIssues} ${plural} found${summarySuffix}`;
                        vscode.window.showWarningMessage(warnMsg);
                    } else {
                        const message = `Scan FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                        vscode.window.showErrorMessage(message);
                    }
                } else if (hasValidResult) {
                    const message = `Scan FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                    if (counts.high > 0) {
                        vscode.window.showErrorMessage(message);
                    } else if (totalIssues > 0) {
                        vscode.window.showWarningMessage(message);
                    }
                }
            };

            if (winner && winner.response !== undefined) {
                await handleResult(winner);
            } else {
                livePromise.then((r) => handleResult(r)).catch(err => {
                    const logger = QuickCloudsLogger.getInstance();
                    logger.error('Scan: Background scan failed after cancel:', err);
                });
            }
        });
    } catch (error) {
        const logger = QuickCloudsLogger.getInstance();
        logger.error('Scan failed:', error);
        const errorMessage = error.message || error.toString();
        const detailedMessage = `Quick Clouds: Scan execution failed: ${errorMessage}`;
        vscode.window.showInformationMessage(detailedMessage);
        logger.error('Scan execution error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

exports.executeLiveCheck = executeLiveCheck;
