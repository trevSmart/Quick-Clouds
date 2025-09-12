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
exports.initializeExtension = void 0;
const vscode = require("vscode");
const Database_1 = require("../data/Database");
const LocalStorageService_1 = require("../services/LocalStorageService");
const MementoStorageService_1 = require("../services/MementoStorageService");
const MigrationService_1 = require("../services/MigrationService");
const CreateCodeAction_1 = require("./CreateCodeAction");
const handleAuthenticationMethod_1 = require("./handleAuthenticationMethod");
const constants_1 = require("../constants");
function initializeExtension(context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const dbPath = `${context.globalStorageUri.fsPath}/data.sql`;
        let storageManager;
        try {
            (0, Database_1.initializeDatabase)(dbPath);
            storageManager = new LocalStorageService_1.LocalStorageService(dbPath);
        }
        catch (error) {
            storageManager = new MementoStorageService_1.MementoStorageService(context.globalState);
        }
        yield (0, CreateCodeAction_1.registerCodeActionProvider)(context, storageManager);
        let migrationWasDone;
        try {
            migrationWasDone = (_a = (yield storageManager.getUserData('migrationWasDone'))) !== null && _a !== void 0 ? _a : undefined;
        }
        catch (error) {
            migrationWasDone = false;
        }
        if (!migrationWasDone) {
            const migrationService = new MigrationService_1.MigrationService(context.globalState, storageManager, dbPath);
            try {
                yield migrationService.migrateUserData();
                migrationWasDone = true;
                storageManager.setUserData('migrationWasDone', migrationWasDone);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to migrate user data: ' + error.message);
                throw error;
            }
        }
        let apiKey = vscode.workspace.getConfiguration("UserConfiguration").get("API-key")
            ? String(vscode.workspace.getConfiguration("UserConfiguration").get("API-key"))
            : yield storageManager.getUserData('apiKey');
        if (!apiKey) {
            const legacyApiKey = yield storageManager.getUserData('apiKEY');
            if (legacyApiKey) {
                apiKey = legacyApiKey;
                yield storageManager.setUserData('apiKey', legacyApiKey);
            }
        }
        let didSetDefaultAuthType = yield storageManager.getUserData('didSetDefaultAuthType');
        let defaultAuthType = 'credentials';
        if (!didSetDefaultAuthType) {
            if (apiKey && apiKey.trim() !== "") {
                defaultAuthType = 'apiKey';
                yield storageManager.setUserData('apiKey', apiKey);
            }
        }
        let apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
        let didRunEnvFetch = false;
        if (apiKey && (!apiKeyStatus || typeof apiKeyStatus.statusCode !== 'number')) {
            const { validateApiKey } = yield Promise.resolve().then(() => require('./validateApiKey'));
            const dummyStatusBar = vscode.window.createStatusBarItem();
            yield validateApiKey(storageManager, dummyStatusBar, context, apiKey);
            apiKeyStatus = yield storageManager.getUserData('apiKeyStatus');
            dummyStatusBar.dispose();
            didRunEnvFetch = true;
        }
        if (apiKey &&
            apiKeyStatus && typeof apiKeyStatus.statusCode === 'number' && apiKeyStatus.statusCode === 200 &&
            !didRunEnvFetch) {
            const { fetchUserEnvironment } = yield Promise.resolve().then(() => require('./fetchUserEnvironment'));
            yield fetchUserEnvironment(storageManager, context);
        }
        let authType = yield storageManager.getUserData('authType');
        if (!authType && !didSetDefaultAuthType) {
            authType = defaultAuthType;
            if (authType === 'apiKey') {
                yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, authType, { apiKeyStatus });
            }
            else {
                yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, authType, { isAuthenticated: false });
            }
            yield storageManager.setUserData('didSetDefaultAuthType', true);
        }
        else if (!authType) {
            authType = 'credentials';
            yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, authType, { isAuthenticated: false });
        }
        let isAuthenticated;
        if (authType === 'apiKey') {
            isAuthenticated = !!(apiKeyStatus && apiKeyStatus.statusCode === constants_1.HTTP_STATUS_OK);
        }
        else {
            isAuthenticated = (_b = yield storageManager.getUserData('isAuthenticated')) !== null && _b !== void 0 ? _b : false;
        }
        const authStatus = yield (0, handleAuthenticationMethod_1.handleAuthenticationMethod)(storageManager, authType, authType === 'apiKey' ? { apiKeyStatus } : { isAuthenticated });
        console.log('authStatus:', authStatus);
        return { apiKey, apiKeyStatus, storageManager, authType, isAuthenticated };
    });
}
exports.initializeExtension = initializeExtension;
//# sourceMappingURL=initializeExtension.js.map