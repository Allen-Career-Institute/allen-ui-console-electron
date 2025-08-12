#!/bin/bash

# Size Analysis Script for Electron App
# This script helps identify large files and optimize bundle size

echo "🔍 Analyzing Electron App Bundle Size..."
echo "========================================"

# Check if out directory exists
if [ ! -d "out" ]; then
    echo "❌ No 'out' directory found. Run 'yarn make' first."
    exit 1
fi

# Find the largest directories and files
echo ""
echo "📊 Largest Directories in 'out':"
du -h -d 2 out/ | sort -hr | head -10

echo ""
echo "📁 Largest Files in 'out':"
find out/ -type f -exec ls -lh {} \; | sort -k5 -hr | head -15

echo ""
echo "📦 Node Modules Size Analysis:"
if [ -d "out/make/win32/x64/win-unpacked/resources/app.asar.unpacked/node_modules" ]; then
    echo "Node modules in app.asar.unpacked:"
    du -h -d 1 out/make/win32/x64/win-unpacked/resources/app.asar.unpacked/node_modules/ | sort -hr | head -10
fi

echo ""
echo "🎯 Size Optimization Tips:"
echo "1. Remove unnecessary dependencies from package.json"
echo "2. Use 'prune: true' in forge config (already added)"
echo "3. Exclude test files and documentation"
echo "4. Only include essential assets"
echo "5. Consider using external CDNs for large libraries"

echo ""
echo "📏 Total Bundle Size:"
du -sh out/

echo ""
echo "✅ Analysis complete!"
