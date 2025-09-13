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
exports.AIReService = void 0;
const axios_1 = require("axios");
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const ApiService_1 = require("./ApiService");
class AIReService {
    /**
     * This method is used to get a suggestion from the AI service.
     * It sends a POST request to the AI service with the user's code, issue type, error found, and line number.
     * The AI service then returns a conversation object with the suggestion.
     *
     * @param userID - The ID of the user.
     * @param code - The code that the user is working on.
     * @param issue_type - The type of issue that the user is facing.
     * @param error_found - The error that was found in the user's code.
     * @param line_number - The line number where the error was found.
     * @param rule_id - The ID of the rule.
     * @returns A Promise that resolves to a Conversation object if the request was successful, an AxiosError object if the request failed, or undefined if no suggestion was found.
     */
    static getSuggestion(userID, code, issue_type, error_found, line_number, rule_id, env, storageManager, context) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let url = env + "/ai/api/v1/conversations";
            let data = JSON.stringify({
                "userId": userID,
                "engineType": "SALESFORCE",
                "conversationType": "APEX_RECOMMENDATION_DICTIONARY",
                "data": {
                    "code": code,
                    "issue_type": issue_type,
                    "error_found": error_found,
                    "line_number": line_number,
                    "rule_name_id": rule_id
                }
            });
            const doRequest = () => __awaiter(this, void 0, void 0, function* () {
                const headers = Object.assign(Object.assign({}, (yield (0, getAuthHeader_1.getAuthHeader)(storageManager, context))), { 'Accept': 'application/json', "Content-type": "application/json" });
                const response = yield axios_1.default.post(url, data, { headers });
                let conversationData = response.data;
                return conversationData;
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
                        console.error('Error in AIReService.getSuggestion:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.statusText);
                    }
                }
                else {
                    console.error('Error in AIReService.getSuggestion:', error);
                }
            }
        });
    }
    ;
    /**
     * This method is used to rate a suggestion from the AI service.
     * It sends a PUT request to the AI service with the conversation ID and the user's rating.
     * The AI service then updates the rating of the conversation.
     *
     * @param conversationID - The ID of the conversation.
     * @param rating - The rating that the user wants to give to the suggestion.
     */
    static rateSuggestion(conversationID, rating, env, storageManager, context) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let url = env + "/ai/api/v1/rating/" + conversationID;
            let data = JSON.stringify({
                "rating": JSON.stringify(rating)
            });
            const doRequest = () => __awaiter(this, void 0, void 0, function* () {
                const headers = Object.assign(Object.assign({}, (yield (0, getAuthHeader_1.getAuthHeader)(storageManager, context))), { 'X-Rating-origin': 'ORIGIN', 'Accept': 'application/json', "Content-type": "application/json" });
                yield axios_1.default.put(url, data, { headers });
            });
            try {
                yield doRequest();
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    const authType = yield storageManager.getUserData('authType');
                    if (authType === 'credentials') {
                        const refreshTokenValue = yield (0, ApiService_1.getRefreshToken)(storageManager);
                        return (0, ApiService_1.handle401AndRetry)(error, doRequest, refreshTokenValue, (tokens) => (0, ApiService_1.setTokens)(storageManager, tokens));
                    }
                    else {
                        console.error('Error in AIReService.rateSuggestion:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.statusText);
                    }
                }
                else {
                    console.error('Error in AIReService.rateSuggestion:', error);
                }
            }
        });
    }
    ;
}
exports.AIReService = AIReService;
;
//# sourceMappingURL=AIReService.js.map