import * as vscode from 'vscode';
import axios from 'axios';
import { getAuthHeader } from '../utilities/getAuthHeader';
import { QC_CLIENT_HEADER, QC_CLIENT_NAME } from '../constants';
import { ApiService } from './ApiService';
import { DebugMode } from '../utilities/debugMode';

export interface Issue {
    id: string;
    issueType: string;
    severity: string;
    lineNumber: string;
    elementName: string;
    fileName?: string; // Added to store filename from history
    tags?: Array<{ name: string }>;
    qualityGateBreaker?: boolean;
    aboveRadar?: boolean;
    documentationURL: string;
    writeOff?: {
        writeOffStatus: string;
        validator?: string;
        validationReason?: string;
        expirationDate?: string;
        requestReason?: string;
        requester?: string;
        requestedDate?: string;
        requestDescription?: string;
    };
}

export interface BulkWriteOffRequest {
    issues: Issue[];
    reason: string;
    description: string;
    template?: string;
    applyToSimilar?: boolean;
}

export interface WriteOffTemplate {
    id: string;
    name: string;
    reason: string;
    description: string;
    category: string;
}

export class BulkWriteOffService {
    private static instance: BulkWriteOffService;
    private templates: WriteOffTemplate[] = [];

    private constructor() {
        this.initializeTemplates();
    }

    public static getInstance(): BulkWriteOffService {
        if (!BulkWriteOffService.instance) {
            BulkWriteOffService.instance = new BulkWriteOffService();
        }
        return BulkWriteOffService.instance;
    }

    private initializeTemplates(): void {
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

    public getTemplates(): WriteOffTemplate[] {
        return this.templates;
    }

    public getTemplatesByCategory(category: string): WriteOffTemplate[] {
        return this.templates.filter(template => template.category === category);
    }

    public async processBulkWriteOff(
        request: BulkWriteOffRequest,
        env: string,
        storageManager: any,
        context: vscode.ExtensionContext
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
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
                    } catch (error) {
                        results.failed++;
                        results.errors.push(`Issue ${issue.id} (${ruleType}): ${error.message}`);
                    }
                }
            } catch (error) {
                results.failed += issues.length;
                results.errors.push(`Rule group ${ruleType}: ${error.message}`);
            }
        }

        return results;
    }

    private groupIssuesByRule(issues: Issue[]): Map<string, Issue[]> {
        const grouped = new Map<string, Issue[]>();

        for (const issue of issues) {
            const ruleType = issue.issueType || 'Unknown';
            if (!grouped.has(ruleType)) {
                grouped.set(ruleType, []);
            }
            grouped.get(ruleType)!.push(issue);
        }

        return grouped;
    }

    private async requestWriteOff(
        issue: Issue,
        reason: string,
        description: string,
        env: string,
        storageManager: any,
        context: vscode.ExtensionContext
    ): Promise<any> {
        const debugMode = DebugMode.getInstance();

        // Check if we're in debug mode
        if (debugMode.shouldSimulateApiCalls()) {
            debugMode.log('BulkWriteOff: Simulating write-off request instead of making real API call');
            debugMode.log('BulkWriteOff: Simulated data:', {
                issueId: issue.id,
                issueType: issue.issueType,
                reason: reason,
                description: description,
                url: `${env}/api/v2/sf-live-check-issue/${issue.id}`
            });

            // Simulate a successful response
            const simulatedResponse = {
                data: {
                    attributes: {
                        "write-off": {
                            "write-off-status": "requested"
                        }
                    }
                }
            };

            debugMode.log('BulkWriteOff: Simulated response:', simulatedResponse);
            try { await storageManager.setWriteOffStatus(issue.id, 'REQUESTED', { source: 'debug' }); } catch (_) {}
            return simulatedResponse.data;
        }

        // Original implementation for non-debug mode
        const headers = {
            ...(await getAuthHeader(storageManager, context)),
            'Accept': 'application/vnd.api+json',
            [QC_CLIENT_HEADER]: QC_CLIENT_NAME,
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
            const response = await axios.patch(url, JSON.stringify(data), { headers });
            try { await storageManager.setWriteOffStatus(issue.id, 'REQUESTED', { source: 'api' }); } catch (_) {}
            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const authType = await storageManager.getUserData('authType');
                if (authType === 'credentials') {
                    const refreshTokenValue = await ApiService.getRefreshToken(storageManager);
                    return await ApiService.handle401AndRetry(
                        error,
                        () => axios.patch(url, JSON.stringify(data), { headers }),
                        refreshTokenValue,
                        (tokens) => ApiService.setTokens(storageManager, tokens)
                    );
                } else {
                    throw new Error(`API Error: ${error.response?.statusText || 'Unknown error'}`);
                }
            } else {
                throw new Error(`Request failed: ${error.message}`);
            }
        }
    }

    public async getSimilarIssues(issue: Issue, allIssues: Issue[]): Promise<Issue[]> {
        return allIssues.filter(otherIssue =>
            otherIssue.id !== issue.id &&
            otherIssue.issueType === issue.issueType &&
            otherIssue.severity === issue.severity
        );
    }

    public validateWriteOffRequest(request: BulkWriteOffRequest): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

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
