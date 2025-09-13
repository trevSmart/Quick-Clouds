import * as vscode from 'vscode';

/**
 * Utility class to detect and manage DEBUG mode
 */
export class DebugMode {
    private static instance: DebugMode;
    private isDebugMode: boolean = false;

    private constructor() {
        this.detectDebugMode();
    }

    public static getInstance(): DebugMode {
        if (!DebugMode.instance) {
            DebugMode.instance = new DebugMode();
        }
        return DebugMode.instance;
    }

    /**
     * Detects if we are in DEBUG mode based on VSCode settings
     */
    private detectDebugMode(): void {
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
    public isDebug(): boolean {
        return this.isDebugMode;
    }

    /**
     * Returns true if we should simulate API calls instead of making real ones
     */
    public shouldSimulateApiCalls(): boolean {
        return this.isDebugMode;
    }

    /**
     * Logs a debug message with DEBUG prefix
     */
    public log(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Logs a warning message with DEBUG prefix
     */
    public warn(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.warn(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Logs an error message with DEBUG prefix
     */
    public error(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.error(`[DEBUG] ${message}`, ...args);
        }
    }
}
