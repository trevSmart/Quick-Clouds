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
const axios_1 = require("axios");
const extension_1 = require("../extension");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const ApiService_1 = require("./ApiService");
const constants_1 = require("../constants");
function getLicenseInfo(storageManager, context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield storageManager.getUserData('userInfo');
        if (!user) {
            throw new Error("User information is missing from storage.");
        }
        const headers = Object.assign(Object.assign({}, (yield (0, getAuthHeader_1.getAuthHeader)(storageManager, context))), { [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME });
        const url = constructLicenseApiUrl(extension_1.env, user.customerID);
        const config = { headers };
        const doRequest = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, config);
            yield storageManager.setUserData('lastLicenseCheck', new Date().toISOString());
            return response.data.data[0].attributes;
        });
        try {
            return yield doRequest();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const authType = yield storageManager.getUserData('authType');
                if (authType === 'credentials') {
                    const refreshTokenValue = yield (0, ApiService_1.getRefreshToken)(storageManager);
                    return (0, ApiService_1.handle401AndRetry)(error, doRequest, refreshTokenValue, (tokens) => (0, ApiService_1.setTokens)(storageManager, tokens));
                }
                else {
                    console.error('Error in getLicenseInfo:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.statusText);
                }
            }
            else {
                console.error('Error in getLicenseInfo:', error);
            }
            return error;
        }
    });
}
exports.default = getLicenseInfo;
function constructLicenseApiUrl(env, customerID) {
    return `${env}/api/v2/customer-license?include=add-on&filter[customer_id]=${customerID}&filter[service_id]=2`;
}
//# sourceMappingURL=GetLicenseInfo.js.map