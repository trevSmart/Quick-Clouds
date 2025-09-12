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
exports.SettingsPanel = void 0;
const vscode = require("vscode");
const handleAuthenticationMethod_1 = require("../utilities/handleAuthenticationMethod");
const buttonLCSingleton_1 = require("../utilities/buttonLCSingleton");
const buttonQualityCenterSingleton_1 = require("../utilities/buttonQualityCenterSingleton");
class SettingsPanel {
    static show(extensionUri, storageManager, context) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel._panel.reveal(column);
        }
        else {
            SettingsPanel.currentPanel = new SettingsPanel(extensionUri, column || vscode.ViewColumn.One, storageManager, context);
        }
    }
    constructor(extensionUri, column, storageManager, context) {
        this._disposables = [];
        this.storageManager = storageManager;
        this._extensionUri = extensionUri;
        this.context = context;
        this._panel = vscode.window.createWebviewPanel('qualitycloudsSettings', 'Quality Clouds Settings', column, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media'), vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build')]
        });
        this._panel.webview.html = this._getHtmlForWebview();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            switch (message.command) {
                case 'webviewLoaded':
                    const currentAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(this.storageManager);
                    const currentSelectedProject = yield this.storageManager.getUserData('selectedProject');
                    const currentApiKeyStatus = yield this.storageManager.getUserData('apiKeyStatus');
                    const currentOnlyBlockerIssues = yield this.storageManager.getUserData('OnlyBlockerIssues');
                    const currentApiKey = yield this.storageManager.getUserData('apiKey');
                    this._panel.webview.postMessage({ command: "showSettings" });
                    this._panel.webview.postMessage({ command: "authStatus", data: currentAuthStatus });
                    this._panel.webview.postMessage({ command: "showSelectedProject", data: currentSelectedProject });
                    this._panel.webview.postMessage({ command: "apiKeyStatus", data: currentApiKeyStatus });
                    this._panel.webview.postMessage({ command: "OnlyBlockerIssuesSet", data: currentOnlyBlockerIssues });
                    if (currentApiKey) {
                        this._panel.webview.postMessage({ command: "apiKeySet", data: currentApiKey });
                    }
                    return;
                case 'startLogin':
                    yield vscode.commands.executeCommand('qc2.login');
                    const postLoginAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(this.storageManager);
                    this._panel.webview.postMessage({ command: "authStatus", data: postLoginAuthStatus });
                    return;
                case 'gatherProjects':
                    vscode.commands.executeCommand('qc2.gatherProjects');
                    const projects = yield this.storageManager.getUserData('projects');
                    this._panel.webview.postMessage({ command: "showProjects", data: projects });
                    return;
                case 'selectedProject':
                    const selectedProject = message.value;
                    yield this.storageManager.setUserData('selectedProject', selectedProject);
                    // Fetch rules for credentials users after project selection
                    const authType = yield this.storageManager.getUserData('authType');
                    if (authType === 'credentials' && ((_a = selectedProject === null || selectedProject === void 0 ? void 0 : selectedProject.attributes) === null || _a === void 0 ? void 0 : _a['main-instance-id'])) {
                        yield vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: 'Fetching Quality Clouds ruleset',
                            cancellable: false
                        }, () => __awaiter(this, void 0, void 0, function* () {
                            const getRules = (yield Promise.resolve().then(() => require('../services/GetRules'))).default;
                            yield getRules(this.storageManager, this.context, selectedProject.attributes['main-instance-id']);
                        }));
                    }
                    return;
                case 'setAuthMethod':
                    const authStatus = yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(this.storageManager, message.value, { isAuthenticated: false });
                    this._panel.webview.postMessage({ command: "authStatus", data: authStatus });
                    console.log('Auth method set to:', authStatus.authType);
                    yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(this.storageManager);
                    return;
                case 'validateApiKey':
                    const apikey = message.value;
                    yield this.storageManager.setUserData('apiKey', apikey);
                    yield vscode.commands.executeCommand('qc2.validateAPIKey', apikey); // pass apiKey as argument
                    const updatedApiKeyStatus = yield this.storageManager.getUserData('apiKeyStatus');
                    this._panel.webview.postMessage({ command: "apiKeyStatus", data: updatedApiKeyStatus });
                    const updatedAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(this.storageManager);
                    this._panel.webview.postMessage({ command: "authStatus", data: updatedAuthStatus });
                    yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(this.storageManager);
                    yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(this.storageManager);
                    return;
                case 'disconnect':
                    yield (0, handleAuthenticationMethod_1.clearAuthentication)(this.storageManager);
                    yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(this.storageManager);
                    yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(this.storageManager);
                    const clearedAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(this.storageManager);
                    this._panel.webview.postMessage({ command: "authStatus", data: clearedAuthStatus });
                    this._panel.webview.postMessage({ command: "apiKeyStatus", data: null });
                    this._panel.webview.postMessage({ command: "showSelectedProject", data: null });
                    return;
                case 'setOnlyBlockerIssues':
                    const OnlyBlockerIssues = message.value;
                    yield this.storageManager.setUserData('OnlyBlockerIssues', OnlyBlockerIssues);
                    this._panel.webview.postMessage({ command: "OnlyBlockerIssuesSet", data: OnlyBlockerIssues });
                    return;
                case 'setApiKey':
                    const apiKey = message.value;
                    yield this.storageManager.setUserData('apiKey', apiKey);
                    this._panel.webview.postMessage({ command: "apiKeySet", data: apiKey });
                default:
            }
        }), undefined, this._disposables);
    }
    dispose() {
        SettingsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _getHtmlForWebview() {
        // Point to your React build output (adjust as needed)
        const scriptUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'static', 'js', 'main.js'));
        const styleUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'static', 'css', 'main.css'));
        const indexHtmlUri = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'build', 'index.html'));
        // Basic HTML template for React
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource} 'unsafe-inline'; script-src ${this._panel.webview.cspSource}; img-src ${this._panel.webview.cspSource} data:; connect-src *;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" type="text/css" href="${styleUri}">
                <title>Quality Clouds Settings</title>
            </head>
            <body>
                <div id="root"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
    // Call this after login to update the webview with the latest state
    static notifyAuthChanged(storageManager) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SettingsPanel.currentPanel) {
                const currentAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(storageManager);
                const currentSelectedProject = yield storageManager.getUserData('selectedProject');
                const currentApiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
                SettingsPanel.currentPanel._panel.webview.postMessage({ command: "authStatus", data: currentAuthStatus });
                SettingsPanel.currentPanel._panel.webview.postMessage({ command: "showSelectedProject", data: currentSelectedProject });
                SettingsPanel.currentPanel._panel.webview.postMessage({ command: "apiKeyStatus", data: currentApiKeyStatus });
            }
        });
    }
    /**
     * Close all open SettingsPanel instances
     */
    static closeAll() {
        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel.dispose();
            SettingsPanel.currentPanel = undefined;
        }
    }
}
exports.SettingsPanel = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map