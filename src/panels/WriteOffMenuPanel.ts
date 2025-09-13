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
    constructor(panel, extensionUri, env, button, storageManager, context) {
        const logger = logger_1.QuickCloudsLogger.getInstance();
        logger.info('WriteOffMenuPanel: Constructor called');

        this._disposables = [];
        this._panel = panel;
        this._button = button;
        this._storageManager = storageManager;
        this.context = context;

        logger.info('WriteOffMenuPanel: Panel properties set');

        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(this.dispose, null, this._disposables);
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
    static render(extensionUri, context, env, button, storageManager) {
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
                // Restrict local resources to the webview build folder and media
                localResourceRoots: [
                    vscode_1.Uri.joinPath(extensionUri, 'webview-ui', 'build'),
                    vscode_1.Uri.joinPath(extensionUri, 'media')
                ],
            });
            logger.info('WriteOffMenuPanel: Panel created, initializing WriteOffMenuPanel');
            WriteOffMenuPanel.currentPanel = new WriteOffMenuPanel(panel, extensionUri, env, button, storageManager, context);
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

        // Compute base URI for resolving relative assets
        const baseUri = (0, getUri_1.getUri)(webview, extensionUri, ['webview-ui', 'build']);

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

        // Rewrite asset URLs to webview URIs
        const replaceUrl = (match, p1) => {
            const clean = p1.replace(/^\//, ''); // strip leading '/'
            const uri = (0, getUri_1.getUri)(webview, extensionUri, ['webview-ui', 'build', ...clean.split('/')]);
            return match.replace(p1, String(uri));
        };

        // Replace href/src pointing to /static/... and /favicon.ico
        indexHtml = indexHtml
            .replace(/(href|src)="\/static\/(.*?)"/g, (m) => {
            // m looks like href="/static/..." or src="/static/..."
            const pathPart = m.match(/"(\/static\/.*?)"/)[1];
            return replaceUrl(m, pathPart);
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

        // Inject CSP, a base tag to ensure any other relative paths resolve correctly
        // and a bridge script to route window.alert to VS Code notifications
        const bridgeUri = (0, getUri_1.getUri)(webview, extensionUri, ['media', 'webview-bridge.js']);
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">`;
        indexHtml = indexHtml.replace('<head>', `<head>${cspMeta}<base href="${baseUri}/"><script src="${bridgeUri}"></script>`);

        // Log the resolved asset URIs for diagnostics
        try {
            const jsMatch = indexHtml.match(/src=\"([^\"]*static\/js\/[^\"]*)\"/);
            const cssMatch = indexHtml.match(/href=\"([^\"]*static\/css\/[^\"]*)\"/);
            logger.info('WriteOffMenuPanel: Resolved JS URI: ' + (jsMatch ? jsMatch[1] : 'not found'));
            logger.info('WriteOffMenuPanel: Resolved CSS URI: ' + (cssMatch ? cssMatch[1] : 'not found'));
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
                const historyId = yield this._storageManager.getLastScanHistoryId();
                logger.info('WriteOffMenuPanel: Last scan history ID: ' + historyId);

                let lastScanIssues = null;
                if (historyId !== null) {
                    lastScanIssues = yield this._storageManager.getLastScanIssuesFromHistoryId(historyId);
                    logger.info('WriteOffMenuPanel: Issues retrieved: ' + (lastScanIssues ? lastScanIssues.length : 'No issues'));
                    if (lastScanIssues && lastScanIssues.length > 0) {
                        logger.info('WriteOffMenuPanel: First issue sample: ' + JSON.stringify(lastScanIssues[0], null, 2));
                    }
                } else {
                    logger.info('WriteOffMenuPanel: No history ID found');
                }

                // Create the data structure expected by the webview
                const woData = {
                    issues: lastScanIssues || [],
                    historyId: historyId
                };

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
                } catch(_) {}
                (0, RequestWriteOff_1.default)(data, env, this._storageManager, this.context);
                setTimeout(() => WriteOffMenuPanel.currentPanel.dispose(), 300);
                button.hide();
            }
            if (command === "bulkWriteoffRequest") {
                try {
                    const debugMode = require('../utilities/debugMode');
                    if (debugMode && debugMode.DebugMode && debugMode.DebugMode.getInstance().isDebug()) {
                        vscode_1.window.showInformationMessage('[DEBUG] Bulk write-off is simulated. No requests are sent.');
                    }
                } catch(_) {}
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
