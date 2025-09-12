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
exports.executeLiveCheck = void 0;
const vscode = require("vscode");
const handleLicenseInfo_1 = require("./handleLicenseInfo");
const GetWriteOffReasons_1 = require("../services/GetWriteOffReasons");
const LiveCheck_1 = require("../services/LiveCheck");
const UpdateDiagnostics_1 = require("./UpdateDiagnostics");
const logger_1 = require("./logger");
function executeLiveCheck(context, newWO, storageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: 'Running LiveCheck'
            }, () => __awaiter(this, void 0, void 0, function* () {
                const { response, documentPath } = yield (0, LiveCheck_1.runLivecheck)(context, storageManager);

                // Log final results
                const logger = logger_1.QC2Logger.getInstance();
                logger.info('ExecuteLiveCheck: LiveCheck completed successfully');
                logger.info('ExecuteLiveCheck: Final issues count: ' + (response ? response.length : 'No response'));
                logger.info('ExecuteLiveCheck: Document path: ' + documentPath);

                if (documentPath && (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document.uri.fsPath !== documentPath)) {
                    yield vscode.window.showTextDocument(vscode.Uri.file(documentPath), { preview: false });
                }
                if (vscode.window.activeTextEditor) {
                    yield (0, UpdateDiagnostics_1.updateDiagnostics)(vscode.window.activeTextEditor.document, response, context, storageManager);
                    newWO.show();
                }
                if (response.length > 0) {
                    vscode.window.showInformationMessage("LiveCheck completed");
                    (0, GetWriteOffReasons_1.default)(storageManager, context);
                    yield (0, handleLicenseInfo_1.handleLicenseInfo)(storageManager, context);
                } else {
                    logger.info('ExecuteLiveCheck: No issues found, no write-off panel will be shown');
                }
            }));
        }
        catch (error) {
            const logger = logger_1.QC2Logger.getInstance();
            logger.error('ExecuteLiveCheck failed:', error);

            // Enhanced error message
            const errorMessage = error.message || error.toString();
            const detailedMessage = `LiveCheck execution failed: ${errorMessage}`;

            vscode.window.showInformationMessage(detailedMessage);
            logger.error('LiveCheck execution error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
    });
}
exports.executeLiveCheck = executeLiveCheck;
//# sourceMappingURL=executeLiveCheck.js.map