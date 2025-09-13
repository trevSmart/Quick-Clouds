"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeDataProvider = void 0;
const vscode = require("vscode");
const LocalStorageService_1 = require("../services/LocalStorageService");
const IsElementToAnalize_1 = require("../utilities/IsElementToAnalize");
const CommitBlocker_1 = require("./CommitBlocker");
class TreeDataProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
        /* this.data = this.refresh(context); */
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    runScan(item) {
        vscode.workspace.openTextDocument(item.resourceUri).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                vscode.commands.executeCommand('quick-clouds.check');
            });
        });
    }
    deleteAllData(context) {
        let storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        let allvalues = storageManager.getAllValues();
        allvalues.forEach((element) => {
            storageManager.setValue(element, null);
        });
    }
    updateHeader(view, context) {
        var _a;
        //Get list of repositories available in current VS Code workspace
        /* 		const repos = git.repositories;
                const repoUrl = repos[0].rootUri.path;
                const branch = repos[0].state.HEAD; */
        var git = require("./GetGitData");
        //Get list of repositories available in current VS Code workspace
        const repos = git.gitdata.getAllRepos();
        const repoUrl = repos.length !== 0 ? repos[0].rootUri.path : 'NO REPO';
        const branch = repos.length !== 0 ? (_a = repos[0].state.HEAD) === null || _a === void 0 ? void 0 : _a.name : '';
        let storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        let qgActive = storageManager.getValue('qualityGatesActive');
        if (!qgActive) {
            view.title = 'Not commited files';
        }
        else {
            let changedFiles = storageManager.getValue(repoUrl);
            changedFiles.length === 0 ? view.title = 'Modified files view' : null;
            for (let item of changedFiles) {
                //check if changes are from current branch
                if (item.branch === branch) {
                    if (!item.qualityGatesPassed || item.qualityGatesPassed === 'Not scanned') {
                        view.title = 'Quality Gates failed';
                        break;
                    }
                    else {
                        view.title = 'Quality Gates passed';
                    }
                }
            }
        }
    }
    updateCommitBlock(context) {
        var _a;
        let commitblocker = new CommitBlocker_1.CommitBlocker();
        let storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        let qgActive = storageManager.getValue('qualityGatesActive');
        let allowCompletionOnFail = storageManager.getValue('allowCompletionOnFail');
        /* 		const repos = git.repositories;
                const repoUrl = repos[0].rootUri.path;
                const branch = repos[0].state.HEAD; */
        var git = require("./GetGitData");
        //Get list of repositories available in current VS Code workspace
        const repos = git.gitdata.getAllRepos();
        const repoUrl = repos.length !== 0 ? repos[0].rootUri.path : '';
        const branch = repos.length !== 0 ? (_a = repos[0].state.HEAD) === null || _a === void 0 ? void 0 : _a.name : '';
        if (!qgActive) {
            commitblocker.removeBlock();
        }
        else {
            let changedFiles = storageManager.getValue(repoUrl);
            changedFiles.length === 0 ? commitblocker.removeBlock() : null;
            for (let item of changedFiles) {
                //check if changes are from current branch
                if (item.branch === branch) {
                    if (!item.qualityGatesPassed || item.qualityGatesPassed === 'Not scanned') {
                        if (!allowCompletionOnFail) {
                            commitblocker.addBlock(context);
                        }
                    }
                    else {
                        commitblocker.removeBlock();
                    }
                }
            }
        }
    }
    refresh(context) {
        var _a;
        let storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
        let items = [];
        var git = require("./GetGitData");
        //Get list of repositories available in current VS Code workspace
        const repos = git.gitdata.getAllRepos();
        const repoUrl = repos.length !== 0 ? repos[0].rootUri.path : '';
        const branch = repos.length !== 0 ? (_a = repos[0].state.HEAD) === null || _a === void 0 ? void 0 : _a.name : '';
        //Get list of repositories available in current VS Code workspace
        /* 			const repos = git.repositories;
                    const repoUrl = repos[0].rootUri.path;

                //while repoUrl is null, do nothing

                    const branch = repos[0].state.HEAD; */
        const newChanges = storageManager.getValue(repoUrl);
        //create a new tree item for each change
        /* if (newChanges) {
            newChanges.forEach(change => {
                const item = new TreeItem(change.uri);
                item.resourceUri = vscode.Uri.file(change.path);
                item.command = {
                    command: 'qc-sidebar-not-commited.runlivecheck',
                    arguments: [item],
                    title: 'Scan'
                };
                items.push(item);
            }
            );
        } */
        if (newChanges) {
            for (var i = 0; newChanges.length > i; i++) {
                if ((0, IsElementToAnalize_1.default)(newChanges[i].uri.path)) {
                    // need to add branch validation to show only the correct branch
                    if (newChanges[i].branch === branch) {
                        let qgActive = storageManager.getValue('qualityGatesActive');
                        let scan = storageManager.getValue(newChanges[i].uri.fsPath);
                        let qgStatus = false;
                        let qgInfo = '';
                        let numIssues = '';
                        if (scan === null || scan === void 0 ? void 0 : scan.issues[0].issueType.startsWith('0.-')) {
                            numIssues = 'No Issues';
                        }
                        else if ((scan === null || scan === void 0 ? void 0 : scan.issues) === undefined) {
                            numIssues = 'Not scanned yet';
                        }
                        else {
                            let displayWriteOff = vscode.workspace.getConfiguration("UserConfiguration").get("displayWriteOff");
                            let count = 0;
                            if (displayWriteOff) {
                                numIssues = JSON.stringify(scan === null || scan === void 0 ? void 0 : scan.issues.length) + ' Issues';
                            }
                            else {
                                for (var j = 0; (scan === null || scan === void 0 ? void 0 : scan.issues.length) > j; j++) {
                                    if (scan === null || scan === void 0 ? void 0 : scan.issues[j].writeOff) {
                                        if ((scan === null || scan === void 0 ? void 0 : scan.issues[j].writeOff.writeOffStatus) === 'APPROVED') {
                                            null;
                                        }
                                        else {
                                            count += 1;
                                        }
                                    }
                                    else {
                                        count += 1;
                                    }
                                }
                                ;
                                numIssues = JSON.stringify(count) + ' Issues';
                            }
                        }
                        if (!qgActive) {
                            items.push(new TreeItem(vscode.Uri.file(newChanges[i].uri.path), "qc-sidebar-not-commited.runlivecheck", undefined, undefined, numIssues, undefined));
                        }
                        else {
                            if ((scan === null || scan === void 0 ? void 0 : scan.qualityGates[0]) === undefined) {
                                qgInfo = 'Quality gates not evaluated';
                                qgStatus = false;
                            }
                            else {
                                if (scan === null || scan === void 0 ? void 0 : scan.qualityGates[0].passed) {
                                    qgInfo = 'Quality gates passed';
                                    qgStatus = true;
                                }
                                if (!(scan === null || scan === void 0 ? void 0 : scan.qualityGates[0].passed)) {
                                    qgInfo = 'Quality gates failed';
                                    qgStatus = false;
                                }
                            }
                            let qcStatus = [];
                            qcStatus.push(new TreeItem(vscode.Uri.file(newChanges[i].uri.path), "qualityclouds.empty", qgInfo, undefined, undefined));
                            items.push(new TreeItem(vscode.Uri.file(newChanges[i].uri.path), "qc-sidebar-not-commited.runlivecheck", undefined, qgStatus, numIssues, qcStatus));
                        }
                    }
                }
            }
        }
        this.data = items;
        this._onDidChangeTreeData.fire();
        return this.data;
    }
}
exports.TreeDataProvider = TreeDataProvider;
class TreeItem extends vscode.TreeItem {
    constructor(resourceUri, commandId, label, qualityGatesPassed, numberIssues, children) {
        super(resourceUri, children === undefined ? vscode.TreeItemCollapsibleState.None :
            vscode.TreeItemCollapsibleState.Expanded);
        /* 			const command = {
                        "command": commandId,
                        "title": 'Quality Clouds'
                    };
                    this.command = command; */
        this.label = label;
        this.description = numberIssues,
            this.children = children,
            this.qualityGatesPassed = qualityGatesPassed;
    }
}
//# sourceMappingURL=TreeDataProvider.js.map