"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = void 0;
const Database_1 = require("../data/Database");
class MigrationService {
    constructor(mementoStorage, fallbackStorage, dbPath) {
        this.mementoStorage = mementoStorage;
        this.fallbackStorage = fallbackStorage;
        this._db = null;
        this.dbPath = dbPath;
    }
    getDb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._db) {
                try {
                    this._db = yield (0, Database_1.initializeDatabase)(this.dbPath);
                }
                catch (error) {
                    console.warn("Database is not available. Falling back to in-memory storage.");
                    return null;
                }
            }
            return this._db;
        });
    }
    migrateUserData() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.getDb();
            const legacyApiKey = this.mementoStorage.get("apiKEY");
            const canonicalApiKey = this.mementoStorage.get("apiKey");
            let apiKeyToStore = canonicalApiKey || legacyApiKey;
            if (apiKeyToStore) {
                yield this.storeData("apiKey", apiKeyToStore, db);
            }
            const apiKeyStatus = this.mementoStorage.get("apiKeyStatus");
            if (apiKeyStatus) {
                yield this.storeData("apiKeyStatus", apiKeyStatus, db);
            }
            const userInfo = this.mementoStorage.get("userInfo");
            if (userInfo) {
                yield this.storeData("userInfo", userInfo, db);
            }
            const livecheckHistoryWrapper = this.mementoStorage.get("LivecheckHistory");
            let livecheckHistory;
            if (Array.isArray(livecheckHistoryWrapper)) {
                livecheckHistory = livecheckHistoryWrapper;
            }
            else if (livecheckHistoryWrapper && Array.isArray(livecheckHistoryWrapper.LivecheckHistory)) {
                livecheckHistory = livecheckHistoryWrapper.LivecheckHistory;
            }
            if (livecheckHistory) {
                for (const historyItem of livecheckHistory) {
                    const { path, timestamp, issues } = historyItem;
                    if (db) {
                        const historyId = yield this.insertLivecheckHistory(path, timestamp, db);
                        if (Array.isArray(issues)) {
                            for (const issue of issues) {
                                yield this.insertIssue(historyId, issue, db);
                            }
                        }
                    }
                    else {
                        const historyId = yield this.fallbackStorage.setLivecheckHistory(path, issues, timestamp);
                    }
                }
                if (db) {
                    (0, Database_1.saveDatabase)(db, this.dbPath);
                }
            }
            else {
                console.warn("LivecheckHistory is not in the expected format or is undefined. Skipping migration.");
            }
        });
    }
    storeData(key, value, db) {
        return __awaiter(this, void 0, void 0, function* () {
            if (db) {
                const serializedValue = JSON.stringify(value);
                db.run(`INSERT OR REPLACE INTO userData (key, value) VALUES (?, ?)`, [key, serializedValue]);
                (0, Database_1.saveDatabase)(db, this.dbPath);
            }
            else {
                yield this.fallbackStorage.setUserData(key, value);
            }
        });
    }
    insertLivecheckHistory(path, timestamp, db) {
        return __awaiter(this, void 0, void 0, function* () {
            db.run(`INSERT INTO LivecheckHistory (path, timestamp) VALUES (?, ?)`, [path, timestamp]);
            const stmt = db.prepare(`SELECT last_insert_rowid() as id`);
            stmt.step();
            const row = stmt.getAsObject();
            const historyId = row.id;
            stmt.free();
            return historyId;
        });
    }
    insertIssue(historyId, issue, db) {
        return __awaiter(this, void 0, void 0, function* () {
            const serializedIssue = JSON.stringify(issue);
            db.run(`INSERT INTO Issues (history_id, issue_data) VALUES (?, ?)`, [historyId, serializedIssue]);
        });
    }
}
exports.MigrationService = MigrationService;
//# sourceMappingURL=MigrationService.js.map