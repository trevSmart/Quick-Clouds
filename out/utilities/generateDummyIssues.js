"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDummyIssues = generateDummyIssues;
exports.addDummyIssuesIfDebugMode = addDummyIssuesIfDebugMode;
/**
 * Generates dummy issues for debug mode testing
 * Returns 3 issues with different severity levels: High, Medium, Low
 */
function generateDummyIssues(fileName, cePath) {
    const file = fileName || 'debugFile.js';
    const path = cePath || '';
    const dummyIssues = [
        {
            id: 'debug-issue-high-002',
            ruleName: 'DebugHighRule',
            message: '[DEBUG] This is a dummy high severity issue for testing purposes',
            line: 25,
            severity: 'High',
            issueType: 'Debug High Rule',
            elementName: file,
            lineNumber: 25,
            cePath: path
        },
        {
            id: 'debug-issue-medium-003',
            ruleName: 'DebugMediumRule',
            message: '[DEBUG] This is a dummy medium severity issue for testing purposes',
            line: 42,
            severity: 'Medium',
            issueType: 'Debug Medium Rule',
            elementName: file,
            lineNumber: 42,
            cePath: path
        },
        {
            id: 'debug-issue-low-004',
            ruleName: 'DebugLowRule',
            message: '[DEBUG] This is a dummy low severity issue for testing purposes',
            line: 58,
            severity: 'Low',
            issueType: 'Debug Low Rule',
            elementName: file,
            lineNumber: 58,
            cePath: path
        }
    ];
    return dummyIssues;
}
/**
 * Adds dummy issues to the existing issues array when in debug mode
 * Ensures no duplication across repeated live checks per file/path.
 * @param existingIssues - Array of existing issues from the API
 * @param isDebugMode - Whether we are in debug mode
 * @returns Combined array of existing issues + dummy issues
 */
function addDummyIssuesIfDebugMode(existingIssues, isDebugMode, fileName, cePath) {
    if (!isDebugMode) {
        return existingIssues;
    }

    // Track per-path addition to avoid re-adding on subsequent live checks
    if (!global.__qc_debug_dummy_added_for_path) {
        global.__qc_debug_dummy_added_for_path = new Set();
    }
    const addedForPath = global.__qc_debug_dummy_added_for_path;
    const key = (cePath && cePath.trim()) || (fileName && fileName.trim()) || 'unknown';

    // Remove any existing dummy issues from the incoming list just in case
    const hasDummy = (issue) => typeof (issue === null || issue === void 0 ? void 0 : issue.id) === 'string' && issue.id.startsWith('debug-issue-');
    const filteredExisting = Array.isArray(existingIssues) ? existingIssues.filter(i => !hasDummy(i)) : [];

    if (addedForPath.has(key)) {
        console.log(`[DEBUG] Dummy issues already injected for '${key}'. Skipping to avoid duplication on repeat live check.`);
        return filteredExisting;
    }

    const dummyIssues = generateDummyIssues(fileName, cePath);
    const combinedIssues = [...filteredExisting, ...dummyIssues];

    addedForPath.add(key);
    console.log(`[DEBUG] Added ${dummyIssues.length} dummy issues to ${existingIssues.length} real issues (key='${key}')`);
    console.log('[DEBUG] Dummy issues:', dummyIssues);
    return combinedIssues;
}
//# sourceMappingURL=generateDummyIssues.js.map
