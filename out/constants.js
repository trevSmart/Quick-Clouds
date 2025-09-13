"use strict";
// Shared constants for Quick Clouds extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS_SERVER_ERROR = exports.HTTP_STATUS_FORBIDDEN = exports.HTTP_STATUS_UNAUTHORIZED = exports.HTTP_STATUS_OK = exports.CMD_DISCARD_CHANGES = exports.CMD_APPLY_CHANGES = exports.CMD_SETTINGS = exports.CMD_VALIDATE_APIKEY = exports.CMD_WRITE_OFF = exports.CMD_LIVECHECK = exports.CMD_MY_ISSUES = exports.QC_CLIENT_HEADER = exports.QC_CLIENT_NAME = void 0;
// API/HTTP/Client constants
exports.QC_CLIENT_NAME = 'SalesforceVSCPlugin';
exports.QC_CLIENT_HEADER = 'Client-Name';
// Command IDs
exports.CMD_MY_ISSUES = 'quick-clouds.myIssues';
exports.CMD_LIVECHECK = 'quick-clouds.check';
exports.CMD_WRITE_OFF = 'quick-clouds.writeoff';
exports.CMD_VALIDATE_APIKEY = 'quick-clouds.validateAPIKey';
exports.CMD_SETTINGS = 'quick-clouds.settings';
exports.CMD_APPLY_CHANGES = 'quick-clouds.applyChanges';
exports.CMD_DISCARD_CHANGES = 'quick-clouds.discardChanges';
// HTTP Status Codes
exports.HTTP_STATUS_OK = 200;
exports.HTTP_STATUS_UNAUTHORIZED = 401;
exports.HTTP_STATUS_FORBIDDEN = 403;
exports.HTTP_STATUS_SERVER_ERROR = 500;
//# sourceMappingURL=constants.js.map