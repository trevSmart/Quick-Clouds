import * as vscode from 'vscode';
import axios from 'axios';
import { getAuthHeader } from '../utilities/getAuthHeader';
import { ApiService } from './ApiService';
import { QC_CLIENT_HEADER, QC_CLIENT_NAME } from '../constants';
import { DebugMode } from '../utilities/debugMode';

export default async function requestWriteoff(data: any, env: string, storageManager: any, context: vscode.ExtensionContext): Promise<any> {
    const debugMode = DebugMode.getInstance();

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
        try { await storageManager.setWriteOffStatus(data.id, 'REQUESTED', { source: 'debug' }); } catch (_) {}
        return simulatedResponse.data;
    }

    // Original implementation for non-debug mode
    const headers = {
        ...(await getAuthHeader(storageManager, context)),
        'Accept': 'application/vnd.api+json',
        [QC_CLIENT_HEADER]: QC_CLIENT_NAME,
        'Content-type': 'application/vnd.api+json'
    };

    const urlWR = `${env}/api/v2/sf-live-check-issue/${data.id}`;
    const dataWO = { data: data };

    const doRequest = async () => {
        const res = await axios.patch(urlWR, JSON.stringify(dataWO), { headers });
        if (res.data) {
            vscode.window.showInformationMessage("Write-off is " +
                res.data.data.attributes["write-off"]["write-off-status"]);
        }
        try { await storageManager.setWriteOffStatus(data.id, 'REQUESTED', { source: 'api' }); } catch(_) {}
        return res.data.data;
    };

    try {
        return await doRequest();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const authType = await storageManager.getUserData('authType');
            if (authType === 'credentials') {
                const refreshTokenValue = await ApiService.getRefreshToken(storageManager);
                return await ApiService.handle401AndRetry(error, doRequest, refreshTokenValue, (tokens) => ApiService.setTokens(storageManager, tokens));
            } else {
                vscode.window.showInformationMessage('Error in requestWriteoff: ' + (error.response?.statusText || 'Unknown error'));
                console.error('Error in requestWriteoff:', error.response?.statusText || 'Unknown error');
            }
        } else {
            vscode.window.showInformationMessage(error.message);
            console.error('Error in requestWriteoff:', error);
        }
        return [];
    }
}
