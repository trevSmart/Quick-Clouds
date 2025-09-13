"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitBlocker = void 0;
const vscode = require("vscode");
if (vscode.workspace.workspaceFolders) {
    var path = vscode.workspace.workspaceFolders[0].uri.path;
}
else {
    var path = 'NO_PATH';
}
class CommitBlocker {
    addBlock(context) {
        const extUri = context.extensionUri;
        vscode.workspace.fs
            .readFile(vscode.Uri.parse(extUri + "/resources/blockFile.sh"))
            .then((t) => {
            vscode.workspace.fs.writeFile(vscode.Uri.parse(path + "/.git/hooks/pre-commit"), Buffer.from(String.fromCharCode(...t)));
        })
            .then(() => {
            const terminal = vscode.window.createTerminal({
                name: `QC Terminal`,
                hideFromUser: true,
            });
            terminal.sendText("chmod +x " + path + "/.git/hooks/pre-commit");
        });
    }
    removeBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vscode.workspace.fs.delete(vscode.Uri.parse(path + "/.git/hooks/pre-commit"));
            }
            catch (error) {
                console.log(error.message);
            }
        });
    }
}
exports.CommitBlocker = CommitBlocker;
//# sourceMappingURL=CommitBlocker.js.map