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
exports.getAuthHeader = void 0;
const vscode = require("vscode");
/**
 * Returns the correct Authorization header for the current authentication type.
 * If authType is 'credentials', uses the access token from secrets.
 * If authType is 'apiKey', uses the API key from user configuration.
 */
function getAuthHeader(storageManager, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const authType = yield storageManager.getUserData('authType');
        if (authType === 'credentials') {
            const accessToken = yield storageManager.getUserData('access_token');
            if (!accessToken) {
                throw new Error('No access token found for credentials authentication.');
            }
            return { Authorization: `Bearer ${accessToken}` };
        }
        else {
            const apiKey = (yield storageManager.getUserData('apiKey')) ?
                yield storageManager.getUserData('apiKey') :
                String(vscode.workspace.getConfiguration("UserConfiguration").get("API-key"));
            if (!apiKey) {
                throw new Error('No API key found for apiKey authentication.');
            }
            return { Authorization: `Bearer ${apiKey}` };
        }
    });
}
exports.getAuthHeader = getAuthHeader;
