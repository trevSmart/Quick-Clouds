"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const LocalStorageService_1 = require("./LocalStorageService");
const vscode = require("vscode");
function getApprovers(context, env) {
    let storageManager = new LocalStorageService_1.LocalStorageService(context.globalState);
    let user = storageManager.getValue('userInfo');
    let apiKey = "Bearer " + vscode.workspace.getConfiguration("UserConfiguration").get("API-key");
    const options = {
        method: 'GET',
        url: env + '/api/v2/user?filter%5Bcustomer_id%5D=' + user.customerID + '&filter%5Bis_approver%5D=true&filter%5Bactive%5D=true',
        headers: {
            'Authorization': apiKey,
            'Client-Name': 'SalesforceVSCPlugin'
        }
    };
    axios_1.default.request(options).then(function (response) {
        storageManager.setValue('approversList', {
            approversList: response.data.data
        });
    }).catch(function (error) {
        console.error(error);
    });
}
exports.default = getApprovers;
;
//# sourceMappingURL=GetApprovers.js.map