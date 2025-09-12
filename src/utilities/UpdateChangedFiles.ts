"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const IsElementToAnalize_1 = require("./IsElementToAnalize");
const LocalStorageService_1 = require("../services/LocalStorageService");
function UpdateChangedFiles(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        var git = require("./GetGitData");
        //Get list of repositories available in current VS Code workspace
        const repos = git.gitdata.getAllRepos();
        const branch = repos[0].state.HEAD;
        const repoUrl = repos[0].rootUri.path;
        const changedElements = storageManager.getValue(repoUrl);
        for (const [index, element] of changedElements.entries()) {
            const filePath = element.path;
            if ((0, IsElementToAnalize_1.default)(filePath)) {
                const changeStaged = yield repos[0].diffIndexWithHEAD(filePath);
                const changeModified = yield repos[0].diffWithHEAD(filePath);
                if ((changeModified || changeStaged) && (branch === null || branch === void 0 ? void 0 : branch.name) === element.branch) {
                }
                else {
                    changedElements.splice(index, 1);
                    storageManager.setValue(repoUrl, changedElements);
                }
            }
        }
    });
}
exports.default = UpdateChangedFiles;
//# sourceMappingURL=UpdateChangedFiles.js.map