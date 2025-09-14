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
Object.defineProperty(exports, "__esModule", { value: true });
exports.collection = exports.env = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const env_2 = require("./env");
const WriteOffMenuPanel_1 = require("./panels/WriteOffMenuPanel");
const MyIssuesPanel_1 = require("./panels/MyIssuesPanel");
const SettingsPanel_2 = require("./panels/SettingsPanel");
const executeLiveCheck_1 = require("./utilities/executeLiveCheck");
const generateCodeFix_1 = require("./utilities/generateCodeFix");
const validateApiKey_1 = require("./utilities/validateApiKey");
const initializeExtension_1 = require("./utilities/initializeExtension");
const restoreDiagnostics_1 = require("./utilities/restoreDiagnostics");
const createStatusBarItems_1 = require("./utilities/createStatusBarItems");
const uriHandler_1 = require("./utilities/uriHandler");
const buttonLCSingleton_2 = require("./utilities/buttonLCSingleton");
const buttonQualityCenterSingleton_2 = require("./utilities/buttonQualityCenterSingleton");
const constants_2 = require("./constants");
const logger_2 = require("./utilities/logger");
const globalErrorHandlers_1 = require("./utilities/globalErrorHandlers");
exports.env = env_2.Env.PROD;
exports.collection = vscode.languages.createDiagnosticCollection('Quick Clouds');
async function activate(context) {
    const logger = logger_2.QuickCloudsLogger.getInstance();
    const activateStart = Date.now();
    logger.info('Quick Clouds: activate() called');
    // Install global error handlers early so any failure gets logged
    (0, globalErrorHandlers_1.installGlobalErrorHandlers)(context);
    let initPromise;
    async function ensureInitialized() {
        if (initPromise) {
            return initPromise;
        }
        initPromise = (async () => {
            const t0 = Date.now();
            const { apiKeyStatus, storageManager, authType, isAuthenticated } = await (0, initializeExtension_1.initializeExtension)(context);
            const buttonLC = (0, buttonLCSingleton_2.getButtonLCInstance)();
            await (0, buttonLCSingleton_2.updateButtonLCVisibility)(storageManager);
            await (0, buttonQualityCenterSingleton_2.updateQualityCenterVisibility)(storageManager);
            // Update LiveCheck button visibility when the active editor changes
            vscode.window.onDidChangeActiveTextEditor(() => {
                (0, buttonLCSingleton_2.updateButtonLCVisibility)(storageManager);
            });
            const { newWO, myIssues, applyChangesButton, discardChangesButton, loginButton } = (0, createStatusBarItems_1.createStatusBarItems)(apiKeyStatus, authType, isAuthenticated, storageManager);
            // React to configuration changes (status bar visibility, debug mode)
            const cfgListener = vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('QuickClouds.showSettingsButton')) {
                    const showSettingsButton = vscode.workspace.getConfiguration('QuickClouds').get('showSettingsButton', true);
                    showSettingsButton ? loginButton.show() : loginButton.hide();
                }
                if (e.affectsConfiguration('QuickClouds.showQualityCenterButton')) {
                    (0, buttonQualityCenterSingleton_2.updateQualityCenterVisibility)(storageManager);
                }
                if (e.affectsConfiguration('QuickClouds.debugMode')) {
                    const debugMode = vscode.workspace.getConfiguration('QuickClouds').get('debugMode', false);
                    debugMode ? newWO.show() : newWO.hide();
                }
            });
            context.subscriptions.push(cfgListener);
            // Restore diagnostics in the background to avoid blocking first command
            setTimeout(async () => {
                try {
                    await (0, restoreDiagnostics_1.restoreDiagnosticsFromStorage)(context, storageManager);
                }
                catch {
                    logger.warn('Diagnostics restore deferred task failed');
                }
            }, 0);
            logger.info(`Quick Clouds: initialization completed in ${Date.now() - t0} ms`);
            return { storageManager, apiKeyStatus, authType, isAuthenticated, buttonLC, newWO, myIssues, applyChangesButton, discardChangesButton, loginButton };
        })();
        return initPromise;
    }
    // Register commands immediately; they will lazy-initialize on first use.
    const validateAPIKeyCommand = vscode.commands.registerCommand(constants_2.CMD_VALIDATE_APIKEY, async (apiKeyFromWebview) => {
        const { storageManager, buttonLC } = await ensureInitialized();
        await (0, validateApiKey_1.validateApiKey)(storageManager, buttonLC, context, apiKeyFromWebview);
    });
    const liveCheckCommand = vscode.commands.registerCommand(constants_2.CMD_SCAN, async () => {
        const { storageManager, newWO } = await ensureInitialized();
        await (0, executeLiveCheck_1.executeLiveCheck)(context, newWO, storageManager);
    });
    const writeOffCommand = vscode.commands.registerCommand(constants_2.CMD_WRITE_OFF, async (document, diagnostic) => {
        const { storageManager, newWO } = await ensureInitialized();
        const preselect = document && diagnostic
            ? {
                fileName: path.basename(document.fileName),
                lineNumber: diagnostic.range.start.line + 1
            }
            : undefined;
        WriteOffMenuPanel_1.WriteOffMenuPanel.render(context.extensionUri, context, exports.env, newWO, storageManager, preselect);
    });
    const myIssuesCommand = vscode.commands.registerCommand(constants_2.CMD_MY_ISSUES, async () => {
        const { storageManager, myIssues } = await ensureInitialized();
        MyIssuesPanel_1.MyIssuesPanel.render(context.extensionUri, context, exports.env, myIssues, storageManager);
    });
    const settingsCommand = vscode.commands.registerCommand(constants_2.CMD_SETTINGS, async () => {
        const { storageManager } = await ensureInitialized();
        SettingsPanel_2.SettingsPanel.show(context.extensionUri, storageManager, context);
    });
    const applyChangesCommand = vscode.commands.registerCommand(constants_2.CMD_APPLY_CHANGES, async () => {
        const { storageManager, applyChangesButton, discardChangesButton } = await ensureInitialized();
        await (0, generateCodeFix_1.generateCodeFix)(storageManager, applyChangesButton, discardChangesButton, context);
    });
    const discardChangesCommand = vscode.commands.registerCommand(constants_2.CMD_DISCARD_CHANGES, async () => {
        const { storageManager, applyChangesButton, discardChangesButton } = await ensureInitialized();
        await (0, generateCodeFix_1.generateCodeFix)(storageManager, applyChangesButton, discardChangesButton, context, true);
    });
    const deleteLCHistoryCommand = vscode.commands.registerCommand('quick-clouds.deleteLCHistory', async () => {
        const { storageManager } = await ensureInitialized();
        try {
            await storageManager.deleteAllData();
            exports.collection.clear();
            try {
                if (WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel && typeof WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel.refreshData === 'function') {
                    await WriteOffMenuPanel_1.WriteOffMenuPanel.currentPanel.refreshData();
                }
            }
            catch { }
            vscode.window.showInformationMessage('Quick Clouds: All issues cleared');
        }
        catch (error) {
            logger.error('Failed to delete data', error);
            vscode.window.showErrorMessage('Quick Clouds: Failed to delete data');
        }
    });
    const showLogsCommand = vscode.commands.registerCommand('quick-clouds.showLogs', () => {
        logger_2.QuickCloudsLogger.getInstance().show();
    });
    // Uri handler: activates on vscode:// callback and lazy-inits before handling
    const disposableUriHandler = vscode.window.registerUriHandler({
        handleUri: async (uri) => {
            const { storageManager } = await ensureInitialized();
            await (0, uriHandler_1.uriHandler)(uri, storageManager, context);
        }
    });
    context.subscriptions.push(validateAPIKeyCommand, liveCheckCommand, writeOffCommand, myIssuesCommand, settingsCommand, applyChangesCommand, discardChangesCommand, deleteLCHistoryCommand, showLogsCommand, disposableUriHandler);
    logger.info(`Quick Clouds: activate() completed (commands ready) in ${Date.now() - activateStart} ms`);
}
function deactivate() {
    // Clean up resources if needed
}
//# sourceMappingURL=extension.js.map