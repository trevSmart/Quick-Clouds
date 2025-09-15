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
exports.LocalStorageService = void 0;
const Database_1 = require("../data/Database");
const events_1 = require("events");
class LocalStorageService {
    constructor(dbPath) {
        this.changeEmitter = new events_1.EventEmitter();
        this._db = null;
        this.dbPath = dbPath;
    }
    getDb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._db) {
                this._db = yield (0, Database_1.initializeDatabase)(this.dbPath);
            }
            return this._db;
        });
    }
    getUserData(key) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate key input to prevent injection
            if (!key || typeof key !== 'string' || key.length > 255) {
                throw new Error('Invalid key: must be a non-empty string with max 255 characters');
            }

            const db = yield this.getDb();
            const stmt = db.prepare(`SELECT value FROM userData WHERE key = ?`);
            stmt.bind([key]);
            let result = null;
            if (stmt.step()) {
                const row = stmt.getAsObject();
                try {
                    result = row.value ? JSON.parse(row.value) : null;
                } catch (parseError) {
                    console.error(`Failed to parse stored data for key ${key}:`, parseError);
                    result = null;
                }
            }
            stmt.free();
            return result;
        });
    }
    setUserData(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate key input to prevent injection
            if (!key || typeof key !== 'string' || key.length > 255) {
                throw new Error('Invalid key: must be a non-empty string with max 255 characters');
            }

            // Serialize value. Allow large payloads but warn if unusually big (>8MB)
            const serializedValue = JSON.stringify(value);
            if (serializedValue.length > 8 * 1024 * 1024) {
                console.warn('LocalStorageService.setUserData: payload exceeds 8MB; consider pruning or compressing.');
            }

            const db = yield this.getDb();
            db.run(`INSERT OR REPLACE INTO userData (key, value) VALUES (?, ?)`, [key, serializedValue]);
            (0, Database_1.saveDatabase)(db, this.dbPath);
            this.changeEmitter.emit(key, value);
        });
    }
    onDidChangeUserData(key, listener) {
        this.changeEmitter.on(key, listener);
    }
    deleteAllData() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            db.run('BEGIN TRANSACTION');
            try {
                // Only clear scan-related tables to preserve user settings
                const tables = ['LivecheckHistory', 'Issues', 'WriteOffData'];
                for (const table of tables) {
                    db.run(`DELETE FROM ${table}`);
                }
                db.run('COMMIT');
                (0, Database_1.saveDatabase)(db, this.dbPath);
            }
            catch (error) {
                db.run('ROLLBACK');
                throw error;
            }
        });
    }
    getLivecheckHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const query = `
            SELECT LivecheckHistory.id, LivecheckHistory.path, LivecheckHistory.timestamp, Issues.issue_data
            FROM LivecheckHistory
            LEFT JOIN Issues ON LivecheckHistory.id = Issues.history_id
        `;
            const stmt = db.prepare(query);
            const historyMap = new Map();
            while (stmt.step()) {
                const row = stmt.getAsObject();
                if (!historyMap.has(row.id)) {
                    historyMap.set(row.id, {
                        id: row.id,
                        path: row.path,
                        timestamp: row.timestamp,
                        issues: []
                    });
                }
                if (row.issue_data) {
                    const issue = JSON.parse(row.issue_data);
                    try {
                        const path = require('path');
                        const fileName = row.path ? path.basename(row.path) : undefined;
                        if (fileName && !issue.fileName) {
                            issue.fileName = fileName;
                        }
                    }
                    catch (_) { }
                    historyMap.get(row.id).issues.push(issue);
                }
            }
            stmt.free();
            return Array.from(historyMap.values());
        });
    }
    setLivecheckHistory(path, issues, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            // Delete existing data for this file path to avoid duplicates
            db.run(`DELETE FROM Issues WHERE history_id IN (SELECT id FROM LivecheckHistory WHERE path = ?)`, [path]);
            db.run(`DELETE FROM WriteOffData WHERE history_id IN (SELECT id FROM LivecheckHistory WHERE path = ?)`, [path]);
            db.run(`DELETE FROM LivecheckHistory WHERE path = ?`, [path]);
            // Insert new data
            db.run(`INSERT INTO LivecheckHistory (path, timestamp) VALUES (?, ?)`, [path, timestamp]);
            // Get last inserted id
            const stmt = db.prepare(`SELECT last_insert_rowid() as id`);
            stmt.step();
            const row = stmt.getAsObject();
            const historyId = row.id;
            stmt.free();
            const insertIssueQuery = `INSERT INTO Issues (history_id, issue_data) VALUES (?, ?)`;
            for (const issue of issues) {
                db.run(insertIssueQuery, [historyId, JSON.stringify(issue)]);
            }
            (0, Database_1.saveDatabase)(db, this.dbPath);
            return historyId;
        });
    }
    getWriteOffData(historyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const stmt = db.prepare(`SELECT data FROM WriteOffData WHERE history_id = ?`);
            stmt.bind([historyId]);
            let result = null;
            if (stmt.step()) {
                const row = stmt.getAsObject();
                result = row.data ? JSON.parse(row.data) : null;
            }
            stmt.free();
            return result;
        });
    }
    setWriteOffData(historyId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            db.run(`INSERT OR REPLACE INTO WriteOffData (history_id, data) VALUES (?, ?)`, [historyId, JSON.stringify(data)]);
            (0, Database_1.saveDatabase)(db, this.dbPath);
        });
    }
    /**
     * Delete scan issues older than the given number of days.
     * Removes corresponding entries from Issues, WriteOffData and LivecheckHistory.
     * Keeps WriteOffStatus intact.
     */
    deleteIssuesOlderThan(days) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            // Collect history IDs older than cutoff
            const idsStmt = db.prepare(`SELECT id FROM LivecheckHistory WHERE timestamp < ?`);
            idsStmt.bind([cutoffDate]);
            const oldIds = [];
            while (idsStmt.step()) {
                const row = idsStmt.getAsObject();
                oldIds.push(row.id);
            }
            idsStmt.free();
            if (oldIds.length === 0) {
                return { deletedHistories: 0, deletedIssues: 0 };
            }
            // Build a parameterized IN clause
            const placeholders = oldIds.map(() => '?').join(',');
            db.run('BEGIN TRANSACTION');
            try {
                // Delete dependent rows first
                db.run(`DELETE FROM Issues WHERE history_id IN (${placeholders})`, oldIds);
                db.run(`DELETE FROM WriteOffData WHERE history_id IN (${placeholders})`, oldIds);
                db.run(`DELETE FROM LivecheckHistory WHERE id IN (${placeholders})`, oldIds);
                db.run('COMMIT');
                (0, Database_1.saveDatabase)(db, this.dbPath);
            }
            catch (e) {
                db.run('ROLLBACK');
                throw e;
            }
            return { deletedHistories: oldIds.length, deletedIssues: undefined };
        });
    }
    /**
     * Persistent per-issue write-off status APIs
     */
    getWriteOffStatus(issueId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const stmt = db.prepare(`SELECT status FROM WriteOffStatus WHERE issue_id = ?`);
            stmt.bind([issueId]);
            let status = null;
            if (stmt.step()) {
                const row = stmt.getAsObject();
                status = row.status || null;
            }
            stmt.free();
            return status;
        });
    }
    setWriteOffStatus(issueId, status, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const updatedAt = new Date().toISOString();
            const meta = metadata ? JSON.stringify(metadata) : null;
            db.run(`INSERT OR REPLACE INTO WriteOffStatus (issue_id, status, updated_at, metadata) VALUES (?, ?, ?, ?)`, [issueId, status, updatedAt, meta]);
            (0, Database_1.saveDatabase)(db, this.dbPath);
        });
    }
    getWriteOffStatusMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const stmt = db.prepare(`SELECT issue_id, status FROM WriteOffStatus`);
            const map = {};
            while (stmt.step()) {
                const row = stmt.getAsObject();
                map[row.issue_id] = row.status;
            }
            stmt.free();
            return map;
        });
    }
    hasHighUnapprovedIssues() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const issuesHistory = yield this.getLivecheckHistory();
                const writeOffStatusMap = yield this.getWriteOffStatusMap();

                // Check all issues in all history entries
                for (const historyEntry of issuesHistory) {
                    for (const issue of historyEntry.issues) {
                        // Check if issue is HIGH severity
                        if (issue.severity && issue.severity.toUpperCase() === 'HIGH') {
                            // Check if issue is not approved
                            const writeOffStatus = writeOffStatusMap[issue.id];
                            if (!writeOffStatus || writeOffStatus !== 'APPROVED') {
                                return true; // Found HIGH issue without approval
                            }
                        }
                    }
                }
                return false; // No HIGH unapproved issues found
            } catch (error) {
                console.error('Error checking for HIGH unapproved issues:', error);
                return false; // Return false on error to avoid false positives
            }
        });
    }
    getUnapprovedIssuesStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🔍 Checking unapproved issues status...');
                const issuesHistory = yield this.getLivecheckHistory();
                const writeOffStatusMap = yield this.getWriteOffStatusMap();

                console.log(`📊 Found ${issuesHistory.length} history entries`);
                console.log(`📋 Write-off status map:`, writeOffStatusMap);

                let hasHigh = false;
                let hasMedium = false;
                let totalIssues = 0;
                let unapprovedIssues = 0;

                // Check all issues in all history entries
                for (const historyEntry of issuesHistory) {
                    console.log(`📁 History entry ${historyEntry.id}: ${historyEntry.issues.length} issues`);
                    for (const issue of historyEntry.issues) {
                        totalIssues++;
                        const writeOffStatus = writeOffStatusMap[issue.id];
                        console.log(`🔍 Issue ${issue.id}: severity=${issue.severity}, writeOffStatus=${writeOffStatus}`);

                        // Check if issue is not approved
                        if (!writeOffStatus || writeOffStatus !== 'APPROVED') {
                            unapprovedIssues++;
                            const severity = issue.severity ? issue.severity.toUpperCase() : '';

                            if (severity === 'HIGH') {
                                hasHigh = true;
                                console.log('🚨 Found HIGH unapproved issue:', issue.id);
                            } else if (severity === 'MEDIUM') {
                                hasMedium = true;
                                console.log('⚠️ Found MEDIUM unapproved issue:', issue.id);
                            }
                        }
                    }
                }

                console.log(`📈 Summary: ${totalIssues} total issues, ${unapprovedIssues} unapproved`);
                console.log(`🎯 Status: hasHigh=${hasHigh}, hasMedium=${hasMedium}`);

                // Return status: 'error' for HIGH, 'warning' for MEDIUM (but no HIGH), 'normal' for none
                let status;
                if (hasHigh) {
                    status = 'error';
                } else if (hasMedium) {
                    status = 'warning';
                } else {
                    status = 'normal';
                }

                console.log(`🎨 Returning status: ${status}`);
                return status;
            } catch (error) {
                console.error('❌ Error checking for unapproved issues:', error);
                return 'normal'; // Return normal on error to avoid false positives
            }
        });
    }
    getLastScanHistoryId() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const stmt = db.prepare(`SELECT MAX(id) as lastId FROM LivecheckHistory`);
            let lastId = null;
            if (stmt.step()) {
                const row = stmt.getAsObject();
                lastId = row.lastId;
            }
            stmt.free();
            return lastId;
        });
    }
    getLastScanIssuesFromHistoryId(historyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            // Get both issues and file path from history
            const stmt = db.prepare(`
                SELECT i.issue_data, lh.path
                FROM Issues i
                JOIN LivecheckHistory lh ON i.history_id = lh.id
                WHERE i.history_id = ?
            `);
            stmt.bind([historyId]);
            const issues = [];
            let filePath = null;
            while (stmt.step()) {
                const row = stmt.getAsObject();
                const issue = JSON.parse(row.issue_data);
                // Add file path to each issue
                if (!filePath) {
                    filePath = row.path;
                }
                // Extract filename from path
                const path = require('path');
                const fileName = path.basename(filePath);
                issue.fileName = fileName;
                issues.push(issue);
            }
            stmt.free();
            return issues;
        });
    }
    getRuleIdByName(ruleName) {
        return __awaiter(this, void 0, void 0, function* () {
            const bestPractices = yield this.getUserData('bestPractices');
            if (!bestPractices) {
                console.error("No best practices data found.");
                return null;
            }
            const rule = bestPractices.find(r => r.attributes.name === ruleName);
            return rule ? rule.id : null;
        });
    }
}
exports.LocalStorageService = LocalStorageService;
//# sourceMappingURL=LocalStorageService.js.map
