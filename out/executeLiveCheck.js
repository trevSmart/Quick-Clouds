"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            }
        }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeLiveCheck = void 0;
const vscode = require("vscode");
const path = require("path");
const handleLicenseInfo_1 = require("./handleLicenseInfo");
const GetWriteOffReasons_1 = require("../services/GetWriteOffReasons");
const LiveCheck_1 = require("../services/LiveCheck");
const UpdateDiagnostics_1 = require("./UpdateDiagnostics");
const logger_1 = require("./logger");
const WriteOffMenuPanel_1 = require("./panels/WriteOffMenuPanel");
const extension_1 = require("./extension");
// Simple in-memory lock to prevent concurrent runs
let __qcLiveCheckInProgress = false;
function executeLiveCheck(context, newWO, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Concurrency guard: if a run is already active, do nothing
            if (__qcLiveCheckInProgress) {
                const logger = logger_1.QuickCloudsLogger.getInstance();
                logger.info('ExecuteLiveCheck: A run is already in progress. Ignoring new request.');
                return;
            }
            __qcLiveCheckInProgress = true;
            const activeFile = vscode.window.activeTextEditor?.document?.fileName;
            const fileLabel = activeFile ? ` for ${path.basename(activeFile)}` : '';
            yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: `Running live check${fileLabel}...`
            }, () => __awaiter(this, void 0, void 0, function* () {
                const { response, documentPath, qualityGatesPassed } = yield (0, LiveCheck_1.runLivecheck)(context, storageManager);
                // Do not auto-open the scanned file after Live Check completes
                if (vscode.window.activeTextEditor) {
                    yield (0, UpdateDiagnostics_1.updateDiagnostics)(vscode.window.activeTextEditor.document, response, context, storageManager);
                    newWO.show();
                }
                // If the Write‑off panel is open, refresh with the latest data
                try {
                    const panel = WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel;
                    if (panel && typeof panel.refreshData === 'function') {
                        const logger = logger_1.QuickCloudsLogger.getInstance();
                        logger.info('ExecuteLiveCheck: Refreshing Write-off panel after Live Check');
                        yield panel.refreshData();
                    }
                }
                catch (e) {
                    const logger = logger_1.QuickCloudsLogger.getInstance();
                    logger.warn('ExecuteLiveCheck: Failed to refresh Write-off panel: ' + (e === null || e === void 0 ? void 0 : e.message));
                    try {
                        if (WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel) {
                            WriteOffMenuPanel_1.WriteOffMenuPanel.closeAll();
                            WriteOffMenuPanel_1.WriteOffMenuPanel.render(context.extensionUri, context, extension_1.env, newWO, storageManager);
                            logger.info('ExecuteLiveCheck: Write-off panel reloaded as fallback');
                        }
                    }
                    catch (e2) {
                        logger.error('ExecuteLiveCheck: Failed to reload Write-off panel: ' + (e2 === null || e2 === void 0 ? void 0 : e2.message));
                    }
                }
                if (response.length > 0) {
                    (0, GetWriteOffReasons_1.default)(storageManager, context);
                    yield (0, handleLicenseInfo_1.handleLicenseInfo)(storageManager, context);
                }
                const realIssues = response.filter((i) => {
                    const sev = (i?.severity || '').toLowerCase();
                    return sev === 'high' || sev === 'medium' || sev === 'low';
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
                if (counts.high)
                    parts.push(`${counts.high} high`);
                if (counts.medium)
                    parts.push(`${counts.medium} medium`);
                if (counts.low)
                    parts.push(`${counts.low} low`);
                const summary = parts.join(', ');
                const summarySuffix = summary ? ` (${summary})` : '';
                if (hasValidResult && qualityGatesPassed) {
                    if (totalIssues === 0) {
                        vscode.window.showInformationMessage('Live check PASSED');
                    }
                    else if (counts.high === 0) {
                        const plural = totalIssues === 1 ? 'issue' : 'issues';
                        const warnMsg = `Live check PASSED with ${totalIssues} ${plural} found${summarySuffix}`;
                        vscode.window.showWarningMessage(warnMsg);
                    }
                    else {
                        const message = `Live check FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                        vscode.window.showErrorMessage(message);
                    }
                }
                else if (hasValidResult) {
                    const message = `Live check FAILED with ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} found (${summary})`;
                    if (counts.high > 0) {
                        vscode.window.showErrorMessage(message);
                    }
                    else if (totalIssues > 0) {
                        vscode.window.showWarningMessage(message);
                    }
                }
            }));
        }
        catch (error) {
            const logger = logger_1.QuickCloudsLogger.getInstance();
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
        finally {
            __qcLiveCheckInProgress = false;
        }
    });
}
exports.executeLiveCheck = executeLiveCheck;
