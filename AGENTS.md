# Quick Clouds for Salesforce - Agent Knowledge Base

## Project Overview

Quick Clouds for Salesforce is a customized version of the Live Check Quality for Salesforce extension. It's a VSCode extension that provides automated code quality analysis for Salesforce development, including Apex, Lightning Web Components, and other Salesforce metadata.

## Project History & Context

- **Original Extension**: Live Check Quality for Salesforce
- **Customized Version**: Quick Clouds for Salesforce (forked, renamed and modified)
- **Main Issue**: The original extension had a critical bug where the "Quality Center" panel would get stuck in an infinite loading state
- **Solution Approach**: Implemented comprehensive logging and debugging capabilities to identify and fix the loading issue

### Original Extension Location

**Path to Original Extension:**
```
/Users/marcpla/.vscode/extensions/qualityclouds.livecheckqualityforsalesforce-2.3.1
```

**Extension Details:**
- **Name**: `quick-clouds-for-salesforce`
- **Display Name**: "Quick Clouds for Salesforce"
- **Version**: 2.3.1
- **Publisher**: QualityClouds
- **Installation Date**: July 18, 2024

**Directory Structure:**
- `package.json` - Extension manifest
- `out/` - Compiled JavaScript code
- `webview-ui/` - React user interface
- `node_modules/` - Dependencies
- `resources/` - Resources (images, etc.)
- `media/` - Additional media files

**Purpose**: This is the original extension that was forked to create Quick Clouds. It can be used as a reference for comparing original implementation with Quick Clouds modifications or for understanding the base functionality.

## Architecture & Structure

### Core Components

1. **Extension Entry Point** (`src/extension.ts`)
   - Main activation function
   - Command registration
   - Extension initialization
   - Error handling with comprehensive logging

2. **Panels**
   - `MyIssuesPanel.ts` - Quality Center panel (main focus of debugging)
   - `SettingsPanel.ts` - Configuration panel
   - `WriteOffMenuPanel.ts` - Write-off request panel

3. **Services**
   - `GetDocumentsInfo.ts` - Analyzes project files (potential bottleneck)
   - `LiveCheck.ts` - Performs quality analysis
   - `LocalStorageService.ts` - Data persistence
   - Various API services for QualityClouds integration

4. **Utilities**
   - `logger.ts` - **NEW** Comprehensive logging system
   - `buttonLCSingleton.ts` - Live Check button management
   - `buttonQualityCenterSingleton.ts` - Quality Center button management
   - Various other utility functions

### Key Files Modified

- `package.json` - Updated command names from `qualityclouds.*` to `quick-clouds.*`
- `src/extension.ts` - Added logging integration
- `src/panels/MyIssuesPanel.ts` - Added detailed debugging traces
- `src/utilities/logger.ts` - **NEW** Custom logging system

## Known Issues & Debugging

### Primary Issue: Quality Center Infinite Loading

**Symptoms:**
- Quality Center panel opens but shows spinning loader indefinitely
- Panel never loads the actual content
- No error messages displayed to user

**Debugging Approach:**
- Implemented comprehensive logging system (`QuickCloudsLogger`)
- Added detailed traces to `MyIssuesPanel.ts` message handler
- Created output channel "Quick Clouds" for real-time debugging

**Suspected Bottlenecks:**
1. `docs.default.getDocumentsInfo(directory.toString())` - File system analysis
2. `this._storageManager.getUserData()` - Database operations
3. `JSON.stringify(myIssuesData)` - Large object serialization

**Debugging Commands:**
- `quick-clouds.showLogs` - Opens Quick Clouds output channel
- `qc2.myIssues` - Triggers Quality Center (with logging)

### Secondary Issue: Live Check API Errors

**Symptoms:**
- Live Check command fails with "Internal Server Error"
- Generic error messages like "Error in runLivecheck: undefined"
- No detailed information about server response
- **Key Finding**: Original extension works perfectly, indicating configuration issue

**Root Cause Analysis:**
- Server returns error for path `/api/v2/sf-cecheck` but request goes to `/api/v2/sf-live-check`
- Suggests server-side routing issue based on client identification
- **Suspected Cause**: Incorrect `Client-Name` header value

**Solution Implemented:**
- Enhanced error logging in `LiveCheck.ts` and `executeLiveCheck.ts`
- Detailed API error capture including:
  - Status code and status text
  - Response data (first 200 characters)
  - Response headers
  - Request URL and method
  - Authentication type used
  - Complete stack traces
- **Client Name**: Maintained as `'SalesforceVSCPlugin'` (same as original extension for API compatibility)
- **Callback URI**: Maintained as `'vscode://QualityClouds.livecheckqualityforsalesforce'` (same as original extension for OAuth compatibility)

**Files Modified:**
- `out/services/LiveCheck.js` - Enhanced API error handling
- `out/utilities/executeLiveCheck.js` - Enhanced execution error handling
- `out/constants.js` - Maintained original QC_CLIENT_NAME
- `src/constants.ts` - Maintained original QC_CLIENT_NAME
- `src/env.ts` - Maintained original CallbackUri
- Added logger imports to both files

### Command Conflicts Resolved

**Original Issue:**
- Extension commands conflicted with original QualityClouds extension
- Commands like `qualityclouds.check` were already registered

**Solution:**
- Renamed all commands from `qualityclouds.*` to `quick-clouds.*`
- Updated internal references throughout codebase
- Changed configuration keys to avoid conflicts

## Development Setup

### Prerequisites
- Node.js and npm
- VSCode extension development tools
- `@vscode/vsce` for packaging

### Build Process
```bash
# Install dependencies
npm install

# Package extension (includes webview build and automatic installation)
npm run package
```

### Temporary Files Management
- **Location**: All temporary files (Node.js scripts, database queries, test files, etc.) must be created inside the `tmp/` directory
- **Directory Creation**: If the `tmp/` directory doesn't exist, it must be created at the moment of first use
- **Cleanup**: Temporary files must be deleted immediately once they are no longer needed
- **Purpose**: Maintains a clean workspace and prevents accumulation of unnecessary files
- **Examples**: Debug scripts, temporary database exports, test queries, temporary configuration files

### Configuration Files
- `tsconfig.json` - TypeScript configuration (relaxed for JS compatibility)
- `.eslintrc.json` - ESLint configuration
- `.vscodeignore` - Files to exclude from package

### VSCode Debugging Configuration

**Key Configuration Details:**
- **TypeScript Compilation**: Disabled in VSCode to prevent conflicts with pre-compiled JS
- **Source Maps**: Enabled for debugging compiled JavaScript
- **Skip Files**: Configured to skip TypeScript source files during debugging
- **No Emit**: TypeScript configured to not emit files (using pre-compiled JS)

## Logging System

### QuickCloudsLogger Features
- **Output Channel**: Dedicated "Quick Clouds" channel in VSCode
- **Log Levels**: INFO, WARN, ERROR
- **Timestamps**: Automatic ISO timestamps
- **No Auto-display**: Errors are logged but do not auto-open the panel; use `quick-clouds.showLogs` or `logger.show()` to view
- **Console Fallback**: Also logs to console for development

### Usage Examples
```typescript
const logger = QuickCloudsLogger.getInstance();
logger.info('Operation started');
logger.warn('Potential issue detected');
logger.error('Operation failed', error);
logger.show(); // Manually show output channel
```

### Debugging Workflow
1. Install Quick Clouds extension
2. Open Quality Center
3. Run `quick-clouds.showLogs` command
4. Analyze logs to identify bottleneck
5. Implement fix based on findings

### Enhanced Debugging Workflow (Updated)
1. **Setup Debugging Environment**:
   - Use `.vscode/launch.json` for extension debugging
   - Ensure TypeScript validation is disabled in VSCode
   - Use pre-compiled JavaScript files in `out/` directory

2. **Live Check Error Debugging**:
   - Execute Live Check command
   - Check Quick Clouds output channel for detailed error logs
   - Look for "LiveCheck API Error Details" entries
   - Analyze server response data, status codes, and headers

3. **Quality Center Loading Issues**:
   - Use `qc2.myIssues` command to trigger Quality Center
   - Monitor Quick Clouds logs for execution traces
   - Identify bottlenecks in file system operations or database calls

4. **Error Resolution**:
   - Modify compiled JavaScript files directly in `out/` directory
   - Add logger imports when implementing new logging features
   - Test changes by reloading the extension window

## Write-Off UI: Duplicate Filename In Subtitle (Recurring)

### Symptom
- In the Write‑off panel, the subtitle shows duplicated identifiers, for example:
  - `csbd_MacRelatedList.js, line 57: csbd_MacRelatedList`
  - `SomeFile.js, line 25: SomeFile.js`

### Root Cause
- The React webview formats the subtitle as "<file>, line <n>: <element>". Some issues use an `elementName` equal to the file name (with or without extension). Without normalization, the element gets redundantly appended.
- The legacy bridge script (`media/webview-bridge.js`) also post‑processes subtitles. If the React UI wasn’t formatting consistently, the bridge filled the gap; this interaction can re‑introduce duplicates when code changes are rebuilt.

### Fix (Source of Truth: React UI)
We keep the logic in the React UI and make the bridge a no‑op when the text is already formatted.

1) React webview logic
- File: `webview-ui/src/App.js`
- Functions involved:
  - `getCleanElementName(issue)`: strips embedded "line N" fragments and filename suffixes `" - <file>"`.
  - `formatIssueLine(issue, includeElement)`: builds the subtitle and suppresses the element when it equals the filename ignoring case and extension.
- Normalization rule: compare `elementName` vs `fileName` case‑insensitively and after stripping extensions and path prefixes. If equal, omit the element so the subtitle is just `"<file>, line <n>"`.

2) Bridge guard
- File: `media/webview-bridge.js`
- Behavior: If the text already contains `", line N"`, it doesn’t rewrite it. This avoids double processing.

3) Rebuild the webview
```bash
npm run build:webview
```
Then reload the window or close/reopen the Write‑off panel.

### Quick Validation Checklist
- Bulk mode cards: show `"<file>, line <n>"` in the subtitle link.
- Single mode cards: show `"<file>, line <n>: <element>"` only when `<element>` is not just the filename.
- No `", line N: <file>"` where `<file>` matches the filename (with or without extension).

### Gotchas
- Don’t edit `webview-ui/build/*` directly; rebuild instead.
- If you must hot‑patch behavior while testing, `media/webview-bridge.js` is injected at runtime, but remember to keep it conservative (skip when already formatted) to avoid regressions.

## Key Commands

| Command | Description | Category |
|---------|-------------|----------|
| `quick-clouds.check` | Run Live Check analysis | Quick Clouds |
| `quick-clouds.myIssues` | Open Quality Center | Quick Clouds |
| `quick-clouds.writeoff` | Request issue write-off | Quick Clouds |
| `quick-clouds.settings` | Open settings panel | Quick Clouds |
| `quick-clouds.showLogs` | Show Quick Clouds logs | Quick Clouds |
| `quick-clouds.validateAPIKey` | Validate API key | Quick Clouds |

## File Structure

```
Quick Clouds/
├── src/
│   ├── extension.ts          # Main extension file
│   ├── panels/               # Webview panels
│   │   ├── MyIssuesPanel.ts  # Quality Center (main focus)
│   │   ├── SettingsPanel.ts  # Settings
│   │   └── WriteOffMenuPanel.ts
│   ├── services/             # Business logic
│   │   ├── GetDocumentsInfo.ts # File analysis (bottleneck)
│   │   ├── LiveCheck.ts      # Quality analysis
│   │   └── ...
│   ├── utilities/            # Helper functions
│   │   ├── logger.ts         # NEW: Logging system
│   │   ├── buttonLCSingleton.ts
│   │   └── ...
│   └── ...
├── webview-ui/               # React frontend
├── out/                      # Compiled JavaScript
├── package.json              # Extension manifest
└── AGENTS.md                 # This file
```

## Configuration

### Package.json Changes
- **Name**: `quick-clouds-for-salesforce` (was `livecheckqualityforsalesforce`)
- **Display Name**: `Quick Cloud for Salesforce` (was `Live Check Quality for Salesforce`)
- **Commands**: All prefixed with `quick-clouds.` instead of `qualityclouds.`
- **Configuration**: `QuickClouds.API-key` (was `UserConfiguration.API-key`)

### Environment
- **Target**: Production environment (`env_1.Env.PROD`)
- **VSCode Version**: ^1.64.0
- **Categories**: Linters, Language Packs

### Debugging Steps

1. **Enable Logging**: Ensure QuickCloudsLogger is properly initialized
2. **Check Output Channel**: Look for "Quick Clouds" in VSCode output panel
3. **Trace Execution**: Follow logs from command trigger to failure point
4. **Identify Bottleneck**: Look for operations that don't complete
5. **Implement Fix**: Add timeouts, error handling, or optimization

### Debug Mode Implementation ✅
- **Implemented**: Safe development mode for write-off operations
- **Features**:
  - **Setting-Based Control**: Uses `QuickClouds.debugMode` setting
  - **API Simulation**: Simulates write-off requests instead of sending them to server
  - **Development Safety**: Prevents accidental real API calls during development
  - **Clear Indicators**: All simulated operations show `[DEBUG]` prefix in messages
  - **Comprehensive Logging**: Detailed logging of simulated requests and responses
- **Files Created**:
  - `src/utilities/debugMode.ts` - Debug mode detection and management utility
  - `out/utilities/debugMode.js` - Compiled debug mode utility
- **Files Modified**:
  - `out/services/RequestWriteOff.js` - Added debug mode simulation
  - `out/services/BulkWriteOff.js` - Added debug mode simulation
  - `out/panels/WriteOffMenuPanel.js` - Added debug mode logging
  - `package.json` - Added `QuickCloudsConfiguration.debugMode` setting
- **Configuration**:
  - **Setting**: `QuickClouds.debugMode` (boolean, default: false)
  - **Description**: "Enable debug mode to simulate write-off requests instead of sending them to the server"
  - **Usage**: Activate in VSCode Settings to enable safe development mode

### Write-Off Panel Issue Format Fix ✅
- **Implemented**: Correct issue display format in write-off panel
- **Problem**: Issues were displayed inconsistently between single and bulk modes, neither showing the correct "filename.js, line X" format
- **Solution**:
  - **Enhanced Data Retrieval**: Modified `LocalStorageService.getLastScanIssuesFromHistoryId()` to include file path from history
  - **Added File Name Field**: Extended Issue interface to include `fileName` field
  - **Updated Display Logic**: Modified both single and bulk modes to show consistent format
- **Files Modified**:
  - `src/services/LocalStorageService.ts` - Enhanced to retrieve file path from history
  - `out/services/LocalStorageService.js` - Compiled version with file path retrieval
  - `src/services/BulkWriteOff.ts` - Added `fileName?: string` to Issue interface
  - `webview-ui/src/App.js` - Updated display format for both modes
- **Display Format**:
  - **Bulk Mode**: `{fileName}, line {lineNumber}` (e.g., "TestClass.cls, line 12")
  - **Single Mode**: `{fileName}, line {lineNumber}: {elementName}` (e.g., "TestClass.cls, line 12: testMethod")
- **Technical Details**:
  - Uses SQL JOIN to retrieve file path from `LivecheckHistory` table
  - Extracts filename using `path.basename()` from full file path
  - Fallback to "Unknown file" if filename is not available
  - Maintains backward compatibility with existing issue data

## Build and Release Process

### VSIX Packaging Guidelines
- **Version Increment**: Each time a new VSIX is published, the filename must include an incremented version
- **Naming Convention**: `quick-clouds-v1.0.0.vsix`
- **Build Command**: `npm run package`
- **Version Tracking**: Always increment the version number in the filename to avoid conflicts and maintain clear release history

### Build Process
```bash
# Install dependencies
npm install

# Package and install extension automatically
npm run package
```
**Script de Package Automatitzat:**
- **Comanda**: `npm run package`
- **Funcionalitat**: Genera VSIX amb timestamp i l'instal·la automàticament a VSCode
- **Format**: `quick-clouds-v1.0.0.vsix`
- **Requirement**: VSCode ha d'estar tancat per permetre la instal·lació automàtica
