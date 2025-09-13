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

            // Validate value size to prevent DoS
            const serializedValue = JSON.stringify(value);
            if (serializedValue.length > 1024 * 1024) { // 1MB limit
                throw new Error('Value too large: maximum 1MB allowed');
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