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
exports.oauthAuthentication = void 0;
const vscode = require("vscode");
const env_1 = require("../env");
function oauthAuthentication(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const callbackUri = env_1.CallbackUri.DEFAULT;
        const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
        yield context.globalState.update('qualityclouds.oauthState', state);
        const redirectTo = `${env_1.RedirectBaseUrl.PROD}/get-otp?callbackUrl=${callbackUri}&state=${state}`;
        const authUrl = `${env_1.AuthBaseUrl.PROD}/login?redirectTo=${encodeURIComponent(redirectTo)}`;
        // @ts-ignore
        vscode.env.openExternal(authUrl);
        vscode.window.showInformationMessage('Please complete the login in your browser.');
    });
}
exports.oauthAuthentication = oauthAuthentication;
//# sourceMappingURL=OauthAuthentication.js.map