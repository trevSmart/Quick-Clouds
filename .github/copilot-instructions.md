# Quick Clouds for Salesforce - GitHub Copilot Instructions

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Project Overview

Quick Clouds for Salesforce is a VSCode extension that provides automated code quality analysis for Salesforce development. It's a fork of the original "Live Check Quality for Salesforce" extension, customized with enhanced debugging capabilities and renamed commands to avoid conflicts.

## Working Effectively

### Bootstrap and Setup
1. **Install main dependencies:**
   ```bash
   npm install
   ```
   - Takes ~25 seconds on first install
   - Required for TypeScript compilation and extension development

2. **Install webview dependencies:**
   ```bash
   cd webview-ui && npm install && cd ..
   ```
   - Takes ~40 seconds on first install
   - Required for React-based UI components

### Build Process
**NEVER CANCEL builds - they are essential for the extension to work.**

1. **Build webview UI** (NEVER CANCEL - takes ~7 seconds):
   ```bash
   npm run build:webview
   ```
   - Timeout: Set to 300+ seconds to be safe
   - Compiles React components for extension panels
   - Uses legacy OpenSSL provider for compatibility
   - Creates webview-ui/build/ directory with compiled assets

2. **Build complete VSIX package** (NEVER CANCEL - takes ~15-25 seconds):
   ```bash
   npm run build:vsix
   ```
   - Timeout: Set to 600+ seconds to be safe
   - Rebuilds webview first, then packages extension
   - Creates `quick-clouds-build-check.vsix` file
   - File size: ~11MB with 1277 files

### Validation and Testing

1. **Run linting** (fast - ~2 seconds):
   ```bash
   npm run lint
   ```
   - Uses ESLint with TypeScript and React configurations
   - Checks both extension source and webview code

2. **Fix linting issues automatically:**
   ```bash
   npm run lint:fix
   ```

3. **Run tests** (fast - ~1-2 seconds):
   ```bash
   npm run test
   ```
   - Uses Vitest with jsdom environment
   - Mocks VSCode API for unit testing
   - Creates HTML test report in test-results/

4. **Run tests with coverage:**
   ```bash
   npm run test:coverage
   ```

### Complete Development Workflow
**ALWAYS run this complete workflow when making changes:**

```bash
# 1. Install dependencies (if not done recently)
npm install && cd webview-ui && npm install && cd ..

# 2. Build, lint, test, and package (NEVER CANCEL - takes ~25 seconds total)
npm run build:webview && npm run lint && npm run test && npm run build:vsix
```

### Production Packaging
Use the automated packaging script:
```bash
./scripts/package.sh
```
**Note:** This script increments version, packages to dist/, but requires VSCode installed for automatic installation. In CI environments, the installation step will fail - this is expected.

## Validation Scenarios

### Extension Functionality Testing
**ALWAYS test these scenarios after making code changes:**

1. **Verify VSIX creation:**
   ```bash
   ls -la *.vsix
   # Should show quick-clouds-build-check.vsix (~11MB)
   ```

2. **Validate package contents:**
   ```bash
   NODE_OPTIONS="--require ./scripts/vsce-file-polyfill.js" npx @vscode/vsce ls --tree
   ```

3. **Check compiled extension entry point:**
   ```bash
   ls -la out/extension.js
   # Should exist with reasonable size (>10KB)
   ```

### Manual Extension Testing
If VSCode is available:
1. Install the extension: `code --install-extension quick-clouds-build-check.vsix`
2. Open a Salesforce project
3. Test core commands:
   - `Quick Clouds: Run Quick Clouds scan` (Ctrl+Shift+P)
   - `Quick Clouds: Quality Center` (opens issues panel)
   - `Quick Clouds: Show Quick Clouds Logs` (for debugging)

## Critical Build Requirements

### Node.js Options
Several commands require specific NODE_OPTIONS:
- **Webview builds:** `NODE_OPTIONS=--openssl-legacy-provider` (compatibility with legacy crypto)
- **VSCE packaging:** `NODE_OPTIONS="--require ./scripts/vsce-file-polyfill.js"` (file system polyfill)

### Required Global Tools
Install these globally for development:
```bash
npm install -g @vscode/vsce typescript eslint
```

### TypeScript Configuration
- **Do NOT run `tsc` directly** - the project uses pre-compiled JavaScript files in `out/`
- TypeScript is configured with `"noEmit": true` - source files are for reference only
- Extension runtime uses compiled JavaScript files committed to the repository

## Project Structure

### Key Directories
```
Quick-Clouds/
├── src/                          # TypeScript source (reference only)
│   ├── extension.ts              # Main extension entry point
│   ├── panels/                   # Webview panels (Quality Center, Settings, Write-off)
│   ├── services/                 # Business logic (API clients, data services)
│   └── utilities/                # Helper functions, logging
├── out/                          # **CRITICAL** - Compiled JavaScript (runtime files)
│   ├── extension.js              # Main extension compiled file
│   └── [mirrors src structure]
├── webview-ui/                   # React frontend
│   ├── src/App.js               # Main React component
│   ├── build/                   # Compiled webview assets (after build)
│   └── package.json             # Webview dependencies
├── media/                        # Runtime resources
├── resources/                    # Extension assets
├── test/                         # Vitest test files
└── dist/                        # Package output directory
```

### Critical Files
- `package.json` - Extension manifest with commands and configuration
- `out/extension.js` - **MUST EXIST** - Main extension runtime file
- `webview-ui/build/` - **MUST BE BUILT** - Compiled React components
- `.vscodeignore` - Controls what goes into VSIX package

## Common Tasks

### Debugging Extension Issues
1. **Enable extension logging:**
   - Command: `Quick Clouds: Show Quick Clouds Logs`
   - Dedicated output channel for debugging

2. **Common debugging scenarios:**
   - Quality Center infinite loading: Check file system operations in logs
   - Scan API errors: Look for detailed API error logs with status codes
   - Panel not opening: Verify webview build completed successfully

### Code Quality
Always run before committing:
```bash
npm run lint && npm run test
```
**Required for CI pipeline** - GitHub workflow will fail without these passing.

### Extension Development
- **Main extension logic:** Edit files in `src/`, but runtime uses compiled `out/` files
- **UI changes:** Edit `webview-ui/src/App.js`, then run `npm run build:webview`
- **Settings/Commands:** Modify `package.json` contributes section

## Time Expectations and Timeouts

**CRITICAL: NEVER CANCEL these operations - set appropriate timeouts:**

| Operation | Time | Recommended Timeout |
|-----------|------|-------------------|
| `npm install` (main) | ~25 seconds | 300 seconds |
| `npm install` (webview) | ~40 seconds | 300 seconds |
| `npm run build:webview` | ~7 seconds | 300 seconds |
| `npm run build:vsix` | ~15-25 seconds | 600 seconds |
| `npm run lint` | ~2 seconds | 60 seconds |
| `npm run test` | ~1-2 seconds | 60 seconds |
| Complete workflow | ~25-30 seconds | 600 seconds |

## Environment Notes

### CI/CD Environment
- GitHub Actions workflow validates builds automatically
- VSIX installation will fail in CI (no VSCode) - this is expected
- All builds and tests must pass for PR merging

### Local Development
- VSCode extension development requires VSCode installed
- Use `F5` in VSCode to launch Extension Development Host for testing
- Extension debugging uses pre-compiled JavaScript files

### Known Issues
- **VSIX packaging warning:** "1277 files, 600 JavaScript files" - this is normal due to included node_modules
- **OpenSSL legacy provider needed:** For React build compatibility with newer Node.js versions
- **Large package size (~11MB):** Due to embedded dependencies - normal for VSCode extensions

## Quick Reference Commands

```bash
# Complete setup and build
npm install && cd webview-ui && npm install && cd .. && npm run build:webview && npm run lint && npm run test && npm run build:vsix

# Development workflow
npm run build:webview && npm run lint && npm run test

# Packaging for distribution
npm run build:vsix

# Testing and validation
npm run test && npm run lint

# Extension installation (local only)
code --install-extension quick-clouds-build-check.vsix
```

**Remember: Always validate builds complete successfully before assuming they work. Never cancel long-running builds.**