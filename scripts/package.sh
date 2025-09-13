#!/bin/bash

# Quick Clouds for Salesforce - Package Script
# This script builds the webview, increments version, packages the extension, and installs it

set -e  # Exit on any error

echo "🚀 Starting Quick Clouds packaging process..."

# Step 1: Build webview
echo "📦 Building webview..."
npm run build:webview

# Step 2: Increment version
echo "📈 Incrementing version..."
npm version patch --no-git-tag-version

# Step 3: Get new version
VERSION=$(node -p "require('./package.json').version")
echo "📋 New version: $VERSION"

# Step 4: Clean old versions (keep only 8 most recent)
echo "🧹 Cleaning old versions (keeping 8 most recent)..."
cd dist/
# Count total .vsix files
TOTAL_FILES=$(ls -1 quick-clouds-v*.vsix 2>/dev/null | wc -l)
if [ $TOTAL_FILES -gt 8 ]; then
    FILES_TO_DELETE=$((TOTAL_FILES - 8))
    echo "📊 Found $TOTAL_FILES versions, removing $FILES_TO_DELETE oldest..."
    # Sort by modification time (oldest first) and delete oldest files
    ls -1t quick-clouds-v*.vsix | tail -n $FILES_TO_DELETE | xargs rm -f
    echo "🗑️  Removed $FILES_TO_DELETE old version(s)"
else
    echo "📊 Found $TOTAL_FILES versions, no cleanup needed"
fi
cd ..

# Step 5: Package extension
echo "📦 Packaging extension..."
NODE_OPTIONS="--require ./scripts/vsce-file-polyfill.js" vsce package --out "dist/quick-clouds-v$VERSION.vsix"

# Step 6: Install extension
echo "🔧 Installing extension..."
code-insiders --install-extension "dist/quick-clouds-v$VERSION.vsix" --force

echo "✅ Package process completed successfully!"
echo "📁 Extension file: dist/quick-clouds-v$VERSION.vsix"
