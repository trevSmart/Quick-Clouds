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
exports.WriteOffMenuPanel = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const RequestWriteOff_1 = require("../services/RequestWriteOff");
const getUri_1 = require("../utilities/getUri");
const logger_1 = require("../utilities/logger");
/**
 * This class manages the state and behavior of WriteOffMenuPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering WriteOffMenuPanel webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
class WriteOffMenuPanel {
    /**
     * The WriteOffMenuPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    constructor(panel, extensionUri, env, button, storageManager, context, preselectIssue) {
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('WriteOffMenuPanel: Constructor called');
        this._disposables = [];
        this._panel = panel;
        this._button = button;
        this._storageManager = storageManager;
        this.context = context;
        this._preselectIssue = preselectIssue;
        logger.info('WriteOffMenuPanel: Panel properties set');
        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        logger.info('WriteOffMenuPanel: Disposal listener set');
        // Set the HTML content for the webview panel
        logger.info('WriteOffMenuPanel: Setting webview HTML content');
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        logger.info('WriteOffMenuPanel: HTML content set successfully');
        // Set an event listener to listen for messages passed from the webview context
        logger.info('WriteOffMenuPanel: Setting up message listener');
        this._setWebviewMessageListener(this._panel.webview, env, button);
        logger.info('WriteOffMenuPanel: Message listener set up successfully');
    }
    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    static render(extensionUri, context, env, button, storageManager, preselectIssue) {
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('WriteOffMenuPanel: Render method called');
        if (WriteOffMenuPanel.currentPanel) {
            logger.info('WriteOffMenuPanel: Existing panel found, revealing it');
            // If the webview panel already exists reveal it
            WriteOffMenuPanel.currentPanel._panel.reveal(vscode_1.ViewColumn.One);
        }
        else {
            logger.info('WriteOffMenuPanel: Creating new panel');
            // If a webview panel does not already exist create and show a new one
            const panel = vscode_1.window.createWebviewPanel(
            // Panel view type
            "showWriteOffMenu", 
            // Panel title
            "Write-off menu", 
            // The editor column the panel should be displayed in
            vscode_1.ViewColumn.One, 
            // Extra panel configurations
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict local resources to the webview build folder and media/resources
                localResourceRoots: [
                    vscode_1.Uri.joinPath(extensionUri, 'webview-ui', 'build'),
                    vscode_1.Uri.joinPath(extensionUri, 'media'),
                    vscode_1.Uri.joinPath(extensionUri, 'resources'),
                    vscode_1.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'codicons', 'dist')
                ],
            });
            logger.info('WriteOffMenuPanel: Panel created, initializing WriteOffMenuPanel');
            WriteOffMenuPanel.currentPanel = new WriteOffMenuPanel(panel, extensionUri, env, button, storageManager, context, preselectIssue);
            logger.info('WriteOffMenuPanel: Panel initialization completed');
        }
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
        WriteOffMenuPanel.currentPanel = undefined;
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
        this._preselectIssue = undefined;
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
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('WriteOffMenuPanel: Generating webview content from build/index.html');
        const fs = require('fs');
        const path = require('path');
        const buildDirFsPath = path.join(extensionUri.fsPath, 'webview-ui', 'build');
        const indexPath = path.join(buildDirFsPath, 'index.html');
        // Compute base directory URI for resolving assets when building absolute webview URIs
        const baseBuildUri = (0, getUri_1.getUri)(webview, extensionUri, ['webview-ui', 'build']);
        let indexHtml = '';
        try {
            indexHtml = fs.readFileSync(indexPath, 'utf8');
            logger.info('WriteOffMenuPanel: Loaded index.html successfully');
        }
        catch (err) {
            logger.error('WriteOffMenuPanel: Failed to read index.html: ' + (err === null || err === void 0 ? void 0 : err.message));
            // Fallback minimal HTML if index.html is missing
            return `<!DOCTYPE html><html><body><h3>QC2 Write-Off UI missing</h3><p>index.html not found under webview-ui/build.</p></body></html>`;
        }
        // Helper to convert an attribute value that points to a build asset into a webview URI
        const toWebviewUri = (rawPath) => {
            const clean = String(rawPath).replace(/^\.?\/?/, '');
            const parts = clean.split('/');
            return String((0, getUri_1.getUri)(webview, extensionUri, ['webview-ui', 'build', ...parts]));
        };
        // Replace href/src pointing to ./static/... , /static/... or static/... and /favicon.ico
        indexHtml = indexHtml
            .replace(/\b(href|src)=["'](?:\.\/|\/)?static\/[^"]+["']/g, (m) => {
            const valueMatch = m.match(/=["']([^"']+)["']/);
            if (!valueMatch) {
                return m;
            }
            const original = valueMatch[1];
            const uri = toWebviewUri(original.replace(/^\//, ''));
            return m.replace(original, uri);
        })
            .replace(/href="\/favicon\.ico"/g, () => {
            const favPath = path.join(buildDirFsPath, 'favicon.ico');
            if (fs.existsSync(favPath)) {
                const favUri = (0, getUri_1.getUri)(webview, extensionUri, ['webview-ui', 'build', 'favicon.ico']);
                return `href="${favUri}"`;
            }
            // Drop favicon reference if not packaged
            return 'href=""';
        });
        // Inject CSP and a bridge script to route window.alert to VS Code notifications.
        // Also include Codicons stylesheet from packaged resources.
        const bridgeUri = (0, getUri_1.getUri)(webview, extensionUri, ['media', 'webview-bridge.js']);
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; script-src ${webview.cspSource} 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; connect-src ${webview.cspSource}; frame-ancestors 'none'; base-uri 'self';">`;
        const codiconCssUri = (0, getUri_1.getUri)(webview, extensionUri, ['resources', 'codicon.css']);
        indexHtml = indexHtml.replace('<head>', `<head>${cspMeta}<link rel="stylesheet" href="${codiconCssUri}"><script src="${bridgeUri}"></script>`);
        // Log the resolved asset URIs for diagnostics
        try {
            // Use safer regex patterns to avoid ReDoS vulnerabilities
            // Limit input length and use more specific patterns
            if (indexHtml.length > 10000) {
                logger.warn('WriteOffMenuPanel: HTML content too large for regex processing, skipping URI extraction');
            }
            else {
                // Use non-greedy quantifiers and limit repetition to prevent ReDoS
                const jsMatch = indexHtml.match(/src="([^"]{0,100}static\/js\/[^"]{0,100})"/);
                const cssMatch = indexHtml.match(/href="([^"]{0,100}static\/css\/[^"]{0,100})"/);
                logger.info('WriteOffMenuPanel: Resolved JS URI: ' + (jsMatch ? jsMatch[1] : 'not found'));
                logger.info('WriteOffMenuPanel: Resolved CSS URI: ' + (cssMatch ? cssMatch[1] : 'not found'));
            }
        }
        catch (_) { }
        logger.info('WriteOffMenuPanel: HTML content generated successfully');
        logger.info('WriteOffMenuPanel: HTML length: ' + indexHtml.length + ' characters');
        return indexHtml;
    }
    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    _setWebviewMessageListener(webview, env, button) {
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('WriteOffMenuPanel: Setting up message listener');
        webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            logger.info('WriteOffMenuPanel: Received message: ' + JSON.stringify(message));
            const command = message.command;
            const data = message.data;
            if (command === 'notify') {
                vscode_1.window.showInformationMessage(String((message === null || message === void 0 ? void 0 : message.message) || (data === null || data === void 0 ? void 0 : data.message) || 'Notice'));
                return;
            }
            if (command === "webviewLoaded") {
                logger.info('WriteOffMenuPanel: Webview loaded message received');
                let issues = [];
                try {
                    const history = yield this._storageManager.getLivecheckHistory();
                    if (Array.isArray(history)) {
                        for (const entry of history) {
                            const path = require('path');
                            const fileName = entry.path ? path.basename(entry.path) : undefined;
                            for (const issue of entry.issues || []) {
                                issues.push(Object.assign(Object.assign({}, issue), { historyId: entry.id, historyPath: entry.path, fileName: issue.fileName || fileName }));
                            }
                        }
                    }
                }
                catch (e) {
                    logger.warn('WriteOffMenuPanel: getLivecheckHistory failed: ' + (e === null || e === void 0 ? void 0 : e.message));
                }
                logger.info('WriteOffMenuPanel: Total issues retrieved: ' + issues.length);
                const woData = { issues: issues };
                if (this._preselectIssue) {
                    woData.preselect = this._preselectIssue;
                }
                const responseData = { command: 'WOdata', data: JSON.stringify(woData) };
                logger.info('WriteOffMenuPanel: Sending WOdata response: ' + JSON.stringify(responseData));
                WriteOffMenuPanel.currentPanel._panel.webview.postMessage(responseData);
            }
            if (command === 'getTemplates') {
                try {
                    const templates = (yield this._storageManager.getUserData('WOtemplates')) || [];
                    WriteOffMenuPanel.currentPanel._panel.webview.postMessage({ command: 'templatesData', data: JSON.stringify(templates) });
                }
                catch (e) {
                    logger.warn('WriteOffMenuPanel: getTemplates failed: ' + (e === null || e === void 0 ? void 0 : e.message));
                    WriteOffMenuPanel.currentPanel._panel.webview.postMessage({ command: 'templatesData', data: JSON.stringify([]) });
                }
            }
            if (command === "writeoffRequest") {
                logger.info('WriteOffMenuPanel: Write-off request received');
                const debugMode = require('../utilities/debugMode');
                try {
                    if (debugMode && debugMode.DebugMode && debugMode.DebugMode.getInstance().isDebug()) {
                        vscode_1.window.showInformationMessage('[DEBUG] Write-off is simulated. No request is sent.');
                    }
                }
                catch (_) { }
                (0, RequestWriteOff_1.default)(data, env, this._storageManager, this.context);
                setTimeout(() => WriteOffMenuPanel.currentPanel.dispose(), 300);
                button.hide();
            }
            if (command === 'openFileAtLine') {
                try {
                    const lineNumber = Number((data === null || data === void 0 ? void 0 : data.lineNumber) || 1);
                    let targetPath = (data === null || data === void 0 ? void 0 : data.historyPath) || null;
                    const fileName = data === null || data === void 0 ? void 0 : data.fileName;
                    const historyId = data === null || data === void 0 ? void 0 : data.historyId;
                    if (!targetPath && historyId !== null && historyId !== undefined) {
                        try {
                            const history = yield this._storageManager.getLivecheckHistory();
                            if (Array.isArray(history)) {
                                const entry = history.find((h) => String((h === null || h === void 0 ? void 0 : h.id)) === String(historyId));
                                if (entry && entry.path) {
                                    targetPath = entry.path;
                                }
                            }
                        }
                        catch (e) {
                            logger.warn('WriteOffMenuPanel: getLivecheckHistory failed: ' + (e === null || e === void 0 ? void 0 : e.message));
                        }
                    }
                    if (!targetPath && fileName) {
                        try {
                            const matches = yield vscode.workspace.findFiles('**/' + fileName, '**/node_modules/**', 5);
                            if (matches && matches.length > 0) {
                                targetPath = matches[0].fsPath;
                            }
                        }
                        catch (_) { }
                    }
                    if (!targetPath) {
                        vscode.window.showWarningMessage('Quick Clouds: Could not resolve file path to open.');
                        return;
                    }
                    let opened = false;
                    try {
                        const docUri = vscode_1.Uri.file(targetPath);
                        yield vscode.workspace.openTextDocument(docUri);
                        yield vscode.commands.executeCommand('vscode.open', docUri, {
                            selection: new vscode_1.Range(new vscode_1.Position(Math.max(0, lineNumber - 1), 0), new vscode_1.Position(Math.max(0, lineNumber - 1), 0))
                        });
                        opened = true;
                    }
                    catch (_) { }
                    if (!opened && fileName) {
                        const matches2 = yield vscode.workspace.findFiles('**/' + fileName, '**/node_modules/**', 5);
                        if (matches2 && matches2.length) {
                            const docUri2 = matches2[0];
                            yield vscode.workspace.openTextDocument(docUri2);
                            yield vscode.commands.executeCommand('vscode.open', docUri2, {
                                selection: new vscode_1.Range(new vscode_1.Position(Math.max(0, lineNumber - 1), 0), new vscode_1.Position(Math.max(0, lineNumber - 1), 0))
                            });
                            opened = true;
                        }
                    }
                    if (!opened) {
                        vscode.window.showWarningMessage('Quick Clouds: Could not open the file in the editor.');
                    }
                }
                catch (e) {
                    logger.error('WriteOffMenuPanel: openFileAtLine failed: ' + (e === null || e === void 0 ? void 0 : e.message));
                }
                return;
            }
            if (command === "bulkWriteoffRequest") {
                try {
                    const debugMode = require('../utilities/debugMode');
                    if (debugMode && debugMode.DebugMode && debugMode.DebugMode.getInstance().isDebug()) {
                        vscode_1.window.showInformationMessage('[DEBUG] Bulk write-off is simulated. No requests are sent.');
                    }
                }
                catch (_) { }
            }
            if (command === "WriteOffCancel") {
                logger.info('WriteOffMenuPanel: Write-off cancel request received');
                vscode.window
                    .showWarningMessage("You are about to delete this request", "Continue", "Cancel")
                    .then(answer => {
                    if (answer === "Continue") {
                        (0, RequestWriteOff_1.default)(data, env, this._storageManager, this.context);
                    }
                });
            }
        }), undefined, this._disposables);
    }
    /**
     * Close all open WriteOffMenuPanel instances
     */
    static closeAll() {
        if (WriteOffMenuPanel.currentPanel) {
            WriteOffMenuPanel.currentPanel.dispose();
            WriteOffMenuPanel.currentPanel = undefined;
        }
    }
}
exports.WriteOffMenuPanel = WriteOffMenuPanel;
//# sourceMappingURL=WriteOffMenuPanel.js.map
