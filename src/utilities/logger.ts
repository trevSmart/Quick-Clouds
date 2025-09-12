"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QC2Logger = void 0;
const vscode = require("vscode");

class QC2Logger {
    private static instance: QC2Logger;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('QC2');
    }

    public static getInstance(): QC2Logger {
        if (!QC2Logger.instance) {
            QC2Logger.instance = new QC2Logger();
        }
        return QC2Logger.instance;
    }

    public log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;

        this.outputChannel.appendLine(logMessage);

        // Also log to console for development
        console.log(`QC2: ${logMessage}`);

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

exports.QC2Logger = QC2Logger;
