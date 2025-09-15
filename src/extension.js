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
import { CMD_VALIDATE_APIKEY, CMD_SCAN, CMD_WRITE_OFF, CMD_MY_ISSUES, CMD_SETTINGS, CMD_APPLY_CHANGES, CMD_DISCARD_CHANGES } from './constants';
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
        if (initPromise) {return initPromise;}
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

            // Helper: update My issues button background based on unapproved severities
            const refreshMyIssuesButtonSeverity = async () => {
                try {
                    const logger = QuickCloudsLogger.getInstance();
                    logger.info('MyIssuesButton: Checking for unapproved HIGH/MEDIUM issues...');

                    // Only style the "My issues" button (not Quality Center)
                    const history = await storageManager.getLivecheckHistory();
                    let statusMap = {};
                    try {
                        statusMap = (await storageManager.getWriteOffStatusMap()) || {};
                    } catch { /* ignore */ }

                    let hasUnapprovedHigh = false;
                    let hasUnapprovedMedium = false;
                    let totalIssues = 0;
                    let unapprovedCount = 0;
                    let highCount = 0;
                    let mediumCount = 0;

                    for (const entry of Array.isArray(history) ? history : []) {
                        for (const issue of entry.issues || []) {
                            totalIssues++;
                            const issueId = (issue && (issue.id || issue.uuid)) ? String(issue.id || issue.uuid) : undefined;
                            const localStatus = issueId ? statusMap[issueId] : undefined;
                            const serverApproved = issue?.writeOff?.writeOffStatus === 'APPROVED';
                            const isApproved = localStatus === 'approved' || serverApproved === true;

                            if (!isApproved) {
                                unapprovedCount++;
                                const sev = (issue?.severity || '').toUpperCase();
                                if (sev === 'HIGH') {
                                    hasUnapprovedHigh = true;
                                    highCount++;
                                }
                                else if (sev === 'MEDIUM') {
                                    hasUnapprovedMedium = true;
                                    mediumCount++;
                                }
                            }

                            if (hasUnapprovedHigh) { break; }
                        }
                        if (hasUnapprovedHigh) { break; }
                    }

                    logger.info(`MyIssuesButton: Analysis complete - Total issues: ${totalIssues}, Unapproved: ${unapprovedCount}, HIGH: ${highCount}, MEDIUM: ${mediumCount}`);

                    if (hasUnapprovedHigh) {
                        newWO.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                        newWO.tooltip = 'Unapproved HIGH issues present';
                        logger.info('MyIssuesButton: Setting ERROR background (unapproved HIGH issues detected)');
                    } else if (hasUnapprovedMedium) {
                        newWO.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                        newWO.tooltip = 'Unapproved MEDIUM issues present';
                        logger.info('MyIssuesButton: Setting WARNING background (unapproved MEDIUM issues detected)');
                    } else {
                        newWO.backgroundColor = undefined;
                        newWO.tooltip = undefined;
                        logger.info('MyIssuesButton: Setting DEFAULT background (no unapproved HIGH/MEDIUM issues)');
                    }
                } catch (error) {
                    const logger = QuickCloudsLogger.getInstance();
                    logger.error('MyIssuesButton: Failed to update button severity:', error);
                }
            };

            // Initial refresh
            const logger = QuickCloudsLogger.getInstance();
            logger.info('MyIssuesButton: Performing initial button style check');
            await refreshMyIssuesButtonSeverity();

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

            // Expose refresher for other modules if ever needed
            (context as any).refreshMyIssuesButtonSeverity = refreshMyIssuesButtonSeverity;

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

    const liveCheckCommand = vscode.commands.registerCommand(CMD_SCAN, async () => {
        const { storageManager, newWO } = await ensureInitialized();
        await executeLiveCheck(context, newWO, storageManager);
        // Update My issues button style after scan
        const refresher = (context as any).refreshMyIssuesButtonSeverity;
        if (typeof refresher === 'function') {
            const logger = QuickCloudsLogger.getInstance();
            logger.info('MyIssuesButton: Refreshing button style after scan completion');
            await refresher();
        }
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
            // Refresh My issues button style after clearing
            const refresher = (context as any).refreshMyIssuesButtonSeverity;
            if (typeof refresher === 'function') {
                const logger = QuickCloudsLogger.getInstance();
                logger.info('MyIssuesButton: Refreshing button style after clearing all data');
                await refresher();
            }
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


    // Initialize on activation so status bar items appear without invoking a command
    ensureInitialized().catch((err) => {
        logger.error('Quick Clouds: initialization failed', err);
    });

    logger.info(`Quick Clouds: activate() completed (commands ready) in ${Date.now() - activateStart} ms`);
}

export function deactivate() {
    // Clean up resources if needed
}
