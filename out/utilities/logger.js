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
exports.QuickCloudsLogger = void 0;
const vscode = __importStar(require("vscode"));
class QuickCloudsLogger {
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Quick Clouds for Salesforce');
    }
    static getInstance() {
        if (!QuickCloudsLogger.instance) {
            QuickCloudsLogger.instance = new QuickCloudsLogger();
        }
        return QuickCloudsLogger.instance;
    }
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        // Also log to console for development
        console.log(`Quick Clouds: ${logMessage}`);
        // Do not auto-open the output panel on errors
    }
    info(message) {
        this.log(message, 'INFO');
    }
    warn(message) {
        this.log(message, 'WARN');
    }
    error(message, error) {
        let errorMessage = message;
        if (error) {
            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
                if (error.stack) {
                    errorMessage += `\nStack: ${error.stack}`;
                }
            }
            else {
                errorMessage += `: ${JSON.stringify(error)}`;
            }
        }
        this.log(errorMessage, 'ERROR');
    }
    show() {
        this.outputChannel.show(true);
    }
    clear() {
        this.outputChannel.clear();
    }
}
exports.QuickCloudsLogger = QuickCloudsLogger;
//# sourceMappingURL=logger.js.map
