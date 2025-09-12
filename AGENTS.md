# QC2 Extension - Agent Knowledge Base

## Project Overview

QC2 is a customized version of the QualityClouds QC2 extension. It's a VSCode extension that provides automated code quality analysis for Salesforce development, including Apex, Lightning Web Components, and other Salesforce metadata.

## Project History & Context

- **Original Extension**: QualityClouds QC2 (v2.3.1)
- **Customized Version**: QC2 (forked, renamed and modified)
- **Main Issue**: The original extension had a critical bug where the "Quality Center" panel would get stuck in an infinite loading state
- **Solution Approach**: Implemented comprehensive logging and debugging capabilities to identify and fix the loading issue

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

- `package.json` - Updated command names from `qualityclouds.*` to `qc2.*`
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
- Implemented comprehensive logging system (`QC2Logger`)
- Added detailed traces to `MyIssuesPanel.ts` message handler
- Created output channel "QC2" for real-time debugging

**Suspected Bottlenecks:**
1. `docs.default.getDocumentsInfo(directory.toString())` - File system analysis
2. `this._storageManager.getUserData()` - Database operations
3. `JSON.stringify(myIssuesData)` - Large object serialization

**Debugging Commands:**
- `qc2.showLogs` - Opens QC2 output channel
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
- **Client Name Fix**: Changed from `'SalesforceVSCPlugin'` to `'VSCodeExtension'`

**Files Modified:**
- `out/services/LiveCheck.js` - Enhanced API error handling
- `out/utilities/executeLiveCheck.js` - Enhanced execution error handling
- `out/constants.js` - Updated QC_CLIENT_NAME
- `src/constants.ts` - Updated QC_CLIENT_NAME
- Added logger imports to both files

### Command Conflicts Resolved

**Original Issue:**
- Extension commands conflicted with original QualityClouds extension
- Commands like `qualityclouds.check` were already registered

**Solution:**
- Renamed all commands from `qualityclouds.*` to `qc2.*`
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

# Package extension (skips compilation due to JS conflicts)
npm run package
```

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

### QC2Logger Features
- **Output Channel**: Dedicated "QC2" channel in VSCode
- **Log Levels**: INFO, WARN, ERROR
- **Timestamps**: Automatic ISO timestamps
- **Auto-display**: Shows channel on errors
- **Console Fallback**: Also logs to console for development

### Usage Examples
```typescript
const logger = QC2Logger.getInstance();
logger.info('Operation started');
logger.warn('Potential issue detected');
logger.error('Operation failed', error);
logger.show(); // Manually show output channel
```

### Debugging Workflow
1. Install QC2 extension
2. Open Quality Center
3. Run `qc2.showLogs` command
4. Analyze logs to identify bottleneck
5. Implement fix based on findings

### Enhanced Debugging Workflow (Updated)
1. **Setup Debugging Environment**:
   - Use `.vscode/launch.json` for extension debugging
   - Ensure TypeScript validation is disabled in VSCode
   - Use pre-compiled JavaScript files in `out/` directory

2. **Live Check Error Debugging**:
   - Execute Live Check command
   - Check QC2 output channel for detailed error logs
   - Look for "LiveCheck API Error Details" entries
   - Analyze server response data, status codes, and headers

3. **Quality Center Loading Issues**:
   - Use `qc2.myIssues` command to trigger Quality Center
   - Monitor QC2 logs for execution traces
   - Identify bottlenecks in file system operations or database calls

4. **Error Resolution**:
   - Modify compiled JavaScript files directly in `out/` directory
   - Add logger imports when implementing new logging features
   - Test changes by reloading the extension window

## Key Commands

| Command | Description | Category |
|---------|-------------|----------|
| `qc2.check` | Run Live Check analysis | QC2 |
| `qc2.myIssues` | Open Quality Center | QC2 |
| `qc2.writeoff` | Request issue write-off | QC2 |
| `qc2.settings` | Open settings panel | QC2 |
| `qc2.showLogs` | Show QC2 logs | QC2 |
| `qc2.validateAPIKey` | Validate API key | QC2 |

## File Structure

```
QC2/
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
- **Name**: `qc2` (was `livecheckqualityforsalesforce`)
- **Display Name**: `QC2` (was `QC2`)
- **Commands**: All prefixed with `qc2.` instead of `qualityclouds.`
- **Configuration**: `QC2Configuration.API-key` (was `UserConfiguration.API-key`)

### Environment
- **Target**: Production environment (`env_1.Env.PROD`)
- **VSCode Version**: ^1.64.0
- **Categories**: Linters, Language Packs

## Troubleshooting

### Common Issues

1. **Extension Not Loading**
   - Check for command conflicts with original QualityClouds
   - Verify all `qc2.*` commands are properly registered

2. **Quality Center Stuck Loading**
   - Use `qc2.showLogs` to see detailed traces
   - Look for the last log entry to identify bottleneck
   - Check if `docs.default.getDocumentsInfo()` is hanging

3. **Build Errors**
   - TypeScript conflicts due to JS compilation
   - Use `npm run package` with prepublish script disabled
   - Avoid `npm run compile` due to variable conflicts

4. **TypeScript Compilation Issues**
   - **Problem**: `Cannot redeclare block-scoped variable` errors
   - **Cause**: VSCode trying to compile pre-compiled JavaScript files as TypeScript
   - **Solution**:
     - Set `"noEmit": true` and `"allowJs": true` in `tsconfig.json`
     - Disable TypeScript validation in VSCode settings
     - Add `.vscodeignore` to exclude TypeScript source files
     - Remove `preLaunchTask` from debug configuration

5. **Logger Import Errors**
   - **Problem**: `logger_1 is not defined` when using enhanced logging
   - **Cause**: Missing logger imports in compiled JavaScript files
   - **Solution**: Manually add logger imports to compiled files:
     ```javascript
     const logger_1 = require("../utilities/logger");
     ```

### Debugging Steps

1. **Enable Logging**: Ensure QC2Logger is properly initialized
2. **Check Output Channel**: Look for "QC2" in VSCode output panel
3. **Trace Execution**: Follow logs from command trigger to failure point
4. **Identify Bottleneck**: Look for operations that don't complete
5. **Implement Fix**: Add timeouts, error handling, or optimization

## Recent Improvements (Session Updates)

### Enhanced Error Logging System ✅
- **Implemented**: Comprehensive API error logging for Live Check failures
- **Features**:
  - Detailed server response capture (status, data, headers)
  - Request information logging (URL, method, auth type)
  - Enhanced user error messages with specific details
  - Complete stack trace logging for debugging
- **Files Modified**: `out/services/LiveCheck.js`, `out/utilities/executeLiveCheck.js`

### VSCode Debugging Setup ✅
- **Implemented**: Complete debugging configuration for extension development
- **Features**:
  - Launch configurations for extension debugging
  - Build tasks for compilation
  - Workspace settings to prevent TypeScript conflicts
  - Source map support for debugging compiled JavaScript
- **Files Created**: `.vscode/launch.json`, `.vscode/tasks.json`, `.vscode/settings.json`

### TypeScript Configuration Optimization ✅
- **Implemented**: Resolved TypeScript compilation conflicts
- **Features**:
  - Disabled TypeScript emission (using pre-compiled JS)
  - Configured VSCode to skip TypeScript source files
  - Removed obsolete TypeScript options
  - Fixed variable redeclaration errors
- **Files Modified**: `tsconfig.json`, `.vscode/settings.json`

### Write-Off Interface Overhaul ✅
- **Implemented**: Complete redesign of write-off interface for efficiency
- **Features**:
  - **Bulk Write-Off Support**: Select and process multiple issues at once
  - **Write-Off Templates**: Pre-defined templates for common reasons
  - **Dual Mode Interface**: Bulk mode and single mode for different workflows
  - **Smart Filtering**: Filter by severity, rule type, and search terms
  - **Grouped Issues**: Issues grouped by rule type for better organization
  - **Validation**: Comprehensive validation before submission
  - **Progress Feedback**: Real-time feedback during bulk operations
- **Files Created**:
  - `src/services/BulkWriteOff.ts` - Service for bulk write-off operations
  - `out/services/BulkWriteOff.js` - Compiled bulk write-off service
  - `webview-ui/src/App.js` - New React interface
  - `webview-ui/src/App.css` - Enhanced styling
  - `webview-ui/src/index.js` - React entry point
- **Files Modified**:
  - `out/panels/WriteOffMenuPanel.js` - Enhanced with bulk operations
  - `webview-ui/package.json` - Updated for new interface
- **Templates Available**:
  - False Positive Rule
  - Business Requirement
  - Legacy Code
  - Performance Optimization
  - Third Party Integration

### Debug Mode Implementation ✅
- **Implemented**: Safe development mode for write-off operations
- **Features**:
  - **Setting-Based Control**: Uses `QC2Configuration.debugMode` setting
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
  - `package.json` - Added `QC2Configuration.debugMode` setting
- **Configuration**:
  - **Setting**: `QC2Configuration.debugMode` (boolean, default: false)
  - **Description**: "Enable debug mode to simulate write-off requests instead of sending them to the server"
  - **Usage**: Activate in VSCode Settings to enable safe development mode

## Build and Release Process

### VSIX Packaging Guidelines
- **Version Increment**: Each time a new VSIX is published, the filename must include an incremented version
- **Naming Convention**: `qc2-YYYYMMDD-HHMMSS.vsix` (e.g., `qc2-20250110-143022.vsix`)
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
- **Format**: `qc2-YYYYMMDD-HHMMSS.vsix`
- **Requirement**: VSCode ha d'estar tancat per permetre la instal·lació automàtica

## Future Improvements

### Immediate Priorities
1. **Fix Quality Center Loading**: Resolve infinite loading issue
2. **Optimize Performance**: Improve `getDocumentsInfo()` performance
3. **Error Handling**: Add better error recovery mechanisms

### Long-term Enhancements
1. **Async Operations**: Make file system operations non-blocking
2. **Progress Indicators**: Show loading progress to users
3. **Caching**: Implement intelligent caching for repeated operations
4. **Configuration**: Add more customization options

## Contact & Support

- **Original Extension**: QualityClouds QC2
- **Customized Version**: QC2 (internal modification)
- **Issue Tracking**: Use QC2 output channel for debugging
- **Development**: Follow logging-based debugging approach

---

*This document was generated based on the debugging and modification work done on the QC2 extension. It should be updated as new issues are discovered and resolved.*
