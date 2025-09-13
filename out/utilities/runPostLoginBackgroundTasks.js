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
exports.runPostLoginBackgroundTasks = void 0;
const extension_1 = require("../extension");
const GetUserInfo_1 = require("../services/GetUserInfo");
const GetRules_1 = require("../services/GetRules");
const GetLicenseInfo_1 = require("../services/GetLicenseInfo");
const GetAddons_1 = require("../services/GetAddons");
const buttonQualityCenterSingleton_1 = require("./buttonQualityCenterSingleton");
function runPostLoginBackgroundTasks(storageManager, context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, GetUserInfo_1.default)(storageManager, context).catch((err) => { console.log('Error in getUserInfo:', err); });
        const authType = yield storageManager.getUserData('authType');
        let rulesTask = null;
        if (authType === 'apiKey') {
            // For API key, instanceId is available in userInfo
            rulesTask = (0, GetRules_1.default)(storageManager, context).catch((err) => { console.log('Error in getRules:', err); });
        }
        else if (authType === 'credentials') {
            // For credentials, only call getRules if a project is selected and has main-instance-id
            const selectedProject = yield storageManager.getUserData('selectedProject');
            const instanceId = (_a = selectedProject === null || selectedProject === void 0 ? void 0 : selectedProject.attributes) === null || _a === void 0 ? void 0 : _a['main-instance-id'];
            if (instanceId) {
                rulesTask = (0, GetRules_1.default)(storageManager, context, instanceId).catch((err) => { console.log('Error in getRules:', err); });
            }
        }
        const tasks = [
            rulesTask,
            (0, GetLicenseInfo_1.default)(storageManager, context).catch((err) => { console.log('Error in getLicenseInfo:', err); }),
            (0, GetAddons_1.default)(extension_1.env, storageManager, context).catch((err) => { console.log('Error in getAddons:', err); }),
        ].filter(Boolean);
        yield Promise.allSettled(tasks);
        // Always update Quality Center button visibility at the end
        yield (0, buttonQualityCenterSingleton_1.updateQualityCenterVisibility)(storageManager);
    });
}
exports.runPostLoginBackgroundTasks = runPostLoginBackgroundTasks;
//# sourceMappingURL=runPostLoginBackgroundTasks.js.map