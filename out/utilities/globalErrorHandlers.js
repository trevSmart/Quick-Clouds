"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installGlobalErrorHandlers = installGlobalErrorHandlers;
const vscode = require("vscode");
const logger_1 = require("./logger");
function safeStringify(value) {
    try {
        if (value instanceof Error) {
            const base = `${value.name}: ${value.message}`;
            return value.stack ? `${base}\nStack: ${value.stack}` : base;
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    catch (_a) {
        return String(value);
    }
}
function installGlobalErrorHandlers(context) {
    const logger = logger_1.QuickCloudsLogger.getInstance();
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception', err);
    });
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Promise Rejection', reason);
    });
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    console.error = (...args) => {
        try {
            logger.error(args.map(safeStringify).join(' '));
        }
        catch (_a) { }
        origError(...args);
    };
    console.warn = (...args) => {
        try {
            logger.warn(args.map(safeStringify).join(' '));
        }
        catch (_a) { }
        origWarn(...args);
    };
    const originalShowError = vscode.window.showErrorMessage;
    vscode.window.showErrorMessage = function patchedShowErrorMessage(message, ...items) {
        try {
            logger.error('VS Code Error Message', message);
        }
        catch (_a) { }
        return originalShowError.apply(vscode.window, [message, ...items]);
    };
    if (context) {
        context.subscriptions.push({
            dispose() {
                console.error = origError;
                console.warn = origWarn;
                vscode.window.showErrorMessage = originalShowError;
            }
        });
    }
}

