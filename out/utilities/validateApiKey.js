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
exports.validateApiKey = void 0;
const vscode = require("vscode");
const GetUserInfo_1 = require("../services/GetUserInfo");
const handleAuthenticationMethod_1 = require("./handleAuthenticationMethod");
const buttonLCSingleton_1 = require("./utilities/buttonLCSingleton");
const SettingsPanel_1 = require("../panels/SettingsPanel");
const buttonQualityCenterSingleton_1 = require("./buttonQualityCenterSingleton");
const fetchUserEnvironment_1 = require("./fetchUserEnvironment");
function validateApiKey(storageManager, _buttonLC, context, apiKeyOverride // new optional parameter
) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Validating",
            cancellable: false
        }, () => __awaiter(this, void 0, void 0, function* () {
            const authType = yield storageManager.getUserData('authType');
            if (authType !== 'apiKey') {
                vscode.window.showWarningMessage('validateApiKey called, but authType is not apiKey. Skipping API key validation logic.');
                (0, buttonLCSingleton_1.getButtonLCInstance)().hide();
                return;
            }
            // If apiKeyOverride is provided, temporarily set it for validation
            let originalApiKey = null;
            if (apiKeyOverride) {
                originalApiKey = yield storageManager.getUserData('apiKey');
                yield storageManager.setUserData('apiKey', apiKeyOverride);
            }
            // Await getUserInfo, which now resolves only after apiKeyStatus is set
            yield (0, GetUserInfo_1.default)(storageManager, context);
            if (apiKeyOverride && originalApiKey !== null) {
                yield storageManager.setUserData('apiKey', originalApiKey); // restore original
            }
            const updatedApiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
            if (updatedApiKeyStatus) {
                vscode.window.showInformationMessage('API call status: ' + updatedApiKeyStatus.message);
                yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, 'apiKey', { apiKeyStatus: updatedApiKeyStatus });
            }
            else {
                vscode.window.showInformationMessage('API call status: Unknown (apiKeyStatus is null)');
                yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, 'apiKey', { isAuthenticated: false, apiKeyStatus: null });
            }
            // Remove direct runPostLoginBackgroundTasks call, use fetchUserEnvironment for robust flow
            const envReady = yield (0, fetchUserEnvironment_1.fetchUserEnvironment)(storageManager, context);
            if (!envReady) {
                yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
                yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
                throw new Error('Failed to load Quality Clouds environment.');
            }
            yield (0, buttonLCSingleton_1.updateButtonLCVisibility)(storageManager);
            yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
            yield SettingsPanel_1.SettingsPanel.notifyAuthChanged(storageManager);
        }));
        const apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
        let authType = yield storageManager.getUserData('authType');
        if (typeof authType !== 'string') {
            authType = '';
        }
        let isAuthenticated = yield storageManager.getUserData('isAuthenticated');
        if (typeof isAuthenticated !== 'boolean') {
            isAuthenticated = false;
        }
    });
}
exports.validateApiKey = validateApiKey;
//# sourceMappingURL=validateApiKey.js.map