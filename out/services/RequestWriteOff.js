"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requestWriteoff;
const vscode = __importStar(require("vscode"));
const axios_2 = __importDefault(require("axios"));
const getAuthHeader_2 = require("../utilities/getAuthHeader");
const ApiService_2 = require("./ApiService");
const constants_2 = require("../constants");
const debugMode_1 = require("../utilities/debugMode");
async function requestWriteoff(data, env, storageManager, context) {
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
                await storageManager.setWriteOffStatus(issueKey, 'REQUESTED', { source: 'debug' });
            }
        }
        catch (_) { }
        return simulatedResponse.data;
    }
    // Original implementation for non-debug mode
    const headers = {
        ...(await (0, getAuthHeader_2.getAuthHeader)(storageManager, context)),
        'Accept': 'application/vnd.api+json',
        [constants_2.QC_CLIENT_HEADER]: constants_2.QC_CLIENT_NAME,
        'Content-type': 'application/vnd.api+json'
    };
    const urlWR = `${env}/api/v2/sf-live-check-issue/${data.id}`;
    const dataWO = { data: data };
    const doRequest = async () => {
        const res = await axios_2.default.patch(urlWR, JSON.stringify(dataWO), { headers });
        if (res.data) {
            vscode.window.showInformationMessage("Write-off is " +
                res.data.data.attributes["write-off"]["write-off-status"]);
        }
        try {
            const issueKey = (data && (data.id || data.uuid));
            if (issueKey) {
                await storageManager.setWriteOffStatus(issueKey, 'REQUESTED', { source: 'api' });
            }
        }
        catch (_) { }
        return res.data.data;
    };
    try {
        return await doRequest();
    }
    catch (error) {
        if (axios_2.default.isAxiosError(error)) {
            const authType = await storageManager.getUserData('authType');
            if (authType === 'credentials') {
                const refreshTokenValue = await ApiService_2.ApiService.getRefreshToken(storageManager);
                return await ApiService_2.ApiService.handle401AndRetry(error, doRequest, refreshTokenValue, (tokens) => ApiService_2.ApiService.setTokens(storageManager, tokens));
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
}
//# sourceMappingURL=RequestWriteOff.js.map