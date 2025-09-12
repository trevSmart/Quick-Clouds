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
exports.saveDatabase = exports.initializeDatabase = void 0;
const sql_js_1 = require("sql.js");
const fs = require("fs");
const path = require("path");
const SchemaManager_1 = require("./SchemaManager");
let db = null;
function initializeDatabase(dbPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const SQL = yield (0, sql_js_1.default)();
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log("Created directory for database at:", dbDir);
        }
        if (!db) {
            let fileBuffer;
            if (fs.existsSync(dbPath)) {
                fileBuffer = fs.readFileSync(dbPath);
                db = new SQL.Database(fileBuffer);
                console.log("Loaded existing database from:", dbPath);
            }
            else {
                db = new SQL.Database();
                console.log("Created new in-memory database.");
            }
            // Ensure schema is created
            SchemaManager_1.SchemaManager.initDB(db);
        }
        return db;
    });
}
exports.initializeDatabase = initializeDatabase;
function saveDatabase(db, dbPath) {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    console.log("Database saved to:", dbPath);
}
exports.saveDatabase = saveDatabase;
//# sourceMappingURL=Database.js.map