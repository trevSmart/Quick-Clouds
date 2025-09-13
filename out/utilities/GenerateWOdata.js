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
const GetUserInfo_1 = require("../services/GetUserInfo");
function generateWOdata(context, issueslist, fullDocument, env, historyId, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, GetUserInfo_1.default)(storageManager, context);
        const user = yield storageManager.getUserData('userInfo');
        const { issuesWithWO, issues } = filterIssuesByWriteOffStatus(issueslist, user);
        const WOreasons = yield storageManager.getUserData('WOreasons');
        const documentBase64 = encodeDocumentToBase64(fullDocument);
        const WOdata = constructWriteOffState(documentBase64, user, issues, issuesWithWO, WOreasons);
        if (historyId) {
            yield storageManager.setWriteOffData(historyId, WOdata);
        }
        else {
            console.error("Failed to find historyId for WOdata.");
        }
    });
}
exports.default = generateWOdata;
function filterIssuesByWriteOffStatus(issueslist, user) {
    const issuesWithWO = [];
    const issues = [];
    issueslist.forEach(issue => {
        if (issue.writeOff) {
            switch (issue.writeOff.writeOffStatus) {
                case 'REQUESTED':
                    if (issue.writeOff.requester === user.developer) {
                        issuesWithWO.push(issue);
                    }
                    break;
                case 'APPROVED':
                    // Do nothing
                    break;
                case 'REJECTED':
                case 'DECLINED':
                case 'EXPIRED':
                    issues.push(issue);
                    break;
            }
        }
        else {
            issues.push(issue);
        }
    });
    return { issuesWithWO, issues };
}
function encodeDocumentToBase64(document) {
    const docEncode = Buffer.from(document);
    return docEncode.toString('base64');
}
function constructWriteOffState(documentBase64, user, issues, issuesWithWO, WOreasons) {
    return {
        fullDocument: documentBase64,
        developer: user.developer,
        issuesList: issues,
        reasonsList: WOreasons,
        devWriteOffsRequested: issuesWithWO,
        allowSourceCodePersistance: user.allowSourceCodePersistance,
        writeOffAssignmentType: user.writeOffAssignmentType
    };
}
//# sourceMappingURL=GenerateWOdata.js.map