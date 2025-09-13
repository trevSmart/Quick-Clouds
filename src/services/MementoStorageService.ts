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
exports.MementoStorageService = void 0;
const events_1 = require("events");
class MementoStorageService {
    constructor(memento) {
        this.memento = memento;
        this.changeEmitter = new events_1.EventEmitter();
    }
    getUserData(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = this.memento.get(key);
            if (!value) {
                return null;
            }
            if (typeof value === 'object') {
                return value;
            }
            try {
                return JSON.parse(value);
            }
            catch (error) {
                console.error(`Failed to parse JSON for key "${key}":`, error);
                return null;
            }
        });
    }
    setUserData(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.memento.update(key, JSON.stringify(value));
            this.changeEmitter.emit(key, value); // Emit change event
        });
    }
    onDidChangeUserData(key, listener) {
        this.changeEmitter.on(key, listener);
    }
    getLivecheckHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            const history = this.memento.get('LivecheckHistory', []);
            return Array.isArray(history) ? history : []; // Ensure history is always an array
        });
    }
    setLivecheckHistory(path, issues, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield this.getLivecheckHistory();
            const filtered = history.filter(h => h.path !== path);
            const maxId = filtered.reduce((max, h) => Math.max(max, h.id), 0);
            const newId = maxId + 1;
            filtered.push({
                id: newId,
                path,
                timestamp,
                issues,
            });
            yield this.memento.update('LivecheckHistory', filtered);
            return newId;
        });
    }
    getWriteOffData(historyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const writeOffData = this.memento.get('WriteOffData', {});
            return writeOffData[historyId] || null;
        });
    }
    setWriteOffData(historyId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const writeOffData = this.memento.get('WriteOffData', {});
            writeOffData[historyId] = data;
            yield this.memento.update('WriteOffData', writeOffData);
        });
    }
    getLastScanHistoryId() {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield this.getLivecheckHistory();
            return history.length > 0 ? history[history.length - 1].id : null;
        });
    }
    getLastScanIssuesFromHistoryId(historyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield this.getLivecheckHistory();
            const entry = history.find(h => h.id === historyId);
            return entry ? entry.issues : [];
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
exports.MementoStorageService = MementoStorageService;
//# sourceMappingURL=MementoStorageService.js.map