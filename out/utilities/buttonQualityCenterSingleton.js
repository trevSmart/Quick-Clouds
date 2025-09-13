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
exports.updateQualityCenterVisibility = void 0;
exports.getQualityCenterButtonInstance = getQualityCenterButtonInstance;
exports.updateQualityCenterButtonVisibility = updateQualityCenterButtonVisibility;
const vscode = __importStar(require("vscode"));
const constants_2 = require("../constants");
let qualityCenterButtonInstance = null;
function getQualityCenterButtonInstance() {
    if (!qualityCenterButtonInstance) {
        // Priority 10 to be rightmost among our three buttons
        // Order left-to-right on the Right side: LiveCheck (30) -> Write-off (20) -> Quality Center (10)
        qualityCenterButtonInstance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
        qualityCenterButtonInstance.text = '$(library) Quality Center';
        qualityCenterButtonInstance.command = 'quick-clouds.myIssues';
    }
    return qualityCenterButtonInstance;
}
async function updateQualityCenterButtonVisibility(storageManager) {
    const qualityCenterButton = getQualityCenterButtonInstance();
    const authType = await storageManager.getUserData('authType');
    const apiKeyStatus = await storageManager.getUserData('apiKeyStatus');
    const isAuthenticated = await storageManager.getUserData('isAuthenticated');
    if ((authType === 'apiKey' && apiKeyStatus && apiKeyStatus.statusCode === constants_2.HTTP_STATUS_OK) ||
        (authType === 'credentials' && isAuthenticated)) {
        qualityCenterButton.show();
    }
    else {
        qualityCenterButton.hide();
    }
}
// Export alias for backward compatibility
exports.updateQualityCenterVisibility = updateQualityCenterButtonVisibility;
//# sourceMappingURL=buttonQualityCenterSingleton.js.map