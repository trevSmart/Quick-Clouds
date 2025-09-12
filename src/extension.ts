"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.collection = exports.env = void 0;
const vscode = require("vscode");
const env_1 = require("./env");
const WriteOffMenuPanel_1 = require("./panels/WriteOffMenuPanel");
const MyIssuesPanel_1 = require("./panels/MyIssuesPanel");
const SettingsPanel_1 = require("./panels/SettingsPanel");
const executeLiveCheck_1 = require("./utilities/executeLiveCheck");
const generateCodeFix_1 = require("./utilities/generateCodeFix");
const validateApiKey_1 = require("./utilities/validateApiKey");
const initializeExtension_1 = require("./utilities/initializeExtension");
const createStatusBarItems_1 = require("./utilities/createStatusBarItems");
const OauthAuthentication_1 = require("./services/OauthAuthentication");
const uriHandler_1 = require("./utilities/uriHandler");
const GetToken_1 = require("./services/GetToken");
const GetProjects_1 = require("./services/GetProjects");
const buttonLCSingleton_1 = require("./utilities/buttonLCSingleton");
const buttonQualityCenterSingleton_1 = require("./utilities/buttonQualityCenterSingleton");
const constants_1 = require("./constants");
const logger_1 = require("./utilities/logger");
exports.env = env_1.Env.PROD;
exports.collection = vscode.languages.createDiagnosticCollection('Quality Clouds');
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = logger_1.QC2Logger.getInstance();
        logger.info('QC2 Extension activated');

        try {
            const { apiKeyStatus, storageManager, authType, isAuthenticated } = yield (0, initializeExtension_1.initializeExtension)(context);
        const buttonLC = (0, buttonLCSingleton_1.getButtonLCInstance)();
        yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
        yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager); // Ensure Quality Center button is updated on activation
        // Update LiveCheck button visibility when the active editor changes
        vscode.window.onDidChangeActiveTextEditor(() => {
            (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
        });
        const { newWO, myIssues, applyChangesButton, discardChangesButton } = (0, createStatusBarItems_1.createStatusBarItems)(apiKeyStatus, authType, isAuthenticated, storageManager);
        const validateAPIKeyCommand = vscode.commands.registerCommand(constants_1.CMD_VALIDATE_APIKEY, (apiKeyFromWebview) => __awaiter(this, void 0, void 0, function* () {
            yield (0, validateApiKey_1.validateApiKey)(storageManager, buttonLC, context, apiKeyFromWebview);
        }));
        function ensureEnvironmentReady(storageManager) {
            return __awaiter(this, void 0, void 0, function* () {
                return !!(yield storageManager.getUserData('environmentReady'));
            });
        }
        const runLivecheckCommand = vscode.commands.registerCommand(constants_1.CMD_LIVECHECK, () => __awaiter(this, void 0, void 0, function* () {
            logger.info('LiveCheck command triggered');
            try {
                if (!(yield ensureEnvironmentReady(storageManager))) {
                    logger.warn('Environment not ready for LiveCheck');
                    vscode.window.showWarningMessage('Quality Clouds environment is not ready. Please login and wait for environment to load.');
                    return;
                }
                yield (0, executeLiveCheck_1.executeLiveCheck)(context, newWO, storageManager);
                logger.info('LiveCheck completed successfully');
            } catch (error) {
                logger.error('LiveCheck failed', error);
                vscode.window.showErrorMessage('LiveCheck failed. Check QC2 output channel for details.');
            }
        }));
        const showWriteOffMenuPanel = vscode.commands.registerCommand(constants_1.CMD_WRITE_OFF, () => {
            ensureEnvironmentReady(storageManager).then(ready => {
                if (ready) {
                    WriteOffMenuPanel_1.WriteOffMenuPanel.render(context.extensionUri, context, exports.env, newWO, storageManager);
                }
                else {
                    vscode.window.showWarningMessage('Quality Clouds environment is not ready. Please login and wait for environment to load.');
                }
            });
        });
        const showMyIssuesPanel = vscode.commands.registerCommand(constants_1.CMD_MY_ISSUES, () => {
            logger.info('Quality Center (MyIssues) command triggered');
            ensureEnvironmentReady(storageManager).then(ready => {
                if (ready) {
                    logger.info('Opening Quality Center panel');
                    try {
                        MyIssuesPanel_1.MyIssuesPanel.render(context.extensionUri, context, exports.env, myIssues, storageManager);
                        logger.info('Quality Center panel opened successfully');
                    } catch (error) {
                        logger.error('Failed to open Quality Center panel', error);
                        vscode.window.showErrorMessage('Failed to open Quality Center. Check QC2 output channel for details.');
                    }
                }
                else {
                    logger.warn('Environment not ready for Quality Center');
                    vscode.window.showWarningMessage('Quality Clouds environment is not ready. Please login and wait for environment to load.');
                }
            }).catch(error => {
                logger.error('Quality Center command failed', error);
                vscode.window.showErrorMessage('Quality Center failed. Check QC2 output channel for details.');
            });
        });
        const loginCommand = vscode.commands.registerCommand('qc2.login', () => __awaiter(this, void 0, void 0, function* () {
            yield (0, OauthAuthentication_1.oauthAuthentication)(context);
        }));
        const gatherProjectsCommand = vscode.commands.registerCommand('qc2.gatherProjects', () => __awaiter(this, void 0, void 0, function* () {
            logger.info('Gather projects command triggered');
            try {
                yield (0, GetProjects_1.getProjects)(exports.env, storageManager, context);
                logger.info('Projects gathered successfully');
            }
            catch (err) {
                logger.error('Failed to gather projects', err);
            }
        }));
        const getTokenCommand = vscode.commands.registerCommand('qc2.getToken', () => __awaiter(this, void 0, void 0, function* () {
            logger.info('Get token command triggered');
            try {
                yield (0, GetToken_1.getToken)(context, exports.env, storageManager);
                logger.info('Token retrieved successfully');
            }
            catch (err) {
                logger.error('Failed to get tokens', err);
            }
        }));
        const codeActionCoPilot = vscode.commands.registerCommand('qc2.getAISuggestion', (document, diagnostic) => __awaiter(this, void 0, void 0, function* () {
            yield (0, generateCodeFix_1.generateCodeFix)(document, diagnostic, storageManager, applyChangesButton, discardChangesButton, buttonLC, newWO, myIssues, exports.env, context);
        }));
        const showSettingsPanelCommand = vscode.commands.registerCommand(constants_1.CMD_SETTINGS, () => {
            SettingsPanel_1.SettingsPanel.show(context.extensionUri, storageManager, context);
        });
        const showLogsCommand = vscode.commands.registerCommand('qc2.showLogs', () => {
            logger.info('Show logs command triggered');
            logger.show();
        });
        const uriHandler = new uriHandler_1.QualityCloudsUriHandler(context);
        context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
        context.subscriptions.push(showWriteOffMenuPanel, showMyIssuesPanel, codeActionCoPilot, validateAPIKeyCommand, runLivecheckCommand, loginCommand, getTokenCommand, showSettingsPanelCommand, gatherProjectsCommand, showLogsCommand);

        logger.info('QC2 Extension initialization completed successfully');
        } catch (error) {
            logger.error('Failed to initialize QC2 Extension', error);
            throw error;
        }
    });
}
exports.activate = activate;
function deactivate() {
    const logger = logger_1.QC2Logger.getInstance();
    logger.info('QC2 Extension deactivated - closing all open views');

    try {
        // Close all QC2 webview panels
        MyIssuesPanel_1.MyIssuesPanel.closeAll();
        WriteOffMenuPanel_1.WriteOffMenuPanel.closeAll();
        SettingsPanel_1.SettingsPanel.closeAll();

        logger.info('All QC2 views closed successfully');
    } catch (error) {
        logger.error('Error closing QC2 views during deactivation', error);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map