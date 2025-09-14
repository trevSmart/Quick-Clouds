import * as vscode from 'vscode';
import * as path from 'path';
import { Env } from './env';
import { WriteOffMenuPanel } from './panels/WriteOffMenuPanel';
import { MyIssuesPanel } from './panels/MyIssuesPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { executeLiveCheck } from './utilities/executeLiveCheck';
import { generateCodeFix } from './utilities/generateCodeFix';
import { validateApiKey } from './utilities/validateApiKey';
import { initializeExtension } from './utilities/initializeExtension';
import { restoreDiagnosticsFromStorage } from './utilities/restoreDiagnostics';
import { createStatusBarItems } from './utilities/createStatusBarItems';
import { uriHandler } from './utilities/uriHandler';
import { getButtonLCInstance, updateButtonLCVisibility } from './utilities/buttonLCSingleton';
import { updateQualityCenterVisibility } from './utilities/buttonQualityCenterSingleton';
import { CMD_VALIDATE_APIKEY, CMD_LIVECHECK, CMD_WRITE_OFF, CMD_MY_ISSUES, CMD_SETTINGS, CMD_APPLY_CHANGES, CMD_DISCARD_CHANGES } from './constants';
import { QuickCloudsLogger } from './utilities/logger';
import { installGlobalErrorHandlers } from './utilities/globalErrorHandlers';

export const env = Env.PROD;
export const collection = vscode.languages.createDiagnosticCollection('Quick Clouds');

export async function activate(context: vscode.ExtensionContext) {
    const logger = QuickCloudsLogger.getInstance();
    const activateStart = Date.now();
    logger.info('Quick Clouds: activate() called');

    // Install global error handlers early so any failure gets logged
    installGlobalErrorHandlers(context);

    type InitResult = {
        storageManager: any;
        apiKeyStatus: any;
        authType: string;
        isAuthenticated: boolean;
        buttonLC: vscode.StatusBarItem;
        newWO: vscode.StatusBarItem;
        myIssues: vscode.StatusBarItem;
        applyChangesButton: vscode.StatusBarItem;
        discardChangesButton: vscode.StatusBarItem;
        loginButton: vscode.StatusBarItem;
    };

    let initPromise: Promise<InitResult> | undefined;

    async function ensureInitialized(): Promise<InitResult> {
        if (initPromise) return initPromise;
        initPromise = (async () => {
            const t0 = Date.now();
            const { apiKeyStatus, storageManager, authType, isAuthenticated } = await initializeExtension(context);

            const buttonLC = getButtonLCInstance();
            await updateButtonLCVisibility(storageManager);
            await updateQualityCenterVisibility(storageManager);

            // Update LiveCheck button visibility when the active editor changes
            vscode.window.onDidChangeActiveTextEditor(() => {
                updateButtonLCVisibility(storageManager);
            });

            const { newWO, myIssues, applyChangesButton, discardChangesButton, loginButton } = createStatusBarItems(
                apiKeyStatus,
                authType,
                isAuthenticated,
                storageManager
            );

            // React to configuration changes (status bar visibility, debug mode)
            const cfgListener = vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('QuickClouds.showSettingsButton')) {
                    const showSettingsButton = vscode.workspace.getConfiguration('QuickClouds').get('showSettingsButton', true);
                    showSettingsButton ? loginButton.show() : loginButton.hide();
                }
                if (e.affectsConfiguration('QuickClouds.showQualityCenterButton')) {
                    updateQualityCenterVisibility(storageManager);
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
                    await restoreDiagnosticsFromStorage(context, storageManager);
                } catch {
                    logger.warn('Diagnostics restore deferred task failed');
                }
            }, 0);

            logger.info(`Quick Clouds: initialization completed in ${Date.now() - t0} ms`);
            return { storageManager, apiKeyStatus, authType, isAuthenticated, buttonLC, newWO, myIssues, applyChangesButton, discardChangesButton, loginButton };
        })();
        return initPromise;
    }

    // Register commands immediately; they will lazy-initialize on first use.
    const validateAPIKeyCommand = vscode.commands.registerCommand(CMD_VALIDATE_APIKEY, async (apiKeyFromWebview?: string) => {
        const { storageManager, buttonLC } = await ensureInitialized();
        await validateApiKey(storageManager, buttonLC, context, apiKeyFromWebview);
    });

    const liveCheckCommand = vscode.commands.registerCommand(CMD_LIVECHECK, async () => {
        const { storageManager, newWO } = await ensureInitialized();
        await executeLiveCheck(context, newWO, storageManager);
    });

    const writeOffCommand = vscode.commands.registerCommand(
        CMD_WRITE_OFF,
        async (document?: vscode.TextDocument, diagnostic?: vscode.Diagnostic) => {
            const { storageManager, newWO } = await ensureInitialized();
            const preselect = document && diagnostic
                ? {
                    fileName: path.basename(document.fileName),
                    lineNumber: diagnostic.range.start.line + 1
                }
                : undefined;
            WriteOffMenuPanel.render(context.extensionUri, context, env, newWO, storageManager, preselect);
        }
    );

    const myIssuesCommand = vscode.commands.registerCommand(CMD_MY_ISSUES, async () => {
        const { storageManager, myIssues } = await ensureInitialized();
        MyIssuesPanel.render(context.extensionUri, context, env, myIssues, storageManager);
    });

    const settingsCommand = vscode.commands.registerCommand(CMD_SETTINGS, async () => {
        const { storageManager } = await ensureInitialized();
        SettingsPanel.show(context.extensionUri, storageManager, context);
    });

    const applyChangesCommand = vscode.commands.registerCommand(CMD_APPLY_CHANGES, async () => {
        const { storageManager, applyChangesButton, discardChangesButton } = await ensureInitialized();
        await generateCodeFix(storageManager, applyChangesButton, discardChangesButton, context);
    });

    const discardChangesCommand = vscode.commands.registerCommand(CMD_DISCARD_CHANGES, async () => {
        const { storageManager, applyChangesButton, discardChangesButton } = await ensureInitialized();
        await generateCodeFix(storageManager, applyChangesButton, discardChangesButton, context, true);
    });

    const deleteLCHistoryCommand = vscode.commands.registerCommand('quick-clouds.deleteLCHistory', async () => {
        const { storageManager } = await ensureInitialized();
        try {
            await storageManager.deleteAllData();
            collection.clear();
            try {
                if (WriteOffMenuPanel.currentPanel && typeof (WriteOffMenuPanel.currentPanel as any).refreshData === 'function') {
                    await (WriteOffMenuPanel.currentPanel as any).refreshData();
                }
            } catch { }
            vscode.window.showInformationMessage('Quick Clouds: All issues cleared');
        } catch (error) {
            logger.error('Failed to delete data', error);
            vscode.window.showErrorMessage('Quick Clouds: Failed to delete data');
        }
    });

    const showLogsCommand = vscode.commands.registerCommand('quick-clouds.showLogs', () => {
        QuickCloudsLogger.getInstance().show();
    });

    // Uri handler: activates on vscode:// callback and lazy-inits before handling
    const disposableUriHandler = vscode.window.registerUriHandler({
        handleUri: async (uri: vscode.Uri) => {
            const { storageManager } = await ensureInitialized();
            await uriHandler(uri, storageManager, context);
        }
    });

    context.subscriptions.push(
        validateAPIKeyCommand,
        liveCheckCommand,
        writeOffCommand,
        myIssuesCommand,
        settingsCommand,
        applyChangesCommand,
        discardChangesCommand,
        deleteLCHistoryCommand,
        showLogsCommand,
        disposableUriHandler
    );

    logger.info(`Quick Clouds: activate() completed (commands ready) in ${Date.now() - activateStart} ms`);
}

export function deactivate() {
    // Clean up resources if needed
}
