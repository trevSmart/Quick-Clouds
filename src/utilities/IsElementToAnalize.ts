"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ELEMENTS_TO_ANALYZE = [
    ".object",
    ".cls",
    ".page",
    ".component",
    ".trigger",
    ".report",
    ".workflow",
    ".js",
    ".flow",
    ".profile",
    ".profile-meta.xml",
    ".object-meta.xml",
    ".component-meta.xml",
    ".trigger-meta.xml",
    ".report-meta.xml",
    ".workflow-meta.xml",
    ".js-meta.xml",
    ".flow-meta.xml",
    ".approvalProcess-meta.xml",
    ".sharingRules-meta.xml",
    ".role-meta.xml",
    ".reportType-meta.xml",
    ".permissionset-meta.xml",
    ".network-meta.xml",
    ".layout-meta.xml",
    ".group-meta.xml",
    ".email-meta.xml",
    ".field-meta.xml",
    ".dashboard-meta.xml",
    ".app-meta.xml",
    ".os-meta.xml",
    ".ouc-meta.xml",
    ".oip-meta.xml",
    ".rpt-meta.xml",
    ".genAiPromptTemplate-meta.xml",
    ".genAiFunction-meta.xml",
    ".genAiPlugin-meta.xml",
];
function isElementToAnalize(elementName) {
    return ELEMENTS_TO_ANALYZE.some((suffix) => elementName.endsWith(suffix));
}
exports.default = isElementToAnalize;
//# sourceMappingURL=IsElementToAnalize.js.map