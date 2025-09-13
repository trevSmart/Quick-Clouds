"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkWriteOffService = void 0;
const axios_2 = __importDefault(require("axios"));
const getAuthHeader_1 = require("../utilities/getAuthHeader");
const constants_1 = require("../constants");
const ApiService_1 = require("./ApiService");
class BulkWriteOffService {
    constructor() {
        this.templates = [];
        this.initializeTemplates();
    }
    static getInstance() {
        if (!BulkWriteOffService.instance) {
            BulkWriteOffService.instance = new BulkWriteOffService();
        }
        return BulkWriteOffService.instance;
    }
    initializeTemplates() {
        this.templates = [
            {
                id: 'false_positive',
                name: 'False Positive Rule',
                reason: 'False positive rule',
                description: 'This rule is incorrectly flagging valid code as an issue.',
                category: 'Common'
            },
            {
                id: 'business_requirement',
                name: 'Business Requirement',
                reason: 'Business requirement',
                description: 'This code follows a specific business requirement that overrides the rule.',
                category: 'Common'
            },
            {
                id: 'legacy_code',
                name: 'Legacy Code',
                reason: 'Legacy code',
                description: 'This is legacy code that will be refactored in a future sprint.',
                category: 'Common'
            },
            {
                id: 'performance_optimization',
                name: 'Performance Optimization',
                reason: 'Performance optimization',
                description: 'This code is optimized for performance and the rule does not apply.',
                category: 'Technical'
            },
            {
                id: 'third_party_integration',
                name: 'Third Party Integration',
                reason: 'Third party integration',
                description: 'This code is required for third-party integration compatibility.',
                category: 'Integration'
            }
        ];
    }
    getTemplates() {
        return this.templates;
    }
    getTemplatesByCategory(category) {
        return this.templates.filter(template => template.category === category);
    }
    async processBulkWriteOff(request, env, storageManager, context) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        // Group issues by rule type for better organization
        const groupedIssues = this.groupIssuesByRule(request.issues);
        for (const [ruleType, issues] of groupedIssues) {
            try {
                // Process each issue in the group
                for (const issue of issues) {
                    try {
                        await this.requestWriteOff(issue, request.reason, request.description, env, storageManager, context);
                        results.success++;
                    }
                    catch (error) {
                        results.failed++;
                        results.errors.push(`Issue ${issue.id} (${ruleType}): ${error.message}`);
                    }
                }
            }
            catch (error) {
                results.failed += issues.length;
                results.errors.push(`Rule group ${ruleType}: ${error.message}`);
            }
        }
        return results;
    }
    groupIssuesByRule(issues) {
        const grouped = new Map();
        for (const issue of issues) {
            const ruleType = issue.issueType || 'Unknown';
            if (!grouped.has(ruleType)) {
                grouped.set(ruleType, []);
            }
            grouped.get(ruleType).push(issue);
        }
        return grouped;
    }
    async requestWriteOff(issue, reason, description, env, storageManager, context) {
        // Respect DEBUG mode: simulate instead of sending
        try {
            const dbg = require("../utilities/debugMode")?.DebugMode?.getInstance?.();
            if (dbg?.shouldSimulateApiCalls?.()) {
                dbg.log('BulkWriteOff: Simulating write-off request instead of making real API call', {
                    issueId: issue.id,
                    issueType: issue.issueType,
                    reason,
                    description,
                    url: `${env}/api/v2/sf-live-check-issue/${issue.id}`
                });
                const simulatedResponse = {
                    data: {
                        attributes: {
                            "write-off": {
                                "write-off-status": "requested"
                            }
                        }
                    }
                };
                return simulatedResponse.data;
            }
        } catch (_) { }

        const headers = {
            ...(await (0, getAuthHeader_1.getAuthHeader)(storageManager, context)),
            'Accept': 'application/vnd.api+json',
            [constants_1.QC_CLIENT_HEADER]: constants_1.QC_CLIENT_NAME,
            'Content-type': 'application/vnd.api+json'
        };
        const url = `${env}/api/v2/sf-live-check-issue/${issue.id}`;
        const data = {
            data: {
                ...issue,
                writeOff: {
                    requestReason: reason,
                    requestDescription: description,
                    requester: 'User', // This should come from user data
                    requestedDate: new Date().toISOString()
                }
            }
        };
        try {
            const response = await axios_2.default.patch(url, JSON.stringify(data), { headers });
            return response.data.data;
        }
        catch (error) {
            if (axios_2.default.isAxiosError(error)) {
                const authType = await storageManager.getUserData('authType');
                if (authType === 'credentials') {
                    const refreshTokenValue = await ApiService_1.ApiService.getRefreshToken(storageManager);
                    return await ApiService_1.ApiService.handle401AndRetry(error, () => axios_2.default.patch(url, JSON.stringify(data), { headers }), refreshTokenValue, (tokens) => ApiService_1.ApiService.setTokens(storageManager, tokens));
                }
                else {
                    throw new Error(`API Error: ${error.response?.statusText || 'Unknown error'}`);
                }
            }
            else {
                throw new Error(`Request failed: ${error.message}`);
            }
        }
    }
    async getSimilarIssues(issue, allIssues) {
        return allIssues.filter(otherIssue => otherIssue.id !== issue.id &&
            otherIssue.issueType === issue.issueType &&
            otherIssue.severity === issue.severity);
    }
    validateWriteOffRequest(request) {
        const errors = [];
        if (!request.issues || request.issues.length === 0) {
            errors.push('No issues selected for write-off');
        }
        if (!request.reason || request.reason.trim() === '') {
            errors.push('Write-off reason is required');
        }
        if (!request.description || request.description.trim() === '') {
            errors.push('Write-off description is required');
        }
        // Check for duplicate issues
        const issueIds = request.issues.map(issue => issue.id);
        const uniqueIds = new Set(issueIds);
        if (issueIds.length !== uniqueIds.size) {
            errors.push('Duplicate issues detected in selection');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.BulkWriteOffService = BulkWriteOffService;
