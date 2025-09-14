"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = void 0;
class SchemaManager {
    static initDB(db) {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS userData (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
                CREATE TABLE IF NOT EXISTS LivecheckHistory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS Issues (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    history_id INTEGER NOT NULL,
                    issue_data TEXT NOT NULL,
                    FOREIGN KEY (history_id) REFERENCES LivecheckHistory (id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS WriteOffData (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    history_id INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY (history_id) REFERENCES LivecheckHistory (id) ON DELETE CASCADE
                );
                -- Persistent per-issue write-off status, independent of scan history
                CREATE TABLE IF NOT EXISTS WriteOffStatus (
                    issue_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    updated_at TEXT,
                    metadata TEXT
                );
            `);
        }
        catch (err) {
            console.error("Error initializing database schema:", err);
            throw err;
        }
    }
}
exports.SchemaManager = SchemaManager;
//# sourceMappingURL=SchemaManager.js.map