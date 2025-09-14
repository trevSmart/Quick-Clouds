import * as vscode from 'vscode';
import { QuickCloudsLogger } from './logger';
import { updateDiagnostics } from './UpdateDiagnostics';

/**
 * Restores diagnostics from the persisted Livecheck history.
 * - Picks the latest scan per file path
 * - Recreates VS Code diagnostics without requiring a new Live Check run
 */
export async function restoreDiagnosticsFromStorage(context: vscode.ExtensionContext, storageManager: any): Promise<void> {
    const logger = QuickCloudsLogger.getInstance();
    try {
        const history = await storageManager.getLivecheckHistory();
        if (!Array.isArray(history) || history.length === 0) {
            logger.info('No Livecheck history found to restore diagnostics');
            return;
        }

        // Keep only the latest scan per file path
        const latestByPath = new Map();
        for (const h of history) {
            if (!h || !h.path) { continue; }
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
            if (!issues || issues.length === 0) { continue; }
            try {
                const uri = vscode.Uri.file(path);
                // Open text document (does not show editor) so writeIssues can build ranges/related info
                const doc = await vscode.workspace.openTextDocument(uri);
                await updateDiagnostics(doc, issues, context, storageManager);
                restoredCount++;
            } catch (e) {
                // File might no longer exist or be outside workspace; skip gracefully
                logger.warn(`Skipping diagnostics restore for missing/inaccessible file: ${path}`);
            }
        }

        if (restoredCount > 0) {
            logger.info(`Restored diagnostics for ${restoredCount} file(s) from history`);
        } else {
            logger.info('Found history but no diagnostics were restored');
        }
    } catch (error) {
        logger.error('Failed to restore diagnostics from storage', error);
    }
}
