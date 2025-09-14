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

    // Reference to the reason select element
    const reasonSelectRef = useRef(null);

    // Extract the element name without duplicated file/line information
    const getCleanElementName = (issue) => {
        const raw = (issue && issue.elementName) ? String(issue.elementName) : '';
        if (!raw) {
            return '';
        }

        // Remove trailing repetitions like ", line 27" possibly repeated
        // and any leading "Line 27:" prefixes accidentally embedded
        let cleaned = raw
            .replace(/^\s*line\s+\d+\s*:\s*/i, '')
            .replace(/(?:,?\s*line\s+\d+)+\s*$/ig, '')
            .trim();

        // Also remove duplicated filename suffix (" - <file>") if present
        const file = issue?.fileName;
        if (file) {
            const suffix = ` - ${file}`;
            if (cleaned.endsWith(suffix)) {
                cleaned = cleaned.slice(0, -suffix.length);
            }
        }
        return cleaned;
    };

    // Build a consistent subtitle like "<file>, line <n>: <element>" (element optional)
    const formatIssueLine = (issue, includeElement = true) => {
        const baseFile = String(issue.fileName || 'Unknown file');
        let element = includeElement ? getCleanElementName(issue) : '';

        // Normalize names for comparison: trim, lower, strip extension
        const stripExt = (s) => s.replace(/\.[^./\\]+$/, '');
        const norm = (s) => stripExt(String(s || '').trim().toLowerCase());

        if (element && norm(element) === norm(baseFile)) {
            element = '';
        }

        const base = `${baseFile}, line ${issue.lineNumber}`;
        return element ? `${base}: ${element}` : base;
    };

    // Only count real issues (exclude informational entries)
    function isRealIssue(issue) {
        const sev = (issue?.severity || '').toLowerCase();
        return sev === 'high' || sev === 'medium' || sev === 'low' || sev === 'warning';
    }

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
                case 'writeoffSubmitted': {
                    // Reset form and unselect issue after successful submission
                    setLoading(false);
                    try {
                        const d = message.data || {};
                        const id = d.id;
                        if (id) {
                            setIssues(prev => prev.map(it => {
                                const itId = it.id || it.uuid;
                                if (String(itId) === String(id)) {
                                    return { ...it, localWriteOffStatus: 'REQUESTED' };
                                }
                                return it;
                            }));
                        }
                    } catch (_) {}
                    setSelectedIssue(null);
                    setReason('');
                    setDescription('');
                    break;
                }
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
        // Only show real issues (exclude informational entries from the list)
        if (!isRealIssue(issue)) {
            return false;
        }

        // First filter by severity
        const matchesSeverity = severityFilter === 'all' || (issue.severity || '').toLowerCase() === severityFilter.toLowerCase();

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
        const fileKey = issue.fileName || 'Unknown file';
        if (!groups[fileKey]) {
            groups[fileKey] = [];
        }
        groups[fileKey].push(issue);
        return groups;
    }, {});

    // Sort files alphabetically and issues by severity and line number
    const sortedGroupedIssues = Object.keys(groupedIssues)
        .sort((a, b) => a.localeCompare(b)) // Sort files alphabetically
        .reduce((sorted, fileName) => {
            // Sort issues within each file by severity (high to low) then by line number (descending)
            const sortedIssues = groupedIssues[fileName].sort((a, b) => {
                // Define severity priority (higher number = higher priority)
                const severityPriority = {
                    'HIGH': 4,
                    'MEDIUM': 3,
                    'LOW': 2,
                    'WARNING': 1,
                    'UNKNOWN': 0,
                    // Also handle lowercase versions
                    'high': 4,
                    'medium': 3,
                    'low': 2,
                    'warning': 1,
                    'unknown': 0
                };

                const aSeverity = severityPriority[a.severity] || 0;
                const bSeverity = severityPriority[b.severity] || 0;


                // First sort by severity (descending)
                if (aSeverity !== bSeverity) {
                    return bSeverity - aSeverity;
                }

                // Then sort by line number (descending)
                const aLine = parseInt(a.lineNumber) || 0;
                const bLine = parseInt(b.lineNumber) || 0;
                return bLine - aLine;
            });

            sorted[fileName] = sortedIssues;
            return sorted;
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

    const realIssues = issues.filter(isRealIssue);
    const severityStats = getSeverityStats(realIssues);

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
                    historyId: issue.historyId,
                    historyPath: issue.historyPath,
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

    const handleSelectAll = (groupKey) => {
        const groupIssues = groupedIssues[groupKey] || [];
        const allSelected = groupIssues.every(issue => selectedIssues.includes(getIssueId(issue)));

        if (allSelected) {
            // Deselect all issues in this rule
            setSelectedIssues(prev => prev.filter(id =>
                !groupIssues.some(issue => getIssueId(issue) === id)
            ));
        } else {
            // Select all issues in this rule
            const newSelected = groupIssues
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

    // Compute file type badge (APEX, APEX TRIGGER, LWC, AURA)
    const getFileTypeBadge = (issue) => {
        try {
            const raw = String(issue?.historyPath || '').replace(/\\\\/g, '/').toLowerCase();
            if (!raw) {
                return null;
            }
            if (raw.endsWith('.cls')) {
                return { key: 'type-apex', label: 'APEX' };
            }
            if (raw.endsWith('.trigger')) {
                return { key: 'type-apex-trigger', label: 'APEX TRIGGER' };
            }
            if (raw.includes('/lwc/') && raw.endsWith('.js')) {
                return { key: 'type-lwc', label: 'LWC' };
            }
            if (raw.includes('/aura/') && raw.endsWith('.js')) {
                return { key: 'type-aura', label: 'AURA' };
            }
            return null;
        } catch (_) {
            return null;
        }
    };

    // Determine which icon image to show for the file header
    const getFileIconSrc = (issue, fileName) => {
        try {
            const assets = (typeof window !== 'undefined' && window.qcAssets) ? window.qcAssets : {};
            const pathLower = String(issue?.historyPath || '').replace(/\\\\/g, '/').toLowerCase();
            const nameLower = String(issue?.fileName || fileName || '').toLowerCase();
            const ends = (s, suf) => s.endsWith(suf);
            const isApex = ends(pathLower, '.cls') || ends(pathLower, '.trigger') || ends(nameLower, '.cls') || ends(nameLower, '.trigger');
            const isJs = ends(pathLower, '.js') || ends(nameLower, '.js');
            if (isApex && assets.apexIcon) {
                return { src: assets.apexIcon, kind: 'apex' };
            }
            if (isJs && assets.jsIcon) {
                return { src: assets.jsIcon, kind: 'js' };
            }
            return null;
        } catch (_) { return null; }
    };

    const getLocalStatus = (issue) => {
        // Prefer server status if present (e.g., APPROVED after re-scan) over local cached status
        const remote = issue?.writeOff?.writeOffStatus;
        const local = issue?.localWriteOffStatus;
        const s = remote || local;
        return s ? String(s).toUpperCase() : null;
    };

    // Format a date/time like "14/10 12:23" (DD/MM HH:mm)
    const formatShortDateTime = (iso) => {
        try {
            const d = new Date(iso);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            return `${dd}/${mm} ${hh}:${mi}`;
        } catch (_) {
            return String(iso || '');
        }
    };

    // Render status badge with a custom tooltip for APPROVED
    const renderStatusBadge = (issue) => {
        const status = getLocalStatus(issue);
        if (!(status === 'REQUESTED' || status === 'APPROVED')) return null;

        const w = issue?.writeOff || {};
        const validator = w?.validator;
        const validationReason = w?.validationReason;
        const expirationDate = w?.expirationDate;
        let expirationText = '';
        if (expirationDate) {
            try { expirationText = formatShortDateTime(expirationDate); } catch (_) { expirationText = String(expirationDate); }
        }

        // New: always show these two lines, with fallbacks
        const requestedBy = issue?.issueCreatedBy || w?.requester || 'N/A';
        const description = issue?.issueDescription || w?.requestDescription || 'N/A';

        const title = status === 'APPROVED' ? 'Approved write-off' : 'Write-off request';

        return (
            <span className="status-badge-wrap">
                <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                <div className="qc-tooltip" role="tooltip" aria-label={`${title} details`}>
                    <div className="arrow"></div>
                    <div className="title">{title}</div>
                    <div className="row"><span className="code">Status:</span> {status}</div>
                    {status === 'APPROVED' && validator ? (
                        <div className="row"><span className="code">Approved by:</span> {validator}</div>
                    ) : null}
                    {status === 'APPROVED' && validationReason ? (
                        <div className="row"><span className="code">Reason:</span> {validationReason}</div>
                    ) : null}
                    {status === 'APPROVED' && expirationDate ? (
                        <div className="row"><span className="code">Expires:</span> {expirationText}</div>
                    ) : null}
                    <div className="row"><span className="code">Requested by:</span> {requestedBy || 'N/A'}</div>
                    <div className="row"><span className="code">Description:</span> {description || 'N/A'}</div>
                </div>
            </span>
        );
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

                {/* If there are info messages but no real issues, show a friendly banner */}
                {realIssues.length === 0 && issues.some(it => (it?.severity || '').toLowerCase() === 'info') && (
                    <div className="info-banner">
                        <span className="codicon codicon-info" aria-hidden="true"></span>
                        <span>Online checks completed. No issues detected.</span>
                    </div>
                )}

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
                            {Object.entries(sortedGroupedIssues).map(([fileName, fileIssues]) => (
                                <div key={fileName} className="rule-group">
                                    <div className="rule-header">
                                        <h4>
                                            {(() => {
                                                const icon = getFileIconSrc(fileIssues && fileIssues[0], fileName);
                                                return icon ? (
                                                <img src={icon.src} className={`file-icon ${icon.kind}`} alt="" />
                                            ) : (
                                                <span className="codicon codicon-file-code" aria-hidden="true"></span>
                                            ); })()}
                                            {fileName}
                                            {(() => {
                                                const t = getFileTypeBadge(fileIssues && fileIssues[0]);
                                                return t ? (
                                                    <span className={`type-badge ${t.key}`}>{t.label}</span>
                                                ) : null;
                                            })()}
                                            <span className="issues-count">{fileIssues.length} {fileIssues.length === 1 ? 'issue' : 'issues'}</span>
                                            {(() => {
                                                // Determine latest check timestamp among issues in this group
                                                const isoList = (fileIssues || []).map(it => it.lastLiveCheckDate).filter(Boolean);
                                                if (isoList.length === 0) return null;
                                                let latestIso = isoList[0];
                                                for (const iso of isoList) {
                                                    if (String(iso) > String(latestIso)) latestIso = iso;
                                                }
                                                let local = '';
                                                try { local = formatShortDateTime(latestIso); } catch(_) {}
                                                return local ? (
                                                    <span className="last-check" title="Last Live Check">{local}</span>
                                                ) : null;
                                            })()}
                                        </h4>
                                        <button
                                            onClick={() => handleSelectAll(fileName)}
                                            className="select-all-btn"
                                        >
                                            {fileIssues.every(issue => selectedIssues.includes(getIssueId(issue))) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="issues-grid">
                                        {fileIssues.map(issue => (
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
                                                            {formatIssueLine(issue, false)}
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
                                                    {renderStatusBadge(issue)}
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
                            {Object.entries(sortedGroupedIssues).map(([fileName, fileIssues]) => (
                                <div key={`single-group-${fileName}`} className="rule-group">
                                    <div className="rule-header">
                                        <h4>
                                            {(() => {
                                                const icon = getFileIconSrc(fileIssues && fileIssues[0], fileName);
                                                return icon ? (
                                                <img src={icon.src} className={`file-icon ${icon.kind}`} alt="" />
                                            ) : (
                                                <span className="codicon codicon-file-code" aria-hidden="true"></span>
                                            ); })()}
                                            {fileName}
                                            {(() => {
                                                const t = getFileTypeBadge(fileIssues && fileIssues[0]);
                                                return t ? (
                                                    <span className={`type-badge ${t.key}`}>{t.label}</span>
                                                ) : null;
                                            })()}
                                            <span className="issues-count">{fileIssues.length} {fileIssues.length === 1 ? 'issue' : 'issues'}</span>
                                            {(() => {
                                                const isoList = (fileIssues || []).map(it => it.lastLiveCheckDate).filter(Boolean);
                                                if (isoList.length === 0) return null;
                                                let latestIso = isoList[0];
                                                for (const iso of isoList) {
                                                    if (String(iso) > String(latestIso)) latestIso = iso;
                                                }
                                                let local = '';
                                                try { local = formatShortDateTime(latestIso); } catch(_) {}
                                                return local ? (
                                                    <span className="last-check" title="Last Live Check">{local}</span>
                                                ) : null;
                                            })()}
                                        </h4>
                                    </div>
                                    <div className="issues-grid single-grid">
                            {fileIssues.map(issue => {
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
                                                {renderStatusBadge(issue)}
                                            </div>
                                            <div className="issue-line">
                                                <button
                                                    className="issue-link"
                                                    title="Open file at this line"
                                                    onClick={(e) => handleOpenInEditor(issue, e)}
                                                >
                                                    {formatIssueLine(issue, true)}
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
                            ))}
                        </div>
                    </div>
                )}

                {/* Move the counter inside the issues container */}
                <div className="issues-counter">
                    <p>
                        {realIssues.length} issues:
                        {realIssues.length > 0 && (
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
                {viewMode === 'single' && selectedIssue && (
                    <div className={`selected-issue-banner ${getSeverityClass(selectedIssue.severity)}`}>
                        <div className="issue-details">
                            <div className="issue-header">
                                <span className={`severity-badge ${getSeverityClass(selectedIssue.severity)}`}>
                                    {selectedIssue.severity}
                                </span>
                                <span className="issue-rule">{selectedIssue.issueType}</span>
                                {renderStatusBadge(selectedIssue)}
                            </div>
                            <div className="issue-line">
                                <button
                                    className="issue-link"
                                    title="Open file at this line"
                                    onClick={(e) => handleOpenInEditor(selectedIssue, e)}
                                >
                                    {formatIssueLine(selectedIssue, true)}
                                </button>
                                <button
                                    className="go-to-file-btn"
                                    title="Open file at this line"
                                    onClick={(e) => handleOpenInEditor(selectedIssue, e)}
                                >
                                    <span className="codicon codicon-go-to-file" aria-hidden="true"></span>
                                </button>
                            </div>
                        </div>
                        <button
                            className="clear-selection-btn"
                            onClick={() => setSelectedIssue(null)}
                            title="Clear selected issue"
                            aria-label="Clear selected issue"
                        >
                            <span className="codicon codicon-close" aria-hidden="true"></span>
                        </button>
                    </div>
                )}
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
