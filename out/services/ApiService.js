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
exports.getRefreshToken = exports.setTokens = exports.handle401AndRetry = exports.refreshToken = void 0;
const axios_1 = require("axios");
const extension_1 = require("../extension");
/**
 * Calls the refresh token endpoint and returns new tokens using axios.
 * @param refreshToken The current refresh token.
 * @returns An object with the new access and refresh tokens.
 */
function refreshToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = extension_1.env + `/api/v2/salesforce/developer/refresh-token`;
        try {
            const response = yield axios_1.default.post(url, {
                'refresh-token': refreshToken,
                source: 'VSC'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return {
                accessToken: response.data['access-token'],
                refreshToken: response.data['refresh-token']
            };
        }
        catch (error) {
            throw new Error('Failed to refresh token');
        }
    });
}
exports.refreshToken = refreshToken;
/**
 * Handles 401 errors by attempting a token refresh and retrying the API call.
 * @param error The error caught from the API call.
 * @param apiCallFn A function that re-executes the original API call.
 * @param refreshTokenValue The current refresh token.
 * @param setTokensFn A function to update the access and refresh tokens in your app.
 */
function handle401AndRetry(error, apiCallFn, refreshTokenValue, setTokensFn) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 || (error === null || error === void 0 ? void 0 : error.status) === 401) {
            console.log('Handling 401 error, attempting to refresh token...');
            try {
                const tokens = yield refreshToken(refreshTokenValue);
                setTokensFn(tokens);
                return yield apiCallFn();
            }
            catch (refreshError) {
                throw refreshError;
            }
        }
        throw error;
    });
}
exports.handle401AndRetry = handle401AndRetry;
/**
 * Sets the access and refresh tokens in the storage manager.
 */
function setTokens(storageManager, tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storageManager.setUserData('access_token', tokens.accessToken);
        yield storageManager.setUserData('refresh_token', tokens.refreshToken);
    });
}
exports.setTokens = setTokens;
/**
 * Gets the refresh token from the storage manager.
 */
function getRefreshToken(storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield storageManager.getUserData('refresh_token'));
    });
}
exports.getRefreshToken = getRefreshToken;
//# sourceMappingURL=ApiService.js.map