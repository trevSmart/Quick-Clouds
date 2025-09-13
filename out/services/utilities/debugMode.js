"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugMode = void 0;
const vscode = require("vscode");
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
        return this.isDebugMode;
    }
    /**
     * Returns true if we should simulate API calls instead of making real ones
     */
    shouldSimulateApiCalls() {
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
