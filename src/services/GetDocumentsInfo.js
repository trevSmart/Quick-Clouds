"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const IsElementToAnalize_1 = require("../utilities/IsElementToAnalize");
const path = require("path");
class DocumentsData {
    static getDocumentsInfo(workspacePath) {
        let filesToAnalize = this.getFilesToAnalize(workspacePath);
        let documentsInfo = [{ pathCE: '', lastModefiedDate: new Date(), CEname: '' }];
        documentsInfo.pop();
        filesToAnalize.forEach(file => {
            documentsInfo.push({ pathCE: file, lastModefiedDate: this.getLastModifiedTime(file), CEname: path.basename(file) });
        });
        // Sort by last modified desc for a more useful view
        documentsInfo.sort((a, b) => {
            const ta = new Date(a.lastModefiedDate).getTime();
            const tb = new Date(b.lastModefiedDate).getTime();
            return tb - ta;
        });
        return documentsInfo;
    }
    static getFilesToAnalize(workspacePath) {
        let filesToAnalize = [];

        // Validate workspace path to prevent path traversal
        const normalizedWorkspacePath = path.resolve(workspacePath);
        if (!fs.existsSync(normalizedWorkspacePath)) {
            console.warn(`Workspace path does not exist: ${normalizedWorkspacePath}`);
            return filesToAnalize;
        }

        let files = fs.readdirSync(normalizedWorkspacePath);
        const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'out', 'webview-ui', 'build', 'tmp', '.vscode', 'dist', 'coverage']);
        files.forEach(file => {
            // Prevent path traversal by validating file names
            if (file.includes('..') || file.includes('/') || file.includes('\\')) {
                console.warn(`Skipping potentially malicious file path: ${file}`);
                return;
            }

            let filePath = path.join(normalizedWorkspacePath, file);

            // Additional security check: ensure the resolved path is still within workspace
            const resolvedPath = path.resolve(filePath);
            if (!resolvedPath.startsWith(normalizedWorkspacePath)) {
                console.warn(`Path traversal attempt blocked: ${filePath}`);
                return;
            }

            let stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const base = path.basename(filePath);
                if (EXCLUDED_DIRS.has(base)) {
                    return;
                }
                filesToAnalize = filesToAnalize.concat(this.getFilesToAnalize(filePath));
            }
            else {
                if ((0, IsElementToAnalize_1.default)(filePath)) {
                    filesToAnalize.push(filePath);
                }
            }
        });
        return filesToAnalize;
    }
    static getLastModifiedTime(path) {
        const stats = fs.statSync(path);
        return stats.mtime;
    }
}
exports.default = DocumentsData;
//# sourceMappingURL=GetDocumentsInfo.js.map
