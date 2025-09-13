"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectBaseUrl = exports.AuthBaseUrl = exports.CallbackUri = exports.Env = void 0;
var Env;
(function (Env) {
    Env["DEV"] = "https://api-development.qualityclouds.com";
    Env["PRE"] = "https://api-staging.qualityclouds.com";
    Env["PROD"] = "https://api.qualityclouds.com";
})(Env = exports.Env || (exports.Env = {}));
var CallbackUri;
(function (CallbackUri) {
    CallbackUri["DEFAULT"] = "vscode://QualityClouds.livecheckqualityforsalesforce";
})(CallbackUri = exports.CallbackUri || (exports.CallbackUri = {}));
var AuthBaseUrl;
(function (AuthBaseUrl) {
    AuthBaseUrl["DEV"] = "https://id-development.qualityclouds.com";
    AuthBaseUrl["PRE"] = "https://id-staging.qualityclouds.com";
    AuthBaseUrl["PROD"] = "https://id.qualityclouds.com";
})(AuthBaseUrl = exports.AuthBaseUrl || (exports.AuthBaseUrl = {}));
var RedirectBaseUrl;
(function (RedirectBaseUrl) {
    RedirectBaseUrl["DEV"] = "https://bi-development.qualityclouds.com";
    RedirectBaseUrl["PRE"] = "https://bi-staging.qualityclouds.com";
    RedirectBaseUrl["PROD"] = "https://bi.qualityclouds.com";
})(RedirectBaseUrl = exports.RedirectBaseUrl || (exports.RedirectBaseUrl = {}));
//# sourceMappingURL=env.js.map