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
exports.handleLicenseInfo = void 0;
const extension_1 = require("../extension");
const GetLicenseInfo_1 = require("../services/GetLicenseInfo");
const GetAddons_1 = require("../services/GetAddons");
function findAddonByName(addons, nameId) {
    return addons.find(addon => { var _a; return ((_a = addon.attributes) === null || _a === void 0 ? void 0 : _a['name-id']) === nameId; }) || null;
}
function isAddonLicensed(licenseInfo, addonId) {
    return Array.isArray(licenseInfo['add-on-ids']) && licenseInfo['add-on-ids'].includes(addonId);
}
function handleLicenseInfo(storageManager, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let addons = yield (0, GetAddons_1.default)(extension_1.env, storageManager, context);
        let licenseInfo = yield (0, GetLicenseInfo_1.default)(storageManager, context);
        if (addons && Array.isArray(addons)) {
            const coPilotAddon = findAddonByName(addons, 'qc_copilot_sf');
            if (coPilotAddon) {
                const coPilotAddonId = coPilotAddon.id;
                if (isAddonLicensed(licenseInfo, coPilotAddonId)) {
                    yield storageManager.setUserData('hasQCCopilot', true);
                }
                else {
                    yield storageManager.setUserData('hasQCCopilot', false);
                }
            }
        }
    });
}
exports.handleLicenseInfo = handleLicenseInfo;
//# sourceMappingURL=handleLicenseInfo.js.map