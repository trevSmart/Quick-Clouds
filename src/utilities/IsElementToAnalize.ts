"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Only include Apex classes/triggers and JS from Aura/LWC under force-app
function isElementToAnalize(fullPath) {
    try {
        const p = String(fullPath || '').replace(/\\/g, '/');
        if (!p.includes('/force-app/')) return false;

        // Apex classes
        if (/\/force-app\/.*\/classes\/[^/]+\.cls$/i.test(p)) return true;
        // Apex triggers
        if (/\/force-app\/.*\/triggers\/[^/]+\.trigger$/i.test(p)) return true;
        // Aura JS
        if (/\/force-app\/.*\/aura\/[^/]+\.js$/i.test(p)) return true;
        // LWC JS
        if (/\/force-app\/.*\/lwc\/[^/]+\.js$/i.test(p)) return true;

        return false;
    } catch (_) {
        return false;
    }
}

exports.default = isElementToAnalize;
//# sourceMappingURL=IsElementToAnalize.js.map
