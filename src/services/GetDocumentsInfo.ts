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
        return documentsInfo;
    }
    static getFilesToAnalize(workspacePath) {
        let filesToAnalize = [];
        let files = fs.readdirSync(workspacePath);
        files.forEach(file => {
            let filePath = path.join(workspacePath, file);
            if (fs.statSync(filePath).isDirectory()) {
                filesToAnalize = filesToAnalize.concat(this.getFilesToAnalize(filePath));
            }
            else {
                if ((0, IsElementToAnalize_1.default)(file)) {
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