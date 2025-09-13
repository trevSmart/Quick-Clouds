// Shared constants for Quick Clouds extension

// API/HTTP/Client constants
export const QC_CLIENT_NAME = 'SalesforceVSCPlugin';
export const QC_CLIENT_HEADER = 'Client-Name';

// Command IDs
export const CMD_MY_ISSUES = 'quick-clouds.myIssues';
export const CMD_LIVECHECK = 'quick-clouds.check';
export const CMD_WRITE_OFF = 'quick-clouds.writeoff';
export const CMD_VALIDATE_APIKEY = 'quick-clouds.validateAPIKey';
export const CMD_SETTINGS = 'quick-clouds.settings';
export const CMD_APPLY_CHANGES = 'quick-clouds.applyChanges';
export const CMD_DISCARD_CHANGES = 'quick-clouds.discardChanges';

// HTTP Status Codes
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_SERVER_ERROR = 500;