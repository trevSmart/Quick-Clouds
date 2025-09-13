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
exports.runLivecheck = void 0;
const vscode = require("vscode");
const extension_1 = require("../extension");
const path = require("path");
const IsElementToAnalize_1 = require("../utilities/IsElementToAnalize");
const axios_1 = require("axios");
const EvaluateQualityGates_1 = require("../utilities/EvaluateQualityGates");
const GenerateWOdata_1 = require("../utilities/GenerateWOdata");
const GenerateIssuesHistory_1 = require("../utilities/GenerateIssuesHistory");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const handleAuthenticationMethod_1 = require("../utilities/handleAuthenticationMethod");
const ApiService_1 = require("./ApiService");
const constants_1 = require("../constants");
const logger_1 = require("../utilities/logger");
// Debug mode and dummy issues utilities
const debugMode = require("../utilities/debugMode");
const dummyIssuesUtil = require("../utilities/generateDummyIssues");
function runLivecheck(context, storageManager) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let url = extension_1.env + "/api/v2/sf-live-check";
        let documentDetails;
        try {
            documentDetails = getDocumentDetails();
        }
        catch (error) {
            vscode.window.showInformationMessage(error.message);
            return { response: [], documentPath: '' };
        }
        const { documentText, fullDocumentPath, documentPath, fileName } = documentDetails;
        if (!(0, IsElementToAnalize_1.default)(fullDocumentPath)) {
            vscode.window.showInformationMessage("This file is not supported by Quality Clouds scan");
            return { response: [], documentPath: fullDocumentPath };
        }
        const { authType } = yield (0, handleAuthenticationMethod_1.getAuthenticationStatus)(storageManager);
        const authHeaderObj = yield (0, getAuthHeader_1.getAuthHeader)(storageManager, context);
        const Authorization = authHeaderObj.Authorization;
        let headers = {
            Authorization,
            [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME,
            "Content-type": "application/json",
        };
        if (authType === 'credentials') {
            const selectedProject = yield storageManager.getUserData('selectedProject');
            if (!selectedProject) {
                vscode.window.showInformationMessage("Please go to Quick Clouds settings and select a project.");
                return { response: [], documentPath: fullDocumentPath };
            }
            if (!selectedProject.attributes || !selectedProject.attributes['main-instance-id']) {
                vscode.window.showInformationMessage("The selected project does not have a main instance ID. Please select another project or inform your admin.");
                return { response: [], documentPath: fullDocumentPath };
            }
            headers["Instance-id"] = String(selectedProject.attributes['main-instance-id']);
        }
        const body = getRequestBody(documentPath, documentText, context.extension.packageJSON.version);
        const doRequest = () => __awaiter(this, void 0, void 0, function* () {
            var _c, _d;
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor || activeEditor.document.uri.fsPath !== fullDocumentPath) {
                yield vscode.window.showTextDocument(vscode.Uri.file(fullDocumentPath), { preview: false });
            }
            const res = yield axios_1.default.post(url, body, { headers });
            // Log the issues returned by the API
            const logger = logger_1.QuickCloudsLogger.getInstance();
            logger.info('LiveCheck API Response: Issues count = ' + (res.data.issues ? res.data.issues.length : 'No issues'));
            if (res.data.issues && res.data.issues.length > 0) {
                logger.info('LiveCheck API Response: First issue sample: ' + JSON.stringify(res.data.issues[0], null, 2));
                logger.info('LiveCheck API Response: All issues summary:');
                res.data.issues.forEach((issue, index) => {
                    logger.info(`  Issue ${index + 1}: ${issue.ruleName || 'Unknown rule'} - ${issue.message || 'No message'} (Line ${issue.line || 'Unknown'})`);
                });
            }
            else {
                logger.info('LiveCheck API Response: No issues found in response');
            }
            // If debug mode is enabled, append 3 dummy issues (High, Medium, Low)
            try {
                const dbg = debugMode && debugMode.DebugMode ? debugMode.DebugMode.getInstance() : undefined;
                const isDbg = dbg?.isDebug?.() === true;
                if (isDbg) {
                    const before = Array.isArray(res.data.issues) ? res.data.issues.length : 0;
                    const combined = dummyIssuesUtil.addDummyIssuesIfDebugMode(res.data.issues || [], true, fileName, fullDocumentPath);
                    res.data.issues = combined;
                    const added = res.data.issues.length - before;
                    logger.info(`Debug mode active: added ${added} dummy issues (file: ${fileName})`);
                }
            }
            catch (e) {
                logger.error('Failed to add dummy issues in debug mode', e);
            }
            storageManager.setUserData("qualityGatesActive", (0, EvaluateQualityGates_1.default)(res.data.qualityGates));
            let historyId = yield (0, GenerateIssuesHistory_1.default)(res.data.issues, fullDocumentPath, storageManager);
            logger.info('LiveCheck: Issues saved to history with ID: ' + historyId);
            (0, GenerateWOdata_1.default)(context, res.data.issues, documentText, extension_1.env, historyId, storageManager);
            const allowCompletionOnFail = (_d = (_c = res.data.qualityGates[0]) === null || _c === void 0 ? void 0 : _c.allowCompletionOnFail) !== null && _d !== void 0 ? _d : true;
            storageManager.setUserData("allowCompletionOnFail", allowCompletionOnFail);
            return res.data.issues;
        });
        try {
            const response = yield doRequest();
            return { response, documentPath: fullDocumentPath };
        }
        catch (error) {
            const logger = logger_1.QuickCloudsLogger.getInstance();
            if (axios_1.default.isAxiosError(error)) {
                const authType = yield storageManager.getUserData('authType');
                // Log detailed error information
                logger.error('LiveCheck API Error Details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    headers: error.response?.headers,
                    url: error.config?.url,
                    method: error.config?.method,
                    authType: authType
                });
                if (authType === 'credentials') {
                    const refreshTokenValue = yield (0, ApiService_1.getRefreshToken)(storageManager);
                    const response = yield (0, ApiService_1.handle401AndRetry)(error, doRequest, refreshTokenValue, (tokens) => (0, ApiService_1.setTokens)(storageManager, tokens));
                    return { response, documentPath: fullDocumentPath };
                }
                else {
                    // Enhanced error message with more details
                    const errorDetails = {
                        status: error.response?.status || 'Unknown',
                        statusText: error.response?.statusText || 'Unknown',
                        data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) + '...' : 'No response data'
                    };
                    const errorMessage = `Error in runLivecheck: ${errorDetails.status} ${errorDetails.statusText}. Data: ${errorDetails.data}`;
                    vscode.window.showInformationMessage(errorMessage);
                    logger.error('LiveCheck failed with detailed error:', errorMessage);
                }
            }
            else {
                logger.error('LiveCheck non-Axios error:', error);
                vscode.window.showInformationMessage('Error in runLivecheck: ' + error.message);
            }
            return { response: [], documentPath: fullDocumentPath };
        }
    });
}
exports.runLivecheck = runLivecheck;
function getDocumentDetails() {
    var _a;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        throw new Error("No active editor found");
    }
    const documentText = editor.document.getText();
    const fullDocumentPath = editor.document.uri.fsPath;
    const workspacePath = ((_a = vscode.workspace.getWorkspaceFolder(editor.document.uri)) === null || _a === void 0 ? void 0 : _a.uri.fsPath) || "";
    const documentPath = fullDocumentPath.replace(workspacePath, "").replace("-meta.xml", "");
    const fileName = path.basename(fullDocumentPath);
    return { documentText, fullDocumentPath, documentPath, fileName };
}
function getRequestBody(documentPath, documentText, version) {
    return {
        "element-name": documentPath,
        "element-content": documentText,
        "extension-version": version,
    };
}
//# sourceMappingURL=LiveCheck.js.map