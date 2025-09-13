"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            }
        }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
const handleAuthenticationMethod_1 = require("../utilities/handleAuthenticationMethod");
const buttonLCSingleton_1 = require("../utilities/utilities/buttonLCSingleton");
const SettingsPanel_1 = require("../panels/SettingsPanel");
const fetchUserEnvironment_1 = require("../utilities/fetchUserEnvironment");
const buttonQualityCenterSingleton_1 = require("../utilities/buttonQualityCenterSingleton");
function getToken(context, env, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const otp = yield context.secrets.get('qualityclouds.otp');
        if (!otp) {
            throw new Error('No OTP found in secrets.');
        }
        const url = env + '/api/v2/salesforce/developer/get-token';
        let response;
        try {
            response = yield axios_1.default.post(url, {
                "otp-token": otp,
                "source": "VSC"
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        catch (error) {
            throw error;
        }
        if (response.status !== 200) {
            throw new Error('Failed to retrieve tokens');
        }
        const data = response.data;
        if (!data['access-token'] || !data['refresh-token'] || !data['customer-id']) {
            throw new Error('Token response missing required fields.');
        }
        yield storageManager.setUserData('access_token', String(data['access-token']));
        yield storageManager.setUserData('refresh_token', String(data['refresh-token']));
        yield storageManager.setUserData('customer_id', String(data['customer-id']));
        yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, 'credentials', { isAuthenticated: true });
        yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
        yield SettingsPanel_1.SettingsPanel.notifyAuthChanged(storageManager);
        yield vscode.window.showInformationMessage('Authentication successful');
        // Block UI and fetch environment after login
        const envReady = yield (0, fetchUserEnvironment_1.fetchUserEnvironment)(storageManager, context);
        if (!envReady) {
            yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
            yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
            throw new Error('Failed to load Quality Clouds environment.');
        }
        yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
        yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
    });
}
exports.getToken = getToken;
//# sourceMappingURL=GetToken.js.map