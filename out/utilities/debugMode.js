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
exports.DebugMode = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Utility class to detect and manage DEBUG mode
 */
class DebugMode {
    constructor() {
        this.isDebugMode = false;
        this.detectDebugMode();
    }
    static getInstance() {
        if (!DebugMode.instance) {
            DebugMode.instance = new DebugMode();
        }
        return DebugMode.instance;
    }
    /**
     * Detects if we are in DEBUG mode based on VSCode settings
     */
    detectDebugMode() {
        // Check the Quick Clouds debug setting from VSCode configuration
        const config = vscode.workspace.getConfiguration('QuickClouds');
        this.isDebugMode = config.get('debugMode', false);
        // Log the detection result
        console.log('DebugMode: Detection result:', {
            debugModeSetting: this.isDebugMode,
            source: 'QuickClouds.debugMode'
        });
    }
    /**
     * Returns true if we are in DEBUG mode
     */
    isDebug() {
        // Always re-read the current setting to avoid stale state
        this.detectDebugMode();
        return this.isDebugMode;
    }
    /**
     * Returns true if we should simulate API calls instead of making real ones
     */
    shouldSimulateApiCalls() {
        // Keep behavior aligned with current setting at call time
        this.detectDebugMode();
        return this.isDebugMode;
    }
    /**
     * Logs a debug message with DEBUG prefix
     */
    log(message, ...args) {
        if (this.isDebugMode) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    /**
     * Logs a warning message with DEBUG prefix
     */
    warn(message, ...args) {
        if (this.isDebugMode) {
            console.warn(`[DEBUG] ${message}`, ...args);
        }
    }
    /**
     * Logs an error message with DEBUG prefix
     */
    error(message, ...args) {
        if (this.isDebugMode) {
            console.error(`[DEBUG] ${message}`, ...args);
        }
    }
}
exports.DebugMode = DebugMode;
//# sourceMappingURL=debugMode.js.map
