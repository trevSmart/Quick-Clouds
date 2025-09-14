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
        this._panel = vscode.window.createWebviewPanel('qualitycloudsSettings', 'Quick Clouds Settings', column, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.joinPath(extensionUri, 'resources')
            ]
        });
        this._panel.webview.html = this._getHtmlForWebview();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (message && message.command === 'webviewError') {
                try {
                    const src = message && message.source ? ` (${message.source})` : '';
                    const msg = message && message.message ? String(message.message) : 'Unknown webview error';
                    const stack = message && message.stack ? `\nStack: ${String(message.stack)}` : '';
                    const { QuickCloudsLogger } = require('../utilities/logger');
                    QuickCloudsLogger.getInstance().error(`Webview error in SettingsPanel${src}: ${msg}${stack}`);
                } catch(_) {}
                return;
            }
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
                    yield vscode.commands.executeCommand('quick-clouds.login');
                    const postLoginAuthStatus = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(this.storageManager);
                    this._panel.webview.postMessage({ command: "authStatus", data: postLoginAuthStatus });
                    return;
                case 'gatherProjects':
                    vscode.commands.executeCommand('quick-clouds.gatherProjects');
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
                    yield vscode.commands.executeCommand('quick-clouds.validateAPIKey', apikey); // pass apiKey as argument
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
        const codiconCss = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'codicon.css'));
        const resetCss = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const vscodeCss = this._panel.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const csp = `default-src 'none'; img-src ${this._panel.webview.cspSource} data:; style-src ${this._panel.webview.cspSource} 'unsafe-inline'; script-src ${this._panel.webview.cspSource}; font-src ${this._panel.webview.cspSource};`;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="${resetCss}">
          <link rel="stylesheet" href="${vscodeCss}">
          <link rel="stylesheet" href="${codiconCss}">
          <title>Quick Clouds Settings</title>
          <style>
            body { padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
            h1 { margin: 0 0 12px; font-size: 20px; }
            .section { border: 1px solid var(--vscode-panel-border); background: var(--vscode-panel-background); border-radius: 6px; padding: 12px; margin: 12px 0; }
            .row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
            label { color: var(--vscode-descriptionForeground); min-width: 160px; display: inline-block; }
            input, select { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); color: var(--vscode-input-foreground); padding: 6px 8px; border-radius: 4px; }
            button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 6px 10px; border-radius: 4px; cursor: pointer; }
            button:hover { background: var(--vscode-button-hoverBackground); }
            .muted { color: var(--vscode-descriptionForeground); }
          </style>
        </head>
        <body>
          <h1>Quick Clouds Settings</h1>

          <div class="section" id="authSection">
            <div class="row"><label>Auth method</label>
              <select id="authMethod">
                <option value="oauth">OAuth</option>
                <option value="apiKey">API Key</option>
                <option value="credentials">Credentials</option>
              </select>
              <button id="btnLogin">Login</button>
              <button id="btnDisconnect">Disconnect</button>
            </div>
            <div class="row"><label>Status</label> <span id="authStatus" class="muted">Unknown</span></div>
          </div>

          <div class="section" id="projectSection">
            <div class="row">
              <label>Project</label>
              <select id="projectSelect"><option value="">Select a project…</option></select>
              <button id="btnGather">Gather Projects</button>
            </div>
          </div>

          <div class="section" id="apiSection">
            <div class="row"><label>API key</label>
              <input id="apiKey" type="password" placeholder="Enter API key" />
              <button id="btnSetKey">Set</button>
              <button id="btnValidateKey">Validate</button>
            </div>
            <div class="row"><label>API key status</label> <span id="apiKeyStatus" class="muted">Unknown</span></div>
          </div>

          <div class="section" id="optionsSection">
            <div class="row">
              <label for="onlyBlockers">Only blocker issues</label>
              <input id="onlyBlockers" type="checkbox" />
            </div>
          </div>

          <script>
            const vscode = acquireVsCodeApi();
            let projectsCache = [];
            const qs = (id) => document.getElementById(id);

            function setAuthStatus(data) {
              try {
                const authType = (data && data.authType) || 'unknown';
                const isAuth = !!(data && data.isAuthenticated);
                qs('authStatus').textContent = authType + ' | ' + (isAuth ? 'Authenticated' : 'Not authenticated');
                const sel = qs('authMethod');
                if (sel && authType) { sel.value = authType; }
              } catch (e) {}
            }

            window.addEventListener('message', (event) => {
              const msg = event.data || {};
              switch (msg.command) {
                case 'showSettings':
                  // no-op; UI is always visible
                  break;
                case 'authStatus':
                  setAuthStatus(msg.data);
                  break;
                case 'showProjects':
                  projectsCache = Array.isArray(msg.data) ? msg.data : [];
                  const sel = qs('projectSelect');
                  sel.innerHTML = '<option value="">Select a project…</option>' + projectsCache.map((p, i) => {
                    const name = (p && p.attributes && (p.attributes['project-name'] || p.attributes['name'])) || ('Project #' + (i+1));
                    return '<option value="' + i + '">' + name + '</option>';
                  }).join('');
                  break;
                case 'showSelectedProject':
                  try {
                    const p = msg.data;
                    if (!p) { qs('projectSelect').value = ''; break; }
                    const idx = projectsCache.findIndex(x => String(x && x.id) === String(p && p.id));
                    if (idx >= 0) { qs('projectSelect').value = String(idx); }
                  } catch (e) {}
                  break;
                case 'apiKeyStatus':
                  qs('apiKeyStatus').textContent = String(msg.data || 'Unknown');
                  break;
                case 'OnlyBlockerIssuesSet':
                  qs('onlyBlockers').checked = !!msg.data;
                  break;
                case 'apiKeySet':
                  qs('apiKey').value = msg.data || '';
                  break;
              }
            });

            // Wire UI actions
            qs('btnLogin').addEventListener('click', () => vscode.postMessage({ command: 'startLogin' }));
            qs('btnDisconnect').addEventListener('click', () => vscode.postMessage({ command: 'disconnect' }));
            qs('btnGather').addEventListener('click', () => vscode.postMessage({ command: 'gatherProjects' }));
            qs('authMethod').addEventListener('change', (e) => vscode.postMessage({ command: 'setAuthMethod', value: e.target.value }));
            qs('projectSelect').addEventListener('change', (e) => {
              const idx = Number(e.target.value);
              if (!isNaN(idx) && projectsCache[idx]) {
                vscode.postMessage({ command: 'selectedProject', value: projectsCache[idx] });
              }
            });
            qs('onlyBlockers').addEventListener('change', (e) => vscode.postMessage({ command: 'setOnlyBlockerIssues', value: !!e.target.checked }));
            qs('btnSetKey').addEventListener('click', () => vscode.postMessage({ command: 'setApiKey', value: qs('apiKey').value || '' }));
            qs('btnValidateKey').addEventListener('click', () => vscode.postMessage({ command: 'validateApiKey', value: qs('apiKey').value || '' }));

            // Ask extension to populate initial state
            vscode.postMessage({ command: 'webviewLoaded' });
          </script>
        </body>
        </html>`;
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
