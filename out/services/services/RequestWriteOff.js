"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requestWriteoff;
const vscode = require("vscode");
const axios_2 = require("axios");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const ApiService_1 = require("./ApiService");
const constants_1 = require("../constants");
const debugMode_1 = require("../utilities/debugMode");
async function requestWriteoff(data, env, storageManager, context) {
    var _a, _b;
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
        return simulatedResponse.data;
    }
    // Original implementation for non-debug mode
    const headers = Object.assign(Object.assign({}, (await (0, getAuthHeader_1.getAuthHeader)(storageManager, context))), { 'Accept': 'application/vnd.api+json', [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME, 'Content-type': 'application/vnd.api+json' });
    const urlWR = `${env}/api/v2/sf-live-check-issue/${data.id}`;
    const dataWO = { data: data };
    const doRequest = async () => {
        const res = await axios_2.default.patch(urlWR, JSON.stringify(dataWO), { headers });
        if (res.data) {
            vscode.window.showInformationMessage("Write-off is " +
                res.data.data.attributes["write-off"]["write-off-status"]);
        }
        return res.data.data;
    };
    try {
        return await doRequest();
    }
    catch (error) {
        if (axios_2.default.isAxiosError(error)) {
            const authType = await storageManager.getUserData('authType');
            if (authType === 'credentials') {
                const refreshTokenValue = await ApiService_1.ApiService.getRefreshToken(storageManager);
                return await ApiService_1.ApiService.handle401AndRetry(error, doRequest, refreshTokenValue, (tokens) => ApiService_1.ApiService.setTokens(storageManager, tokens));
            }
            else {
                vscode.window.showInformationMessage('Error in requestWriteoff: ' + (((_a = error.response) === null || _a === void 0 ? void 0 : _a.statusText) || 'Unknown error'));
                console.error('Error in requestWriteoff:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText) || 'Unknown error');
            }
        }
        else {
            vscode.window.showInformationMessage(error.message);
            console.error('Error in requestWriteoff:', error);
        }
        return [];
    }
}
