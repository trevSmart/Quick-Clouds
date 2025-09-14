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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeLiveCheck = executeLiveCheck;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const handleLicenseInfo_1 = require("./handleLicenseInfo");
const GetWriteOffReasons_1 = __importDefault(require("../services/GetWriteOffReasons"));
const LiveCheck_1 = require("../services/LiveCheck");
const UpdateDiagnostics_1 = require("./UpdateDiagnostics");
const logger_2 = require("./logger");
const WriteOffMenuPanel_1 = require("../panels/WriteOffMenuPanel");
const extension_2 = require("../extension");
// Manage concurrent Live Check sessions per file
const latestSessionByFile = new Map();
const cancelledSessions = new Set();
function newSessionId() {
    // Use cryptographically-secure random bytes for the random portion
    const randomStr = crypto.randomBytes(4).toString('hex'); // 8 hex characters == 32 bits entropy
    return `${Date.now()}-${randomStr}`;
}
async function executeLiveCheck(context, newWO, storageManager) {
    try {
        // Get current file name for tooltip
        const activeEditor = vscode.window.activeTextEditor;
        const fileName = activeEditor ? path.basename(activeEditor.document.fileName) : undefined;
        const fullPath = activeEditor ? activeEditor.document.uri.fsPath : undefined;
        const sessionId = newSessionId();
        if (fullPath) {
            latestSessionByFile.set(fullPath, sessionId);
        }
        // Run Live Check inside a progress notification
        let response = [];
        let documentPath;
        let qualityGatesPassed;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: fileName ? `Live Scanning ${fileName}` : 'Live check',
            cancellable: true
        }, async (_progress, token) => {
            const logger = logger_2.QuickCloudsLogger.getInstance();
            let cancelled = false;
            token.onCancellationRequested(() => {
                cancelled = true;
                if (fullPath) {
                    cancelledSessions.add(sessionId);
                }
                logger.info(`ExecuteLiveCheck: User cancelled Live Check for ${fileName || 'unknown file'} (session ${sessionId})`);
            });
            const livePromise = (0, LiveCheck_1.runLivecheck)(context, storageManager);
            // If user cancels, stop waiting on the progress UI immediately, but keep the promise running
            const cancelPromise = new Promise((resolve) => token.onCancellationRequested(() => resolve()));
            const winner = await Promise.race([livePromise, cancelPromise]);
            const handleResult = async (result) => {
                // Purge old issues before any further processing
                try {
                    const purgeResult = await (storageManager?.deleteIssuesOlderThan
                        ? storageManager.deleteIssuesOlderThan(30)
                        : Promise.resolve(null));
                    logger.info(`ExecuteLiveCheck: Purged issues older than 30 days${purgeResult && purgeResult.deletedHistories !== undefined ? ` (histories removed: ${purgeResult.deletedHistories})` : ''}`);
                }
                catch (purgeErr) {
                    logger.warn('ExecuteLiveCheck: Failed to purge old issues: ' + (purgeErr?.message || String(purgeErr)));
                }
                response = result.response || [];
                documentPath = result.documentPath;
                qualityGatesPassed = result.qualityGatesPassed;
                // If user cancelled or this session is not the latest for this file, ignore
                const fileKey = documentPath || fullPath;
                const isStale = fileKey ? latestSessionByFile.get(fileKey) !== sessionId : false;
                if (cancelled || isStale || (fileKey && cancelledSessions.has(sessionId))) {
                    logger.info(`ExecuteLiveCheck: Result ignored (cancelled=${cancelled}, stale=${isStale}) for session ${sessionId}`);
                    return;
                }
                // Log final results
                logger.info('ExecuteLiveCheck: LiveCheck completed successfully');
                logger.info('ExecuteLiveCheck: Final issues count: ' + (response ? response.length : 'No response'));
                logger.info('ExecuteLiveCheck: Document path: ' + documentPath);
                // Update diagnostics for the active editor (no focus stealing)
                if (vscode.window.activeTextEditor) {
                    await (0, UpdateDiagnostics_1.updateDiagnostics)(vscode.window.activeTextEditor.document, response, context, storageManager);
                    newWO.show();
                }
                // If the Write‑off panel is open, refresh its data so it reflects the latest scan
                try {
                    const panel = WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel;
                    if (panel && typeof panel.refreshData === 'function') {
                        logger.info('ExecuteLiveCheck: Refreshing Write-off panel after Live Check');
                        await panel.refreshData();
                    }
                }
                catch (e) {
                    logger.warn('ExecuteLiveCheck: Failed to refresh Write-off panel: ' + (e?.message));
                    // Fallback: if refresh fails or crashes the webview, rebuild the panel
                    try {
                        if (WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel) {
                            WriteOffMenuPanel_1.WriteOffMenuPanel.closeAll();
                            WriteOffMenuPanel_1.WriteOffMenuPanel.render(context.extensionUri, context, extension_2.env, newWO, storageManager);
                            logger.info('ExecuteLiveCheck: Write-off panel reloaded as fallback');
                        }
                    }
                    catch (e2) {
                        logger.error('ExecuteLiveCheck: Failed to reload Write-off panel: ' + (e2?.message));
                    }
                }
                if (response.length > 0) {
                    (0, GetWriteOffReasons_1.default)(storageManager, context);
                    await (0, handleLicenseInfo_1.handleLicenseInfo)(storageManager, context);
                }
                else {
                    logger.info('ExecuteLiveCheck: No issues found, no write-off panel will be shown');
                }
                // Post-result user messages (only if still current and not cancelled)
                const realIssues = response.filter((i) => {
                    const sev = (i?.severity || '').toLowerCase();
                    const status = (i?.writeOff?.writeOffStatus || i?.writeOffStatus || '').toString().toUpperCase();
                    const isApproved = status === 'APPROVED';
                    return !isApproved && (sev === 'high' || sev === 'medium' || sev === 'low');
                });
                const totalIssues = realIssues.length;
                const hasValidResult = typeof qualityGatesPassed === 'boolean';
                const counts = { high: 0, medium: 0, low: 0 };
                for (const issue of realIssues) {
                    const severity = (issue.severity || '').toLowerCase();
                    if (severity === 'high') {
                        counts.high++;
                    }
                    else if (severity === 'medium') {
                        counts.medium++;
                    }
                    else if (severity === 'low') {
                        counts.low++;
                    }
                }
                const parts = [];
                if (counts.high) {
                    parts.push(`${counts.high} high`);
                }
                if (counts.medium) {
                    parts.push(`${counts.medium} medium`);
                }
                if (counts.low) {
                    parts.push(`${counts.low} low`);
                }
                const summary = parts.join(', ');
                const summarySuffix = summary ? ` (${summary})` : '';
                if (hasValidResult && qualityGatesPassed) {
                    if (totalIssues === 0) {
                        vscode.window.showInformationMessage('Scan passed');
                    }
                    else if (counts.high === 0) {
                        const plural = totalIssues === 1 ? 'issue' : 'issues';
                        const warnMsg = `Scan passed with ${totalIssues} ${plural} found${summarySuffix}`;
                        vscode.window.showWarningMessage(warnMsg);
                    }
                    else {
                        const message = `Scan failed with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                        vscode.window.showErrorMessage(message);
                    }
                }
                else if (hasValidResult) {
                    const message = `Scan failed with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                    if (counts.high > 0) {
                        vscode.window.showErrorMessage(message);
                    }
                    else if (totalIssues > 0) {
                        vscode.window.showWarningMessage(message);
                    }
                }
            };
            if (winner && winner.response !== undefined) {
                // Completed before cancel
                await handleResult(winner);
            }
            else {
                // Cancel pressed first; handle result later (ignored if cancelled/stale)
                livePromise.then(handleResult).catch(err => {
                    logger.error('ExecuteLiveCheck: Background Live Check failed after cancel:', err);
                });
            }
        });
    }
    catch (error) {
        const logger = logger_2.QuickCloudsLogger.getInstance();
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
    }
}
//# sourceMappingURL=executeLiveCheck.js.map