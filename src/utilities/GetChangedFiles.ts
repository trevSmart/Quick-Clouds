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
function GetChangedFiles(document, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        if (document.uri.scheme === "file") {
            const filePath = document.uri.fsPath;
            if ((0, IsElementToAnalize_1.default)(filePath)) {
                var git = require("./GetGitData");
                //Get list of repositories available in current VS Code workspace
                const repos = git.gitdata.getAllRepos();
                //Get all modified and staged files
                const changeStaged = yield repos[0].diffIndexWithHEAD(filePath);
                const changeModified = yield repos[0].diffWithHEAD(filePath);
                //Get branch name and url of current repo
                const branch = repos[0].state.HEAD;
                const repoUrl = repos[0].rootUri.path;
                //File has a change in it
                if (changeModified || changeStaged) {
                    const changedElement = {
                        branch: branch === null || branch === void 0 ? void 0 : branch.name,
                        path: filePath,
                        uri: document.uri,
                        qualityGatesPassed: "Not scanned",
                    };
                    let changedElements = storageManager.getValue(repoUrl) === null
                        ? [changedElement]
                        : storageManager.getValue(repoUrl);
                    let fileOnList = undefined;
                    try {
                        changedElements.forEach((element) => {
                            Object.values(element).includes(filePath) &&
                                Object.values(element).includes(branch === null || branch === void 0 ? void 0 : branch.name)
                                ? (fileOnList = "found")
                                : null;
                        });
                    }
                    catch (error) {
                        console.log(error);
                    }
                    if (fileOnList !== "found") {
                        changedElements.push(changedElement);
                    }
                    storageManager.setValue(repoUrl, changedElements);
                    const inMemoryChangedElements = storageManager.getValue(repoUrl);
                    //File does not have any change in it
                }
                else {
                    let changedElements = storageManager.getValue(repoUrl);
                    try {
                        changedElements.forEach((element, index) => {
                            if (Object.values(element).includes(filePath) &&
                                Object.values(element).includes(branch === null || branch === void 0 ? void 0 : branch.name)) {
                                changedElements.splice(index, 1);
                            }
                        });
                        storageManager.setValue(repoUrl, changedElements);
                    }
                    catch (error) {
                        console.log(error);
                    }
                    const inMemoryChangedElements = storageManager.getValue(repoUrl);
                }
            }
        }
        ;
    });
}
exports.default = GetChangedFiles;
//# sourceMappingURL=GetChangedFiles.js.map