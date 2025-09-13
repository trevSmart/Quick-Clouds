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
import { createStatusBarItems } from './utilities/createStatusBarItems';
import { OauthAuthentication } from './services/OauthAuthentication';
import { uriHandler } from './utilities/uriHandler';
import { GetToken } from './services/GetToken';
import { GetProjects } from './services/GetProjects';
import { getButtonLCInstance, updateButtonLCVisibility } from './utilities/buttonLCSingleton';
import { updateQualityCenterVisibility } from './utilities/buttonQualityCenterSingleton';
import { CMD_VALIDATE_APIKEY, CMD_LIVECHECK, CMD_WRITE_OFF, CMD_MY_ISSUES, CMD_SETTINGS, CMD_APPLY_CHANGES, CMD_DISCARD_CHANGES } from './constants';
import { QuickCloudsLogger } from './utilities/logger';

export const env = Env.PROD;
export const collection = vscode.languages.createDiagnosticCollection('Quick Clouds');

export async function activate(context: vscode.ExtensionContext) {
    const logger = QuickCloudsLogger.getInstance();
    logger.info('Quick Clouds Extension activated');

    try {
        const { apiKeyStatus, storageManager, authType, isAuthenticated } = await initializeExtension(context);

        const buttonLC = getButtonLCInstance();
        await updateButtonLCVisibility(storageManager);
        await updateQualityCenterVisibility(storageManager); // Ensure Quality Center button is updated on activation

        // Update LiveCheck button visibility when the active editor changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            updateButtonLCVisibility(storageManager);
        });

        const { newWO, myIssues, applyChangesButton, discardChangesButton } = createStatusBarItems(apiKeyStatus, authType, isAuthenticated, storageManager);

        const validateAPIKeyCommand = vscode.commands.registerCommand(CMD_VALIDATE_APIKEY, async (apiKeyFromWebview?: string) => {
            await validateApiKey(storageManager, buttonLC, context, apiKeyFromWebview);
        });

        const liveCheckCommand = vscode.commands.registerCommand(CMD_LIVECHECK, async () => {
            // Pass the write-off button and correct argument order
            await executeLiveCheck(context, newWO, storageManager);
        });

        const writeOffCommand = vscode.commands.registerCommand(
            CMD_WRITE_OFF,
            async (document?: vscode.TextDocument, diagnostic?: vscode.Diagnostic) => {
                const preselect = document && diagnostic
                    ? {
                        fileName: path.basename(document.fileName),
                        lineNumber: diagnostic.range.start.line + 1
                    }
                    : undefined;
                // Open Write-off panel using static render
                WriteOffMenuPanel.render(context.extensionUri, context, env, newWO, storageManager, preselect);
            }
        );

        const myIssuesCommand = vscode.commands.registerCommand(CMD_MY_ISSUES, async () => {
            // Open Quality Center using static render
            MyIssuesPanel.render(context.extensionUri, context, env, myIssues, storageManager);
        });

        const settingsCommand = vscode.commands.registerCommand(CMD_SETTINGS, async () => {
            // Open Settings using static show
            SettingsPanel.show(context.extensionUri, storageManager, context);
        });

        const applyChangesCommand = vscode.commands.registerCommand(CMD_APPLY_CHANGES, async () => {
            await generateCodeFix(storageManager, applyChangesButton, discardChangesButton, context);
        });

        const discardChangesCommand = vscode.commands.registerCommand(CMD_DISCARD_CHANGES, async () => {
            await generateCodeFix(storageManager, applyChangesButton, discardChangesButton, context, true);
        });

        const deleteLCHistoryCommand = vscode.commands.registerCommand('quick-clouds.deleteLCHistory', async () => {
            await storageManager.deleteAllData();
            vscode.window.showInformationMessage('All data has been deleted');
        });

        const showLogsCommand = vscode.commands.registerCommand('quick-clouds.showLogs', () => {
            const logger = QuickCloudsLogger.getInstance();
            logger.show();
        });

        // Register URI handler for OAuth callback
        const uriHandlerCommand = vscode.commands.registerCommand('quick-clouds.uriHandler', async (uri: vscode.Uri) => {
            await uriHandler(uri, storageManager, context);
        });

        // Register commands
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
            uriHandlerCommand
        );

        // Register URI handler
        context.subscriptions.push(vscode.window.registerUriHandler({
            handleUri: async (uri: vscode.Uri) => {
                await uriHandler(uri, storageManager, context);
            }
        }));

        logger.info('Quick Clouds Extension commands registered successfully');

    } catch (error) {
        const logger = QuickCloudsLogger.getInstance();
        logger.error('Error during Quick Clouds Extension activation', error);
        vscode.window.showErrorMessage('Failed to activate Quick Clouds Extension');
    }
}

export function deactivate() {
    // Clean up resources if needed
}
