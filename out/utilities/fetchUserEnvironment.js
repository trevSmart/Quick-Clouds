"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserEnvironment = fetchUserEnvironment;
const vscode = __importStar(require("vscode"));
const runPostLoginBackgroundTasks_1 = require("./runPostLoginBackgroundTasks");
const logger_2 = require("./logger");
/**
 * Fetches all required user/environment data after login.
 * Sets a 'environmentReady' flag in storage on success, or clears it on failure.
 * Retries up to 2 times on failure, and shows error messages to the user.
 * Logs progress to QC2 output channel instead of showing notifications.
 */
async function fetchUserEnvironment(storageManager, context) {
    let lastError = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            logger_2.QuickCloudsLogger.getInstance().info('Loading Quality Clouds environment...');
            await (0, runPostLoginBackgroundTasks_1.runPostLoginBackgroundTasks)(storageManager, context);
            await storageManager.setUserData('environmentReady', true);
            logger_2.QuickCloudsLogger.getInstance().info('Quality Clouds environment loaded successfully');
            return true;
        }
        catch (err) {
            lastError = err;
            await storageManager.setUserData('environmentReady', false);
            logger_2.QuickCloudsLogger.getInstance().error(`Failed to load Quality Clouds environment (attempt ${attempt})`, err);
            if (attempt === 2) {
                vscode.window.showErrorMessage('Failed to load Quality Clouds environment. Please try again.');
            }
        }
    }
    return false;
}
//# sourceMappingURL=fetchUserEnvironment.js.map