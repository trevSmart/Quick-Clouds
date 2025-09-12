import React, { useState, useEffect } from 'react';
import './App.css';

// Acquire VS Code API once per webview and cache on window
const vscode = (() => {
    if (typeof window !== 'undefined' && window.__vscodeApi) {
        return window.__vscodeApi;
    }
    if (typeof acquireVsCodeApi === 'function') {
        const api = acquireVsCodeApi();
        if (typeof window !== 'undefined') {
            window.__vscodeApi = api;
        }
        return api;
    }
    // Fallback mock for non-VS Code environments
    return {
        postMessage: () => { },
        getState: () => ({}),
        setState: () => { }
    };
})();

// Hardcoded write-off reasons from the extension
const HARDCODED_REASONS = [
    { id: 'Reason1', name: 'Complex solution, requires refactoring' },
    { id: 'Reason2', name: 'Insufficient time to fix and test' },
    { id: 'Reason3', name: 'Complex to test and validate all situations' },
    { id: 'Reason4', name: 'False positive rule' },
    { id: 'Reason5', name: 'Others' }
];

function App() {
    const [issues, setIssues] = useState([]);
    const [selectedIssues, setSelectedIssues] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [ruleFilter, setRuleFilter] = useState('');
    const [viewMode, setViewMode] = useState('single'); // 'bulk' or 'single'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'WOdata':
                    if (message.data) {
                        const data = JSON.parse(message.data);
                        console.log('WOdata received:', data.issues?.length, 'issues');
                        if (data.issues && data.issues.length > 0) {
                            console.log('First issue sample:', data.issues[0]);
                        }
                        setIssues(data.issues || []);
                    }
                    break;
                case 'templatesData':
                    setTemplates(JSON.parse(message.data));
                    break;
                default:
                    // Handle unknown commands silently
                    break;
            }
        });

        // Request initial data
        vscode.postMessage({ command: 'webviewLoaded' });
        vscode.postMessage({ command: 'getTemplates' });
    }, []);

    const filteredIssues = issues.filter(issue => {
        const matchesSeverity = severityFilter === 'all' || issue.severity.toLowerCase() === severityFilter.toLowerCase();
        const matchesRule = !ruleFilter || issue.issueType.toLowerCase().includes(ruleFilter.toLowerCase());
        return matchesSeverity && matchesRule;
    });

    const groupedIssues = filteredIssues.reduce((groups, issue) => {
        const ruleType = issue.issueType || 'Unknown';
        if (!groups[ruleType]) {
            groups[ruleType] = [];
        }
        groups[ruleType].push(issue);
        return groups;
    }, {});

    const handleIssueSelect = (issueId, isSelected) => {
        if (isSelected) {
            setSelectedIssues(prev => [...prev, issueId]);
        } else {
            setSelectedIssues(prev => prev.filter(id => id !== issueId));
        }
    };

    // Helper function to get issue ID (some issues use 'id', others use 'uuid')
    const getIssueId = (issue) => {
        return issue.id || issue.uuid;
    };

    const handleSelectAll = (ruleType) => {
        const ruleIssues = groupedIssues[ruleType] || [];
        const allSelected = ruleIssues.every(issue => selectedIssues.includes(getIssueId(issue)));

        if (allSelected) {
            // Deselect all issues in this rule
            setSelectedIssues(prev => prev.filter(id =>
                !ruleIssues.some(issue => getIssueId(issue) === id)
            ));
        } else {
            // Select all issues in this rule
            const newSelected = ruleIssues
                .filter(issue => !selectedIssues.includes(getIssueId(issue)))
                .map(issue => getIssueId(issue));
            setSelectedIssues(prev => [...prev, ...newSelected]);
        }
    };

    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setReason(template.reason);
            setDescription(template.description);
        }
    };

    const handleBulkWriteOff = () => {
        if (selectedIssues.length === 0) {
            alert('Please select at least one issue');
            return;
        }

        if (!reason.trim() || !description.trim()) {
            alert('Please provide both reason and description');
            return;
        }

        const selectedIssuesData = issues.filter(issue => selectedIssues.includes(getIssueId(issue)));

        setLoading(true);
        vscode.postMessage({
            command: 'bulkWriteoffRequest',
            data: {
                issues: selectedIssuesData,
                reason: reason.trim(),
                description: description.trim(),
                template: selectedTemplate
            }
        });
    };

    const handleSingleWriteOff = (issue) => {
        if (!reason.trim() || !description.trim()) {
            alert('Please provide both reason and description');
            return;
        }

        setLoading(true);
        vscode.postMessage({
            command: 'writeoffRequest',
            data: {
                ...issue,
                writeOff: {
                    requestReason: reason.trim(),
                    requestDescription: description.trim(),
                    requester: 'User',
                    requestedDate: new Date().toISOString()
                }
            }
        });
    };

    const getSeverityClass = (severity) => {
        if (!severity) {
            return 'severity-unknown';
        }
        return `severity-${severity.toLowerCase()}`;
    };

    return (
        <div className="writeoff-container">
            <div className="header">
                <h1>Request write-off</h1>
                <div className="view-toggle">
                    {viewMode === 'single' ? (
                        <button
                            className="toggle-btn"
                            onClick={() => {
                                console.log('Switching to bulk mode, current issues:', issues.length);
                                setViewMode('bulk');
                            }}
                        >
                            Switch to bulk mode
                        </button>
                    ) : (
                        <button
                            className="toggle-btn"
                            onClick={() => {
                                console.log('Switching to single mode, current issues:', issues.length);
                                if (issues.length > 0) {
                                    console.log('First issue in single mode:', issues[0]);
                                }
                                setViewMode('single');
                            }}
                        >
                            Switch to single mode
                        </button>
                    )}
                </div>
            </div>

            <div className="issues-section">
                <div className="filters">
                    <div className="filter-group">
                        <label>Filter by severity:</label>
                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                            <option value="Warning">Warning</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Filter by rule:</label>
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={ruleFilter}
                            onChange={(e) => setRuleFilter(e.target.value)}
                        />
                    </div>
                </div>

                {viewMode === 'bulk' ? (
                    <div className="bulk-mode">
                        <div className="bulk-header">
                            <h3>Select Issues ({selectedIssues.length} selected)</h3>
                            <button
                                onClick={handleBulkWriteOff}
                                disabled={loading || selectedIssues.length === 0}
                                className="bulk-submit-btn"
                            >
                                {loading ? 'Processing...' : `Submit ${selectedIssues.length} Write-offs`}
                            </button>
                        </div>

                        <div className="issues-list">
                            {Object.entries(groupedIssues).map(([ruleType, ruleIssues]) => (
                                <div key={ruleType} className="rule-group">
                                    <div className="rule-header">
                                        <h4>{ruleType} ({ruleIssues.length} issues)</h4>
                                        <button
                                            onClick={() => handleSelectAll(ruleType)}
                                            className="select-all-btn"
                                        >
                                            {ruleIssues.every(issue => selectedIssues.includes(getIssueId(issue))) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="issues-grid">
                                        {ruleIssues.map(issue => (
                                            <div key={`bulk-${issue.id || issue.uuid}`} className="issue-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIssues.includes(getIssueId(issue))}
                                                    onChange={(e) => handleIssueSelect(getIssueId(issue), e.target.checked)}
                                                />
                                                <div className="issue-details">
                                                    <div className="issue-line">{issue.fileName || 'Unknown file'}, line {issue.lineNumber}</div>
                                                    <div className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                                                        {issue.severity}
                                                    </div>
                                                    <div className="issue-element">{issue.elementName}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="single-mode">
                        <div className="issues-list">
                            {filteredIssues.map(issue => (
                                <div key={`single-${issue.id || issue.uuid}`} className="issue-item-single">
                                    <div className="issue-details">
                                        <div className="issue-header">
                                            <span className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                                                {issue.severity}
                                            </span>
                                            <span className="issue-rule">{issue.issueType}</span>
                                        </div>
                                        <div className="issue-line">{issue.fileName || 'Unknown file'}, line {issue.lineNumber}: {issue.elementName}</div>
                                    </div>
                                    <button
                                        onClick={() => handleSingleWriteOff(issue)}
                                        disabled={loading}
                                        className="single-submit-btn"
                                    >
                                        {loading ? 'Processing...' : 'Send'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="writeoff-form">
                <div className="form-group">
                    <label>Templates:</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                    >
                        <option value="">Select a template...</option>
                        {templates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Reason:</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    >
                        <option value="">Select a reason...</option>
                        {HARDCODED_REASONS.map(reasonOption => (
                            <option key={reasonOption.id} value={reasonOption.name}>
                                {reasonOption.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed description"
                        rows="3"
                    />
                </div>
            </div>

            <div className="footer">
                <p>Selected: {selectedIssues.length} issues | Total: {issues.length} issues</p>
            </div>
        </div>
    );
}

export default App;
