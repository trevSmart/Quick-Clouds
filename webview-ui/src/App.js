import React, { useState, useEffect, useRef } from 'react';
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
    const [selectedIssue, setSelectedIssue] = useState(null); // For single mode
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [ruleFilter, setRuleFilter] = useState('');
    const [viewMode, setViewMode] = useState('single'); // 'bulk' or 'single'
    const [loading, setLoading] = useState(false);
    const [historyId, setHistoryId] = useState(null);
    const [historyPath, setHistoryPath] = useState(null);

    // Reference to the reason select element
    const reasonSelectRef = useRef(null);

    // Extract the element name without duplicated file information
    const getCleanElementName = (issue) => {
        if (!issue?.elementName) {
            return '';
        }

        const file = issue.fileName;
        if (file) {
            const suffix = ` - ${file}`;
            if (issue.elementName.endsWith(suffix)) {
                return issue.elementName.slice(0, -suffix.length);
            }
        }
        return issue.elementName;
    };

    // Format line information for single issue view
    const formatIssueLine = (issue) => {
        const element = getCleanElementName(issue);
        const base = `${issue.fileName || 'Unknown file'}, line ${issue.lineNumber}`;
        return element ? `${base}: ${element}` : base;
    };

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
                        if (typeof data.historyId !== 'undefined') {
                            setHistoryId(data.historyId);
                        }
                        if (typeof data.historyPath !== 'undefined') {
                            setHistoryPath(data.historyPath);
                        }
                        if (data.preselect) {
                            const { fileName, lineNumber } = data.preselect;
                            const match = (data.issues || []).find(
                                issue => issue.fileName === fileName && String(issue.lineNumber) === String(lineNumber)
                            );
                            if (match) {
                                setSelectedIssue(match);
                            }
                        }
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
        // First filter by severity
        const matchesSeverity = severityFilter === 'all' || issue.severity.toLowerCase() === severityFilter.toLowerCase();

        if (!matchesSeverity) {
            return false;
        }

        // Then apply text filter if provided
        if (!ruleFilter) {
            return true;
        }

        const searchTerm = ruleFilter.toLowerCase();
        const severity = (issue.severity || '').toLowerCase();
        const rule = (issue.issueType || '').toLowerCase();
        const fileName = (issue.fileName || '').toLowerCase();
        const lineNumber = (issue.lineNumber || '').toString();
        const elementName = (issue.elementName || '').toLowerCase();

        return severity.includes(searchTerm) ||
            rule.includes(searchTerm) ||
            fileName.includes(searchTerm) ||
            lineNumber.includes(searchTerm) ||
            elementName.includes(searchTerm);
    });

    const groupedIssues = filteredIssues.reduce((groups, issue) => {
        const ruleType = issue.issueType || 'Unknown';
        if (!groups[ruleType]) {
            groups[ruleType] = [];
        }
        groups[ruleType].push(issue);
        return groups;
    }, {});

    // Calculate severity statistics
    const getSeverityStats = (issuesList) => {
        const stats = {
            high: 0,
            medium: 0,
            low: 0,
            warning: 0,
            unknown: 0
        };

        issuesList.forEach(issue => {
            const severity = (issue.severity || '').toLowerCase();
            switch (severity) {
                case 'high':
                    stats.high++;
                    break;
                case 'medium':
                    stats.medium++;
                    break;
                case 'low':
                    stats.low++;
                    break;
                case 'warning':
                    stats.warning++;
                    break;
                default:
                    stats.unknown++;
                    break;
            }
        });

        return stats;
    };

    const severityStats = getSeverityStats(issues);

    const handleIssueSelect = (issueId, isSelected) => {
        if (isSelected) {
            setSelectedIssues(prev => [...prev, issueId]);
        } else {
            setSelectedIssues(prev => prev.filter(id => id !== issueId));
        }
    };

    const handleOpenInEditor = (issue, e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
            e.preventDefault();
        }
        try {
            vscode.postMessage({
                command: 'openFileAtLine',
                data: {
                    historyId,
                    historyPath, // optional hint for backend
                    fileName: issue.fileName,
                    lineNumber: issue.lineNumber
                }
            });
        } catch (_) { }
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

    const handleIssueSelection = (issue) => {
        const issueId = issue.id || issue.uuid;
        console.log('Selecting issue:', issueId, issue);
        console.log('Current selectedIssue:', selectedIssue);

        // Only select this specific issue
        setSelectedIssue(issue);

        // Clear bulk mode selection when selecting in single mode
        setSelectedIssues([]);

        console.log('After selection - selectedIssue will be:', issue);
    };

    const handleSingleWriteOff = () => {
        if (!selectedIssue) {
            alert('Please select an issue first');
            return;
        }

        if (!reason.trim() || !description.trim()) {
            alert('Please provide both reason and description');
            return;
        }

        setLoading(true);
        vscode.postMessage({
            command: 'writeoffRequest',
            data: {
                ...selectedIssue,
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
                                setSelectedIssue(null); // Clear single mode selection
                            }}
                        >
                            Bulk mode
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
                                setSelectedIssues([]); // Clear bulk mode selection
                            }}
                        >
                            Single mode
                        </button>
                    )}
                </div>
            </div>

            <div className="section-title issues-title">
                <h2>Issues</h2>
            </div>
            <div className="issues-section">
                <div className="filters">
                    <div className="filter-group">
                        <label>Severity:</label>
                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                            <option value="Warning">Warning</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Filter:</label>
                        <input
                            type="text"
                            placeholder="Type to filter"
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
                                                    <div className="issue-line">
                                                        <button
                                                            className="issue-link"
                                                            title="Open file at this line"
                                                            onClick={(e) => handleOpenInEditor(issue, e)}
                                                        >
                                                            {issue.fileName || 'Unknown file'}, line {issue.lineNumber}
                                                        </button>
                                                        <button
                                                            className="go-to-file-btn"
                                                            title="Open file at this line"
                                                            onClick={(e) => handleOpenInEditor(issue, e)}
                                                        >
                                                            <span className="codicon codicon-go-to-file" aria-hidden="true"></span>
                                                        </button>
                                                    </div>
                                                    <div className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                                                        {issue.severity}
                                                    </div>
                                                    <div className="issue-element">{getCleanElementName(issue)}</div>
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
                            {filteredIssues.map(issue => {
                                const issueId = issue.id || issue.uuid;
                                const selectedId = selectedIssue?.id || selectedIssue?.uuid;
                                const isSelected = selectedIssue && issueId === selectedId;
                                if (isSelected) {
                                    console.log('Issue marked as selected:', issueId, 'selectedIssue:', selectedId);
                                }
                                return (
                                    <div
                                        key={`single-${issue.id || issue.uuid}`}
                                        className={`issue-item-single ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleIssueSelection(issue)}
                                    >
                                        <div className="issue-details">
                                            <div className="issue-header">
                                                <span className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                                                    {issue.severity}
                                                </span>
                                                <span className="issue-rule">{issue.issueType}</span>
                                            </div>
                                            <div className="issue-line">
                                                <button
                                                    className="issue-link"
                                                    title="Open file at this line"
                                                    onClick={(e) => handleOpenInEditor(issue, e)}
                                                >
                                                    {formatIssueLine(issue)}
                                                </button>
                                                <button
                                                    className="go-to-file-btn"
                                                    title="Open file at this line"
                                                    onClick={(e) => handleOpenInEditor(issue, e)}
                                                >
                                                    <span className="codicon codicon-go-to-file" aria-hidden="true"></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Move the counter inside the issues container */}
                <div className="issues-counter">
                    <p>
                        {issues.length} issues:
                        {issues.length > 0 && (
                            <span className="severity-breakdown">
                                {severityStats.high > 0 && (
                                    <>
                                        {' '}<span className="severity-item severity-high">{severityStats.high} high</span>
                                    </>
                                )}
                                {severityStats.medium > 0 && (
                                    <>
                                        {severityStats.high > 0 ? ', ' : ' '}<span className="severity-item severity-medium">{severityStats.medium} medium</span>
                                    </>
                                )}
                                {severityStats.low > 0 && (
                                    <>
                                        {(severityStats.high > 0 || severityStats.medium > 0) ? ' and ' : ' '}<span className="severity-item severity-low">{severityStats.low} low</span>
                                    </>
                                )}
                                {severityStats.warning > 0 && (
                                    <>
                                        {(severityStats.high > 0 || severityStats.medium > 0 || severityStats.low > 0) ? ', ' : ' '}<span className="severity-item severity-warning">{severityStats.warning} warning</span>
                                    </>
                                )}
                                {severityStats.unknown > 0 && (
                                    <>
                                        {(severityStats.high > 0 || severityStats.medium > 0 || severityStats.low > 0 || severityStats.warning > 0) ? ', ' : ' '}<span className="severity-item severity-unknown">{severityStats.unknown} unknown</span>
                                    </>
                                )}
                                .
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="section-title">
                <h2>Request details</h2>
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
                        ref={reasonSelectRef}
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
                        placeholder="Explain why this issue should be written off"
                        rows="3"
                    />
                </div>
                {viewMode === 'single' && (
                    <div className="form-group form-group-button">
                        <button
                            onClick={handleSingleWriteOff}
                            disabled={
                                loading ||
                                !selectedIssue ||
                                !reason.trim() ||
                                !description.trim()
                            }
                            className="single-submit-btn"
                        >
                            {loading ? 'Processing...' : 'Send request'}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
}

export default App;
