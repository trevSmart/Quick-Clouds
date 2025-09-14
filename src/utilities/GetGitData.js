"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
if ((_a = vscode.extensions.getExtension("vscode.git")) === null || _a === void 0 ? void 0 : _a.isActive) {
    const gitExtension = vscode.extensions.getExtension("vscode.git").exports;
    const git = gitExtension.getAPI(1);
    if (git.state === 'initialized') {
        module.exports.gitdata = {
            getAllRepos() {
                const repos = git.repositories;
                return repos;
            },
            getRepo() {
                const repos = git.repositories;
                const repoUrl = repos.length !== 0 ? repos[0].rootUri.path : "NO REPO";
                return repoUrl;
            },
            getBranch() {
                var _a;
                const repos = git.repositories;
                const branch = repos.length !== 0 ? (_a = repos[0].state.HEAD) === null || _a === void 0 ? void 0 : _a.name : "";
                return branch;
            },
        };
    }
    else {
        module.exports.gitdata = {
            getAllRepos() {
                const allRepos = [];
                return allRepos;
            },
            getRepo() {
                return "NO REPO";
            },
            getBranch() {
                return "";
            },
        };
    }
}
else {
    module.exports.gitdata = {
        getAllRepos() {
            const allRepos = [];
            return allRepos;
        },
        getRepo() {
            return "NO REPO";
        },
        getBranch() {
            return "";
        },
    };
}
//# sourceMappingURL=GetGitData.js.map