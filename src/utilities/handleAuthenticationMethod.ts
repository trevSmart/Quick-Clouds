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
exports.clearAuthentication = exports.getAuthenticationStatus = exports.handleAuthenticationMethod = void 0;
/**
 * Central handler for authentication status and settings.
 * Updates storage and returns the current status object for UI/logic.
 */
function handleAuthenticationMethod(storageManager, authType, options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Persist the selected authentication type
        if (typeof storageManager.setUserData === 'function') {
            yield storageManager.setUserData('authType', authType);
        }
        // Only persist isAuthenticated for credentials
        if (authType === 'credentials' && typeof (options === null || options === void 0 ? void 0 : options.isAuthenticated) === 'boolean') {
            if (typeof storageManager.setUserData === 'function') {
                yield storageManager.setUserData('isAuthenticated', options.isAuthenticated);
            }
        }
        // Only persist apiKeyStatus for apiKey
        if (authType === 'apiKey' && (options === null || options === void 0 ? void 0 : options.apiKeyStatus)) {
            if (typeof storageManager.setUserData === 'function') {
                yield storageManager.setUserData('apiKeyStatus', options.apiKeyStatus);
            }
        }
        // Return the current status for use in UI/logic
        return {
            authType,
            isAuthenticated: authType === 'credentials' ? ((_a = options === null || options === void 0 ? void 0 : options.isAuthenticated) !== null && _a !== void 0 ? _a : false) : false,
            apiKeyStatus: authType === 'apiKey' ? ((_b = options === null || options === void 0 ? void 0 : options.apiKeyStatus) !== null && _b !== void 0 ? _b : null) : null,
        };
    });
}
exports.handleAuthenticationMethod = handleAuthenticationMethod;
/**
 * Returns the current authentication status from storage without updating anything.
 */
function getAuthenticationStatus(storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const authType = (yield storageManager.getUserData('authType'));
        if (authType === 'apiKey') {
            const apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
            return {
                authType: 'apiKey',
                isAuthenticated: false,
                apiKeyStatus: apiKeyStatus !== null && apiKeyStatus !== void 0 ? apiKeyStatus : null,
            };
        }
        else {
            let isAuthenticatedRaw = yield storageManager.getUserData('isAuthenticated');
            let isAuthenticated = false;
            if (typeof isAuthenticatedRaw === 'boolean') {
                isAuthenticated = isAuthenticatedRaw;
            }
            else {
                isAuthenticated = !!isAuthenticatedRaw;
            }
            return {
                authType: 'credentials',
                isAuthenticated,
                apiKeyStatus: null,
            };
        }
    });
}
exports.getAuthenticationStatus = getAuthenticationStatus;
/**
 * Clears all authentication-related keys for the current authentication type.
 */
function clearAuthentication(storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const authType = yield storageManager.getUserData('authType');
        if (authType === 'apiKey') {
            yield storageManager.setUserData('apiKeyStatus', null);
            yield storageManager.setUserData('apiKey', null);
            yield storageManager.setUserData('userInfo', null);
            yield storageManager.setUserData('environmentReady', false);
        }
        else if (authType === 'credentials') {
            yield storageManager.setUserData('isAuthenticated', false);
            yield storageManager.setUserData('access_token', null);
            yield storageManager.setUserData('refresh_token', null);
            yield storageManager.setUserData('customer_id', null);
            yield storageManager.setUserData('selectedProject', null);
            yield storageManager.setUserData('projects', null);
            yield storageManager.setUserData('userInfo', null);
            yield storageManager.setUserData('environmentReady', false);
        }
        // Optionally, clear the authType itself
        // await storageManager.setUserData('authType', null);
    });
}
exports.clearAuthentication = clearAuthentication;
//# sourceMappingURL=handleAuthenticationMethod.js.map