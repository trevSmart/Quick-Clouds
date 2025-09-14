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
exports.QualityCloudsUriHandler = void 0;
const vscode = require("vscode");
class QualityCloudsUriHandler {
    constructor(context) {
        this.context = context;
    }
    handleUri(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams(uri.query);
            const state = params.get('state');
            const otp = params.get('otp');
            const expectedState = this.context.globalState.get('qualityclouds.oauthState');
            if (!state || !expectedState || state !== expectedState) {
                vscode.window.showErrorMessage('Invalid or missing security state parameter. Please try again.');
                yield this.context.globalState.update('qualityclouds.oauthState', undefined);
                return;
            }
            yield this.context.globalState.update('qualityclouds.oauthState', undefined);
            if (otp) {
                yield this.context.secrets.store('qualityclouds.otp', otp);
                yield vscode.commands.executeCommand('quick-clouds.getToken');
            }
            else {
                vscode.window.showErrorMessage('Authentication failed: No OTP found');
            }
        });
    }
}
exports.QualityCloudsUriHandler = QualityCloudsUriHandler;
//# sourceMappingURL=uriHandler.js.map