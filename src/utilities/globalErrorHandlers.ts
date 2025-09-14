import * as vscode from 'vscode';
import { QuickCloudsLogger } from './logger';

function safeStringify(value: any): string {
  try {
    if (value instanceof Error) {
      const base = `${value.name}: ${value.message}`;
      return value.stack ? `${base}\nStack: ${value.stack}` : base;
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Installs global error/rejection/console hooks so any unexpected error is logged
 * into the Quick Clouds output channel.
 */
export function installGlobalErrorHandlers(context?: vscode.ExtensionContext): void {
  const logger = QuickCloudsLogger.getInstance();

  // Uncaught exceptions
  process.on('uncaughtException', (err: any) => {
    logger.error('Uncaught Exception', err);
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection', reason);
  });

  // Mirror console.error/warn to the output channel
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);
  console.error = (...args: any[]) => {
    try { logger.error(args.map(safeStringify).join(' ')); } catch (_) {}
    origError(...args);
  };
  console.warn = (...args: any[]) => {
    try { logger.warn(args.map(safeStringify).join(' ')); } catch (_) {}
    origWarn(...args);
  };

  // Wrap showErrorMessage to always log what the user sees
  const originalShowError = vscode.window.showErrorMessage as any;
  (vscode.window as any).showErrorMessage = function patchedShowErrorMessage(message: any, ...items: any[]) {
    try { logger.error('VS Code Error Message', message); } catch (_) {}
    return originalShowError.apply(vscode.window, [message, ...items]);
  };

  // Keep hooks alive for the extension lifetime
  if (context) {
    context.subscriptions.push({ dispose() {
      // Best-effort restore
      console.error = origError;
      console.warn = origWarn;
      (vscode.window as any).showErrorMessage = originalShowError;
    }});
  }
}

