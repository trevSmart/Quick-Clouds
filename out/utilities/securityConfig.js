"use strict";
/**
 * Security configuration and validation utilities for Quick Clouds extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityConfig = void 0;
class SecurityConfig {
    /**
     * Validates a file path to prevent path traversal attacks
     */
    static validateFilePath(filePath, basePath) {
        if (!filePath || !basePath) {
            return false;
        }
        const normalizedBase = require('path').resolve(basePath);
        const normalizedPath = require('path').resolve(filePath);
        // Check if the resolved path is within the base path
        return normalizedPath.startsWith(normalizedBase);
    }
    /**
     * Validates a key for storage operations
     */
    static validateStorageKey(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }
        // Check length
        if (key.length > this.MAX_KEY_LENGTH) {
            return false;
        }
        // Check for potentially dangerous characters
        const dangerousChars = /[<>:"|?*\x00-\x1f]/;
        return !dangerousChars.test(key);
    }
    /**
     * Validates file extension for analysis
     */
    static isAllowedFileExtension(filePath) {
        const ext = require('path').extname(filePath).toLowerCase();
        return this.ALLOWED_EXTENSIONS.has(ext);
    }
    /**
     * Sanitizes user input to prevent XSS
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 1000); // Limit length
    }
    /**
     * Validates API key format
     */
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        // Basic format validation - adjust based on your API key format
        return apiKey.length >= 10 && apiKey.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
    }
}
exports.SecurityConfig = SecurityConfig;
// Maximum allowed values to prevent DoS attacks
SecurityConfig.MAX_KEY_LENGTH = 255;
SecurityConfig.MAX_VALUE_SIZE = 1024 * 1024; // 1MB
SecurityConfig.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// Allowed file extensions for analysis
SecurityConfig.ALLOWED_EXTENSIONS = new Set([
    '.cls', '.trigger', '.js', '.ts', '.html', '.css', '.xml', '.json',
    '.cmp', '.component', '.page', '.app', '.evt', '.tokens'
]);
// Excluded directories for security
SecurityConfig.EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'out', 'webview-ui', 'build', 'tmp',
    '.vscode', 'dist', 'coverage', '.nyc_output', '.cache'
]);
//# sourceMappingURL=securityConfig.js.map