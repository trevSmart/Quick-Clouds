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
const extension_1 = require("../extension");
const axios_1 = require("axios");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const ApiService_1 = require("./ApiService");
const constants_1 = require("../constants");
function getUserInfo(storageService, context) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const headers = Object.assign(Object.assign({}, (yield (0, getAuthHeader_1.getAuthHeader)(storageService, context))), { [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME });
        const url = extension_1.env + '/api/v2/user/me';
        const options = {
            method: 'GET',
            url,
            headers
        };
        const doRequest = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.request(options);
            yield storageService.setUserData('apiKeyStatus', { statusCode: response.status, message: response.statusText });
            yield storageService.setUserData('userInfo', {
                developer: response.data.data.attributes['api-key-developer'],
                apiKeyId: response.data.data.attributes['api-key-id'],
                instanceId: response.data.data.attributes['api-key-instance-id'],
                customerID: response.data.data.attributes['customer-id'],
                customerName: response.data.data.attributes['customer-name'],
                allowSourceCodePersistance: response.data.data.attributes['allow-source-code-persistance'],
                writeOffAssignmentType: response.data.data.attributes['writeoff-assignment-type']
            });
        });
        try {
            yield doRequest();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const authType = yield storageService.getUserData('authType');
                if (authType === 'credentials') {
                    const refreshTokenValue = yield (0, ApiService_1.getRefreshToken)(storageService);
                    return (0, ApiService_1.handle401AndRetry)(error, doRequest, refreshTokenValue, (tokens) => (0, ApiService_1.setTokens)(storageService, tokens));
                }
                else {
                    yield storageService.setUserData('apiKeyStatus', { statusCode: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status, message: (_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText });
                    console.error('Error in getUserInfo:', (_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText);
                }
            }
            else {
                console.error('Error in getUserInfo:', error);
            }
        }
    });
}
exports.default = getUserInfo;
//# sourceMappingURL=GetUserInfo.js.map