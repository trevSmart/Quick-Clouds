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
const axios_1 = require("axios");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const vscode = require("vscode");
const ApiService_1 = require("./ApiService");
const constants_1 = require("../constants");
const debugMode_1 = require("../utilities/debugMode");
function requestWriteoff(data, env, storageManager, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const debugMode = debugMode_1.DebugMode.getInstance();

        // Check if we're in debug mode
        if (debugMode.shouldSimulateApiCalls()) {
            debugMode.log('RequestWriteOff: Simulating write-off request instead of making real API call');
            debugMode.log('RequestWriteOff: Simulated data:', {
                issueId: data.id,
                url: `${env}/api/v2/sf-live-check-issue/${data.id}`,
                data: data
            });

        // Simulate a successful response
        const simulatedResponse = {
            data: {
                attributes: {
                    "write-off": {
                        "write-off-status": "requested"
                    }
                }
            }
        };

        vscode.window.showInformationMessage("[DEBUG] Write-off simulation: " + simulatedResponse.data.attributes["write-off"]["write-off-status"]);
        debugMode.log('RequestWriteOff: Simulated response:', simulatedResponse);
        try {
            const issueKey = (data && (data.id || data.uuid));
            if (issueKey) {
                yield storageManager.setWriteOffStatus(issueKey, 'REQUESTED', { source: 'debug' });
            }
        }
        catch (_) { }
        return simulatedResponse.data;
        }

        // Original implementation for non-debug mode
        const headers = Object.assign(Object.assign({}, (yield (0, getAuthHeader_1.getAuthHeader)(storageManager, context))), { Accept: "application/vnd.api+json", [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME, "Content-type": "application/vnd.api+json" });
        const urlWR = `${env}/api/v2/sf-live-check-issue/${data.id}`;
        const dataWO = { data: data };
        const doRequest = () => __awaiter(this, void 0, void 0, function* () {
            let res = yield axios_1.default.patch(urlWR, JSON.stringify(dataWO), { headers });
            if (res.data) {
                vscode.window.showInformationMessage("Write-off is " +
                    res.data.data.attributes["write-off"]["write-off-status"]);
            }
            try {
                const issueKey = (data && (data.id || data.uuid));
                if (issueKey) {
                    yield storageManager.setWriteOffStatus(issueKey, 'REQUESTED', { source: 'api' });
                }
            }
            catch (_) { }
            return res.data.data;
        });
        try {
            return yield doRequest();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const authType = yield storageManager.getUserData('authType');
                if (authType === 'credentials') {
                    const refreshTokenValue = yield (0, ApiService_1.getRefreshToken)(storageManager);
                    return (0, ApiService_1.handle401AndRetry)(error, doRequest, refreshTokenValue, (tokens) => (0, ApiService_1.setTokens)(storageManager, tokens));
                }
                else {
                    vscode.window.showInformationMessage('Error in requestWriteoff: ' + (error.response?.statusText || 'Unknown error'));
                    console.error('Error in requestWriteoff:', error.response?.statusText || 'Unknown error');
                }
            }
            else {
                vscode.window.showInformationMessage(error.message);
                console.error('Error in requestWriteoff:', error);
            }
            return [];
        }
    });
}
exports.default = requestWriteoff;
//# sourceMappingURL=RequestWriteOff.js.map
