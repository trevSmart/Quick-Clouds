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
const handleLicenseInfo_1 = require("./handleLicenseInfo");
const GetWriteOffReasons_1 = __importDefault(require("../services/GetWriteOffReasons"));
const LiveCheck_1 = require("../services/LiveCheck");
const UpdateDiagnostics_1 = require("./UpdateDiagnostics");
const logger_2 = require("./logger");
const WriteOffMenuPanel_1 = require("../../panels/WriteOffMenuPanel");
const extension_1 = require("../../extension");
const buttonLCSingleton_1 = require("./buttonLCSingleton");
const IsElementToAnalize_1 = __importDefault(require("./IsElementToAnalize"));
async function executeLiveCheck(context, newWO, storageManager) {
    var _a, _b;
    try {
        // Guard: only allow supported file types when command is invoked directly
        const activeFile = (_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.fileName;
        try {
            const supported = activeFile ? (0, IsElementToAnalize_1.default)(activeFile) : false;
            if (!supported) {
                const logger = logger_2.QuickCloudsLogger.getInstance();
                logger.info('ExecuteLiveCheck: Command invoked with unsupported file. Aborting.');
                vscode.window.showInformationMessage('Live Check is only available for Apex classes, Apex triggers, Aura JS, and LWC JS under force-app. Open a supported file and try again.');
                return;
            }
        }
        catch (_) { }
        // Set button to spinning state
        (0, buttonLCSingleton_1.setButtonLCSpinning)(true);
        
        const fileLabel = activeFile ? ` for ${path.basename(activeFile)}` : '';
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title: `Running live check${fileLabel}...`
        }, async () => {
            const { response, documentPath, qualityGatesPassed } = await (0, LiveCheck_1.runLivecheck)(context, storageManager);
            // Log final results
            const logger = logger_2.QuickCloudsLogger.getInstance();
            logger.info('ExecuteLiveCheck: LiveCheck completed successfully');
            logger.info('ExecuteLiveCheck: Final issues count: ' + (response ? response.length : 'No response'));
            logger.info('ExecuteLiveCheck: Document path: ' + documentPath);
            // Do not auto-open the scanned file after Live Check completes
            if (vscode.window.activeTextEditor) {
                await (0, UpdateDiagnostics_1.updateDiagnostics)(vscode.window.activeTextEditor.document, response, context, storageManager);
                newWO.show();
            }
            // If the Write‑off panel is open, refresh with the latest data
            try {
                const panel = WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel;
                if (panel && typeof panel.refreshData === 'function') {
                    const logger = logger_2.QuickCloudsLogger.getInstance();
                    logger.info('ExecuteLiveCheck: Refreshing Write-off panel after Live Check');
                    await panel.refreshData();
                }
            } catch (e) {
                const logger = logger_2.QuickCloudsLogger.getInstance();
                logger.warn('ExecuteLiveCheck: Failed to refresh Write-off panel: ' + (e === null || e === void 0 ? void 0 : e.message));
                try {
                    if (WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel) {
                        WriteOffMenuPanel_1.WriteOffMenuPanel.closeAll();
                        WriteOffMenuPanel_1.WriteOffMenuPanel.render(context.extensionUri, context, extension_1.env, newWO, storageManager);
                        logger.info('ExecuteLiveCheck: Write-off panel reloaded as fallback');
                    }
                } catch (e2) {
                    logger.error('ExecuteLiveCheck: Failed to reload Write-off panel: ' + (e2 === null || e2 === void 0 ? void 0 : e2.message));
                }
            }
            if (response.length > 0) {
                (0, GetWriteOffReasons_1.default)(storageManager, context);
                await (0, handleLicenseInfo_1.handleLicenseInfo)(storageManager, context);
            }
            else {
                logger.info('ExecuteLiveCheck: No issues found, no write-off panel will be shown');
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
    finally {
        // Always reset button to normal state
        (0, buttonLCSingleton_1.setButtonLCSpinning)(false);
    }
}
