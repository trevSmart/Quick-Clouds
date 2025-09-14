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
exports.installGlobalErrorHandlers = installGlobalErrorHandlers;
const vscode = __importStar(require("vscode"));
const logger_2 = require("./logger");
function safeStringify(value) {
    try {
        if (value instanceof Error) {
            const base = `${value.name}: ${value.message}`;
            return value.stack ? `${base}\nStack: ${value.stack}` : base;
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
/**
 * Installs global error/rejection/console hooks so any unexpected error is logged
 * into the Quick Clouds output channel.
 */
function installGlobalErrorHandlers(context) {
    const logger = logger_2.QuickCloudsLogger.getInstance();
    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception', err);
    });
    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Promise Rejection', reason);
    });
    // Mirror console.error/warn to the output channel
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    console.error = (...args) => {
        try {
            logger.error(args.map(safeStringify).join(' '));
        }
        catch (_) { }
        origError(...args);
    };
    console.warn = (...args) => {
        try {
            logger.warn(args.map(safeStringify).join(' '));
        }
        catch (_) { }
        origWarn(...args);
    };
    // Wrap showErrorMessage to always log what the user sees
    const originalShowError = vscode.window.showErrorMessage;
    vscode.window.showErrorMessage = function patchedShowErrorMessage(message, ...items) {
        try {
            logger.error('VS Code Error Message', message);
        }
        catch (_) { }
        return originalShowError.apply(vscode.window, [message, ...items]);
    };
    // Keep hooks alive for the extension lifetime
    if (context) {
        context.subscriptions.push({ dispose() {
                // Best-effort restore
                console.error = origError;
                console.warn = origWarn;
                vscode.window.showErrorMessage = originalShowError;
            } });
    }
}
//# sourceMappingURL=globalErrorHandlers.js.map