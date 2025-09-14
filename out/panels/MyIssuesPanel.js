"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyIssuesPanel = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const getUri_1 = require("../utilities/getUri");
const path = require("path");
const docs = require("../services/GetDocumentsInfo");
const logger_1 = require("../utilities/logger");
/**
 * This class manages the state and behavior of MyIssuesPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering MyIssuesPanel webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
class MyIssuesPanel {
    /**
     * The MyIssuesPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    constructor(panel, extensionUri, context, env, button, storageManager) {
        this._disposables = [];
        this._panel = panel;
        this._button = button;
        this._storageManager = storageManager;
        this._logger = logger_1.QuickCloudsLogger.getInstance();
        this._logger.info('MyIssuesPanel constructor called');
        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
        this._logger.info('MyIssuesPanel initialized successfully');
    }
    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    static render(extensionUri, context, env, button, storageManager) {
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('MyIssuesPanel.render called');
        if (MyIssuesPanel.currentPanel) {
            // If the webview panel already exists reveal it
            logger.info('Revealing existing MyIssuesPanel');
            MyIssuesPanel.currentPanel._panel.reveal(vscode_1.ViewColumn.One);
        }
        else {
            // If a webview panel does not already exist create and show a new one
            logger.info('Creating new MyIssuesPanel');
            const panel = vscode_1.window.createWebviewPanel(
            // Panel view type
            "showMyIssues", 
            // Panel title
            "Quality Center", 
            // The editor column the panel should be displayed in
            vscode_1.ViewColumn.One, 
            // Extra panel configurations
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                localResourceRoots: [
                    vscode_1.Uri.joinPath(extensionUri, 'media'),
                    vscode_1.Uri.joinPath(extensionUri, 'resources')
                ]
            });
            MyIssuesPanel.currentPanel = new MyIssuesPanel(panel, extensionUri, context, env, button, storageManager);
            logger.info('New MyIssuesPanel created successfully');
        }
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
        MyIssuesPanel.currentPanel = undefined;
        this._button.hide();
        // Dispose of the current webview panel
        this._panel.dispose();
        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the React webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    _getWebviewContent(webview, extensionUri) {
        const codiconCss = (0, getUri_1.getUri)(webview, extensionUri, ['resources', 'codicon.css']);
        const resetCss = (0, getUri_1.getUri)(webview, extensionUri, ['media', 'reset.css']);
        const vscodeCss = (0, getUri_1.getUri)(webview, extensionUri, ['media', 'vscode.css']);
        const csp = `default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; font-src ${webview.cspSource};`;
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
          <link rel="stylesheet" href="${resetCss}">
          <link rel="stylesheet" href="${vscodeCss}">
          <link rel="stylesheet" href="${codiconCss}">
          <title>Quality Center</title>
          <style>
            body { padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
            h1 { margin: 0 0 12px; font-size: 20px; }
            .section { border: 1px solid var(--vscode-panel-border); background: var(--vscode-panel-background); border-radius: 6px; padding: 12px; margin: 12px 0; }
            .row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
            .muted { color: var(--vscode-descriptionForeground); }
            .list { max-height: 360px; overflow: auto; border: 1px solid var(--vscode-panel-border); border-radius: 6px; }
            .item { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border); }
            .item:last-child { border-bottom: none; }
            button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 6px 10px; border-radius: 4px; cursor: pointer; }
            button:hover { background: var(--vscode-button-hoverBackground); }
          </style>
        </head>
        <body>
          <h1>Quality Center</h1>
          <div class="section">
            <div class="row"><span class="muted">Selected folder:</span> <strong id="selFolder">Loading…</strong></div>
            <div class="row"><span class="muted">Date filter:</span> <span id="dateFilter" class="muted">None</span></div>
            <div class="row">
              <button id="btnPick">Select folder…</button>
            </div>
          </div>
          <div class="section">
            <div class="row"><strong>Livecheck history</strong> <span id="histCount" class="muted"></span></div>
            <div class="list" id="historyList"></div>
          </div>
          <div class="section">
            <div class="row"><strong>Detected Components</strong> <span id="ceCount" class="muted"></span></div>
            <div class="list" id="ceList"></div>
          </div>
          <script>
            const vscode = acquireVsCodeApi();
            const qs = (id) => document.getElementById(id);
            const elHist = qs('historyList');
            const elCE = qs('ceList');
            function renderHistory(hist) {
              const arr = Array.isArray(hist) ? hist : [];
              qs('histCount').textContent = '(' + arr.length + ')';
              elHist.innerHTML = arr.map((h) => {
                const path = h && h.path ? String(h.path) : '';
                const issues = (h && Array.isArray(h.issues)) ? h.issues.length : 0;
                return '<div class="item"><span>' + (path || '—') + '</span><span class="muted">' + issues + ' issues</span></div>';
              }).join('');
            }
            function renderDocs(docs) {
              const arr = Array.isArray(docs) ? docs : [];
              qs('ceCount').textContent = '(' + arr.length + ')';
              elCE.innerHTML = arr.slice(0, 200).map((d) => {
                const name = d && (d.name || d.file || d.cePath || 'Item');
                return '<div class="item"><span>' + name + '</span></div>';
              }).join('');
            }
            window.addEventListener('message', (event) => {
              const msg = event.data || {};
              if (msg.command === 'myIssues') {
                try { var data = JSON.parse(msg.data); } catch (_) { var data = {}; }
                qs('selFolder').textContent = data && data.selectedFolder ? data.selectedFolder : '—';
                renderHistory(data && data.LivecheckHistory);
                renderDocs(data && data.AllCEs);
              }
              if (msg.command === 'dateFilter') {
                try { var df = JSON.parse(msg.data); } catch (_) { var df = msg.data; }
                qs('dateFilter').textContent = df ? String(df) : 'None';
              }
            });
            qs('btnPick').addEventListener('click', () => vscode.postMessage({ command: 'openDirectoryPicker' }));
            vscode.postMessage({ command: 'webviewLoaded' });
          </script>
        </body>
      </html>`;
    }
    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            this._logger.info(`MyIssuesPanel received message: ${message.command}`);
            try {
                this._logger.info('Starting message handler processing...');
                this._logger.info('Getting livecheck history...');
                const issuesHistory = yield this._storageManager.getLivecheckHistory();
                this._logger.info(`Livecheck history retrieved: ${issuesHistory ? issuesHistory.length : 0} items`);
                this._logger.info('Getting workspace folders...');
                const workspaceFolders = vscode.workspace.workspaceFolders;
                this._logger.info(`Workspace folders: ${workspaceFolders ? workspaceFolders.length : 0} folders`);
                this._logger.info('Getting selected directory...');
                const selectedDirectory = yield this._storageManager.getUserData('selectedDirectory');
                this._logger.info(`Selected directory: ${selectedDirectory || 'none'}`);
                const directory = selectedDirectory ? selectedDirectory : (workspaceFolders && workspaceFolders[0].uri.fsPath);
                this._logger.info(`Final directory: ${directory}`);
                if (!directory) {
                    this._logger.error("No directory selected or available in workspace.");
                    return;
                }
                const command = message.command;
                if (command === 'webviewError') {
                    const src = message && message.source ? ` (${message.source})` : '';
                    const msg = message && message.message ? String(message.message) : 'Unknown webview error';
                    const stack = message && message.stack ? `\nStack: ${String(message.stack)}` : '';
                    this._logger.error(`Webview error in MyIssuesPanel${src}: ${msg}${stack}`);
                    return;
                }
                let myIssuesData;
                if (command === "webviewLoaded") {
                    this._logger.info('Processing webviewLoaded command');
                    this._logger.info('Getting issues history...');
                    this._logger.info(`Issues history retrieved: ${issuesHistory ? issuesHistory.length : 0} items`);
                    this._logger.info('Getting documents info...');
                    this._logger.info(`Calling docs.default.getDocumentsInfo with directory: ${directory.toString()}`);
                    const documentsInfo = docs.default.getDocumentsInfo(directory.toString());
                    this._logger.info(`Documents info retrieved: ${documentsInfo ? documentsInfo.length : 0} items`);
                    this._logger.info(`Documents info type: ${typeof documentsInfo}`);
                    this._logger.info('Getting best practices...');
                    const bestPractices = (yield this._storageManager.getUserData('bestPractices')) || [];
                    this._logger.info(`Best practices retrieved: ${bestPractices.length} items`);
                    this._logger.info('Getting QC Copilot status...');
                    const hasQCCopilot = (yield this._storageManager.getUserData('hasQCCopilot')) || false;
                    this._logger.info(`QC Copilot status: ${hasQCCopilot}`);
                    this._logger.info('Building myIssuesData object...');
                    myIssuesData = {
                        LivecheckHistory: issuesHistory || [],
                        AllCEs: documentsInfo,
                        selectedFolder: path.basename(directory.toString()),
                        bestPractices: bestPractices,
                        hasQCCopilot: hasQCCopilot
                    };
                    this._logger.info('myIssuesData object built successfully');
                    if (myIssuesData) {
                        this._logger.info('Sending myIssues message to webview...');
                        MyIssuesPanel.currentPanel._panel.webview.postMessage({ command: 'myIssues', data: JSON.stringify(myIssuesData) });
                        this._logger.info('myIssues message sent successfully');
                        this._logger.info('Getting date filter...');
                        const dateFilter = yield this._storageManager.getUserData('myDateFilter');
                        this._logger.info('Sending dateFilter message to webview...');
                        MyIssuesPanel.currentPanel._panel.webview.postMessage({ command: 'dateFilter', data: JSON.stringify(dateFilter) });
                        this._logger.info('dateFilter message sent successfully');
                    }
                }
                if (command === "openFileFromMyIssues") {
                    let workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : null;
                    if (workspacePath) {
                        vscode.commands.executeCommand('vscode.open', vscode_1.Uri.file(message.data));
                    }
                }
                if (command === "openURL") {
                    vscode.env.openExternal(vscode_1.Uri.parse(message.data));
                }
                if (command === "openDirectoryPicker") {
                    vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel: 'Select'
                    }).then((uri) => __awaiter(this, void 0, void 0, function* () {
                        if (uri) {
                            this._storageManager.setUserData('selectedDirectory', uri[0].fsPath);
                            myIssuesData = {
                                LivecheckHistory: issuesHistory || [],
                                AllCEs: docs.default.getDocumentsInfo(uri[0].fsPath),
                                selectedFolder: path.basename(uri[0].fsPath),
                                bestPractices: (yield this._storageManager.getUserData('bestPractices')) || [],
                                hasQCCopilot: (yield this._storageManager.getUserData('hasQCCopilot')) || false
                            };
                            if (myIssuesData) {
                                MyIssuesPanel.currentPanel._panel.webview.postMessage({ command: 'myIssues', data: JSON.stringify(myIssuesData) });
                                MyIssuesPanel.currentPanel._panel.webview.postMessage({ command: 'dateFilter', data: JSON.stringify(this._storageManager.getUserData('myDateFilter')) });
                            }
                        }
                    }));
                }
                if (command === "launchLiveCheck") {
                    let workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : null;
                    if (workspacePath) {
                        vscode.commands.executeCommand('vscode.open', vscode_1.Uri.file(message.data));
                        setTimeout(() => {
                            vscode.commands.executeCommand('qc2.check');
                        }, 200);
                    }
                }
                if (command === "requestSuggestion") {
                    const data = message.data;
                    const workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : null;
                    if (workspacePath) {
                        const documentUri = vscode_1.Uri.file(data.cePath);
                        yield vscode.workspace.openTextDocument(documentUri);
                        yield vscode.commands.executeCommand('vscode.open', documentUri);
                        yield vscode.commands.executeCommand('qc2.check');
                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            const diagnostics = vscode.languages.getDiagnostics(documentUri);
                            const diagnostic = diagnostics.find(d => d.range.start.line + 1 === data.lineNumber && d.message === data.issueType);
                            if (diagnostic) {
                                vscode.commands.executeCommand('qc2.getAISuggestion', yield vscode.workspace.openTextDocument(documentUri), diagnostic);
                            }
                            else {
                                vscode.window.showWarningMessage('Issue was not found in current element.');
                            }
                        }), 500);
                    }
                }
                if (command === "setMyDateFilter") {
                    this._storageManager.setUserData('myDateFilter', message.data);
                }
            }
            catch (error) {
                this._logger.error('Error in MyIssuesPanel message handler', error);
            }
        }), undefined, this._disposables);
    }
    /**
     * Close all open MyIssuesPanel instances
     */
    static closeAll() {
        if (MyIssuesPanel.currentPanel) {
            MyIssuesPanel.currentPanel.dispose();
            MyIssuesPanel.currentPanel = undefined;
        }
    }
}
exports.MyIssuesPanel = MyIssuesPanel;
//# sourceMappingURL=MyIssuesPanel.js.map
