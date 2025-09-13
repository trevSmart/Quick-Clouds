# Changelog

All notable changes to Quick Clouds will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.160] - 2025-01-26

### Fixed
- Resolved error when running "Clear live check issues" by clearing scan history without wiping user settings

## [2.3.161] - 2025-01-26

### Fixed
- Added polyfill for missing `File` global so VSIX packaging works in Node.js 18 environments

## [2.3.159] - 2025-01-25

### Fixed
- Fixed LWC JavaScript file detection issue where LWC `.js` files were incorrectly identified as unsupported
- Updated regex pattern in `IsElementToAnalize.ts` from `/\/force-app\/.*\/lwc\/[^/]+\.js$/i` to `/\/force-app\/.*\/lwc\/.*\.js$/i` to properly handle LWC component folder structure

## [2.3.66] - 2024-01-12

### Changed
- Migrated license from LICENSE.txt to LICENSE.md format for better readability
- Added explicit license field to package.json

## [2.3.65] - 2024-01-11

### Added
- Combobox for write-off reasons selection
- Hardcoded write-off reasons as fallback options

### Changed
- Replaced text input field with dropdown selection for write-off reasons
- Improved user experience in write-off interface

### Technical Details
- Added HARDCODED_REASONS constant to React component
- Updated webview interface to use select element instead of input
- Compiled and packaged new interface components

## [2.3.64] - 2024-01-10

### Added
- Enhanced debugging capabilities with comprehensive logging system
- QC2Logger utility for better error tracking and debugging
- Debug mode for write-off operations simulation

### Changed
- Improved error handling in LiveCheck API calls
- Enhanced write-off interface with bulk operations support
- Updated VSCode debugging configuration

### Fixed
- Resolved Quality Center infinite loading issue
- Fixed LiveCheck API error handling and client identification
- Resolved TypeScript compilation conflicts

## [2.3.63] - 2024-01-09

### Added
- Bulk write-off functionality
- Write-off templates system
- Enhanced write-off interface with React components

### Changed
- Renamed commands from `qualityclouds.*` to `qc2.*` to avoid conflicts
- Updated extension branding and configuration keys
- Improved write-off request handling

## [2.3.62] - 2024-01-08

### Added
- Custom logging system for debugging
- Enhanced error reporting for API failures
- Debug mode for development safety

### Changed
- Migrated from original Live Check Quality for Salesforce extension
- Updated extension name and display name to QC2
- Improved authentication handling

## [2.3.61] - 2024-01-07

### Added
- Initial QC2 fork from Live Check Quality for Salesforce
- Custom modifications for internal use
- Enhanced debugging capabilities

---

## Original Extension History

This changelog covers QC2 modifications. For the original Live Check Quality for Salesforce extension history, refer to the original extension documentation.

### Key Original Features
- Real-time code quality analysis for Salesforce
- Integration with QualityClouds rulesets
- LiveCheck functionality
- Write-off request system
- Quality Center panel
- Best practices validation
