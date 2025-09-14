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
exports.restoreDiagnosticsFromStorage = restoreDiagnosticsFromStorage;
const vscode = __importStar(require("vscode"));
const logger_2 = require("./logger");
const UpdateDiagnostics_1 = require("./UpdateDiagnostics");
/**
 * Restores diagnostics from the persisted Livecheck history.
 * - Picks the latest scan per file path
 * - Recreates VS Code diagnostics without requiring a new Live Check run
 */
async function restoreDiagnosticsFromStorage(context, storageManager) {
    const logger = logger_2.QuickCloudsLogger.getInstance();
    try {
        const history = await storageManager.getLivecheckHistory();
        if (!Array.isArray(history) || history.length === 0) {
            logger.info('No Livecheck history found to restore diagnostics');
            return;
        }
        // Keep only the latest scan per file path
        const latestByPath = new Map();
        for (const h of history) {
            if (!h || !h.path) {
                continue;
            }
            const prev = latestByPath.get(h.path);
            const tsNum = typeof h.timestamp === 'number' ? h.timestamp : Date.parse(h.timestamp || '');
            const prevTs = prev ? prev.timestamp : -Infinity;
            if (!prev || (isFinite(tsNum) && tsNum > prevTs)) {
                latestByPath.set(h.path, {
                    path: h.path,
                    timestamp: isFinite(tsNum) ? tsNum : 0,
                    issues: Array.isArray(h.issues) ? h.issues : []
                });
            }
        }
        let restoredCount = 0;
        for (const { path, issues } of latestByPath.values()) {
            if (!issues || issues.length === 0) {
                continue;
            }
            try {
                const uri = vscode.Uri.file(path);
                // Open text document (does not show editor) so writeIssues can build ranges/related info
                const doc = await vscode.workspace.openTextDocument(uri);
                await (0, UpdateDiagnostics_1.updateDiagnostics)(doc, issues, context, storageManager);
                restoredCount++;
            }
            catch (e) {
                // File might no longer exist or be outside workspace; skip gracefully
                logger.warn(`Skipping diagnostics restore for missing/inaccessible file: ${path}`);
            }
        }
        if (restoredCount > 0) {
            logger.info(`Restored diagnostics for ${restoredCount} file(s) from history`);
        }
        else {
            logger.info('Found history but no diagnostics were restored');
        }
    }
    catch (error) {
        logger.error('Failed to restore diagnostics from storage', error);
    }
}
//# sourceMappingURL=restoreDiagnostics.js.map