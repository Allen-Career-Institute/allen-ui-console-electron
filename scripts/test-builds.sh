#!/bin/bash

# Test Build Script
# Builds both electron-forge and electron-builder portable builds for size comparison

set -e

echo "🚀 BUILDING BOTH PORTABLE SYSTEMS FOR SIZE COMPARISON"
echo "====================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run command with status
run_command() {
    local cmd="$1"
    local desc="$2"
    
    echo -e "${BLUE}🔧${NC} $desc..."
    echo "  Command: $cmd"
    
    if eval "$cmd"; then
        echo -e "  ${GREEN}✅ Success${NC}"
    else
        echo -e "  ${RED}❌ Failed${NC}"
        return 1
    fi
    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍${NC} Checking prerequisites..."
if ! command_exists yarn; then
    echo -e "  ${RED}❌ Yarn not found${NC}"
    exit 1
fi
if ! command_exists git; then
    echo -e "  ${RED}❌ Git not found${NC}"
    exit 1
fi
echo -e "  ${GREEN}✅ Prerequisites met${NC}"
echo ""

# Clean previous builds
echo -e "${BLUE}🧹${NC} Cleaning previous builds..."
run_command "yarn clean:dist" "Clean dist directory"
run_command "rm -rf out dist-electron-builder" "Remove previous build directories"
echo ""

# Build TypeScript and renderer
echo -e "${BLUE}🔨${NC} Building TypeScript and renderer..."
run_command "yarn build:ts" "Build TypeScript"
run_command "yarn renderer:build" "Build renderer"
echo ""

# Build Electron-Forge (portable zip)
echo -e "${YELLOW}📦${NC} Building Electron-Forge portable (zip)..."
run_command "yarn build:win-forge" "Electron-Forge portable build"

# Build Electron-Builder (portable exe)
echo -e "${YELLOW}📦${NC} Building Electron-Builder portable (exe)..."
run_command "yarn build:win-builder" "Electron-Builder portable build"

# Run size analysis
echo -e "${GREEN}📊${NC} Running portable size analysis..."
echo ""
./scripts/analyze-size.sh

echo ""
echo -e "${GREEN}🎉${NC} Portable build comparison complete!"
echo ""
echo "Next steps:"
echo "  1. Check the 'out' directory for Electron-Forge portable (.zip)"
echo "  2. Check the 'dist-electron-builder' directory for Electron-Builder portable (.exe)"
echo "  3. Review the size analysis above"
echo "  4. Choose the optimal portable build system for your needs"
echo ""
echo "Expected portable sizes:"
echo "  - Electron-Forge: 80-110 MB (.zip)"
echo "  - Electron-Builder: 70-100 MB (.exe)"
echo ""
echo "Build artifacts:"
if [ -d "out" ]; then
    echo "  📁 Electron-Forge builds: out/"
    find out -name "*.zip" -exec ls -lh {} \; 2>/dev/null || echo "    No .zip files found"
else
    echo "  ❌ Electron-Forge builds: Not found"
fi

if [ -d "dist-electron-builder" ]; then
    echo "  📁 Electron-Builder builds: dist-electron-builder/"
    find dist-electron-builder -name "*.exe" -exec ls -lh {} \; 2>/dev/null || echo "    No .exe files found"
else
    echo "  ❌ Electron-Builder builds: Not found"
fi
