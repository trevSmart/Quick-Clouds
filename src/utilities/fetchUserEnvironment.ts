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
exports.fetchUserEnvironment = void 0;
const vscode = require("vscode");
const runPostLoginBackgroundTasks_1 = require("./runPostLoginBackgroundTasks");
/**
 * Fetches all required user/environment data after login, blocking the UI with a progress indicator.
 * Sets a 'environmentReady' flag in storage on success, or clears it on failure.
 * Retries up to 2 times on failure, and shows error messages to the user.
 */
function fetchUserEnvironment(storageManager, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let lastError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                yield vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Loading Quality Clouds environment...',
                    cancellable: false
                }, () => __awaiter(this, void 0, void 0, function* () {
                    yield (0, runPostLoginBackgroundTasks_1.runPostLoginBackgroundTasks)(storageManager, context);
                }));
                yield storageManager.setUserData('environmentReady', true);
                return true;
            }
            catch (err) {
                lastError = err;
                yield storageManager.setUserData('environmentReady', false);
                if (attempt === 2) {
                    vscode.window.showErrorMessage('Failed to load Quality Clouds environment. Please try again.');
                }
            }
        }
        return false;
    });
}
exports.fetchUserEnvironment = fetchUserEnvironment;
//# sourceMappingURL=fetchUserEnvironment.js.map