import * as vscode from 'vscode';

export class QuickCloudsLogger {
    private static instance: QuickCloudsLogger;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Quick Clouds for Salesforce');
    }

    public static getInstance(): QuickCloudsLogger {
        if (!QuickCloudsLogger.instance) {
            QuickCloudsLogger.instance = new QuickCloudsLogger();
        }
        return QuickCloudsLogger.instance;
    }

    public log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;

        this.outputChannel.appendLine(logMessage);

        // Also log to console for development
        console.log(`Quick Clouds: ${logMessage}`);

        // Show output channel for errors
        if (level === 'ERROR') {
            this.outputChannel.show(true);
        }
    }

    public info(message: string): void {
        this.log(message, 'INFO');
    }

    public warn(message: string): void {
        this.log(message, 'WARN');
    }

    public error(message: string, error?: any): void {
        let errorMessage = message;
        if (error) {
            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
                if (error.stack) {
                    errorMessage += `\nStack: ${error.stack}`;
                }
            } else {
                errorMessage += `: ${JSON.stringify(error)}`;
            }
        }
        this.log(errorMessage, 'ERROR');
    }

    public show(): void {
        this.outputChannel.show(true);
    }

    public clear(): void {
        this.outputChannel.clear();
    }
}