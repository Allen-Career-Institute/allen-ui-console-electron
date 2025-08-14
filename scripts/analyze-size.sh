#!/bin/bash

# Portable Build Size Analysis Script
# Compares sizes between electron-forge and electron-builder portable builds

set -e

echo "🔍 PORTABLE BUILD SIZE ANALYSIS"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to format file size
format_size() {
    local size=$1
    if [ $size -gt 1048576 ]; then
        echo "$(echo "scale=2; $size/1048576" | bc) MB"
    elif [ $size -gt 1024 ]; then
        echo "$(echo "scale=2; $size/1024" | bc) KB"
    else
        echo "${size} B"
    fi
}

# Function to analyze directory
analyze_directory() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ $name directory not found: $dir${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📁 $name Portable Build Analysis:${NC}"
    echo "  Directory: $dir"
    
    # Find all executable files and archives
    local exe_files=$(find "$dir" -name "*.exe" 2>/dev/null || true)
    local zip_files=$(find "$dir" -name "*.zip" 2>/dev/null || true)
    
    if [ -z "$exe_files" ] && [ -z "$zip_files" ]; then
        echo -e "  ${YELLOW}⚠️  No .exe or .zip files found${NC}"
        return 1
    fi
    
    local total_size=0
    local file_count=0
    
    echo "  Files found:"
    
    # Process .exe files (electron-builder)
    if [ -n "$exe_files" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
                local size_mb=$(echo "scale=2; $size/1048576" | bc 2>/dev/null || echo "0")
                echo -e "    ${GREEN}✅${NC} $(basename "$file"): ${size_mb} MB"
                total_size=$((total_size + size))
                file_count=$((file_count + 1))
            fi
        done <<< "$exe_files"
    fi
    
    # Process .zip files (electron-forge)
    if [ -n "$zip_files" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
                local size_mb=$(echo "scale=2; $size/1048576" | bc 2>/dev/null || echo "0")
                echo -e "    ${GREEN}✅${NC} $(basename "$file"): ${size_mb} MB"
                total_size=$((total_size + size))
                file_count=$((file_count + 1))
            fi
        done <<< "$zip_files"
    fi
    
    # Calculate total directory size
    local dir_size=$(du -sb "$dir" 2>/dev/null | cut -f1 || echo "0")
    local dir_size_mb=$(echo "scale=2; $dir_size/1048576" | bc 2>/dev/null || echo "0")
    
    echo "  Summary:"
    echo -e "    ${BLUE}📊${NC} Portable files: $file_count"
    echo -e "    ${BLUE}📊${NC} Total file size: $(format_size $total_size)"
    echo -e "    ${BLUE}📊${NC} Directory size: ${dir_size_mb} MB"
    
    # Store results for comparison
    if [ "$name" = "Electron-Forge" ]; then
        FORGE_SIZE=$dir_size
        FORGE_EXE_COUNT=$file_count
        FORGE_TOTAL_SIZE=$total_size
    elif [ "$name" = "Electron-Builder" ]; then
        BUILDER_SIZE=$dir_size
        BUILDER_EXE_COUNT=$file_count
        BUILDER_TOTAL_SIZE=$total_size
    fi
    
    echo ""
}

# Function to compare builds
compare_builds() {
    echo -e "${YELLOW}📊 PORTABLE BUILD COMPARISON${NC}"
    echo "================================"
    
    if [ -n "$FORGE_SIZE" ] && [ -n "$BUILDER_SIZE" ]; then
        local size_diff=$((BUILDER_SIZE - FORGE_SIZE))
        local size_diff_mb=$(echo "scale=2; $size_diff/1048576" | bc 2>/dev/null || echo "0")
        local total_size_diff=$((BUILDER_TOTAL_SIZE - FORGE_TOTAL_SIZE))
        local total_size_diff_mb=$(echo "scale=2; $total_size_diff/1048576" | bc 2>/dev/null || echo "0")
        
        echo "Results:"
        echo -e "  ${BLUE}🔧${NC} Electron-Forge: ${FORGE_SIZE} bytes ($(format_size $FORGE_SIZE))"
        echo -e "  ${BLUE}🔧${NC} Electron-Builder: ${BUILDER_SIZE} bytes ($(format_size $BUILDER_SIZE))"
        echo ""
        
        if [ $size_diff -lt 0 ]; then
            echo -e "  ${GREEN}✅${NC} Electron-Builder is $(echo "scale=2; -$size_diff/1048576" | bc) MB SMALLER"
        elif [ $size_diff -gt 0 ]; then
            echo -e "  ${RED}❌${NC} Electron-Builder is ${size_diff_mb} MB LARGER"
        else
            echo -e "  ${YELLOW}⚖️${NC} Both portable builds are the same size"
        fi
        
        echo ""
        echo -e "  ${BLUE}📈${NC} Directory size difference: ${size_diff_mb} MB"
        echo -e "  ${BLUE}📈${NC} File size difference: ${total_size_diff_mb} MB"
        echo -e "  ${BLUE}📈${NC} Percentage difference: $(echo "scale=2; ($size_diff * 100) / $FORGE_SIZE" | bc)%"
        
    elif [ -n "$FORGE_SIZE" ]; then
        echo -e "  ${YELLOW}⚠️${NC} Only Electron-Forge portable build found"
    elif [ -n "$BUILDER_SIZE" ]; then
        echo -e "  ${YELLOW}⚠️${NC} Only Electron-Builder portable build found"
    else
        echo -e "  ${RED}❌${NC} No portable builds found to compare"
    fi
}

# Function to show detailed analysis
show_detailed_analysis() {
    echo ""
    echo -e "${PURPLE}🔍 DETAILED ANALYSIS${NC}"
    echo "====================="
    
    if [ -n "$FORGE_SIZE" ] && [ -n "$BUILDER_SIZE" ]; then
        local forge_mb=$(echo "scale=2; $FORGE_SIZE/1048576" | bc 2>/dev/null || echo "0")
        local builder_mb=$(echo "scale=2; $BUILDER_SIZE/1048576" | bc 2>/dev/null || echo "0")
        local size_diff=$((BUILDER_SIZE - FORGE_SIZE))
        local size_diff_mb=$(echo "scale=2; $size_diff/1048576" | bc 2>/dev/null || echo "0")
        local percentage=$(echo "scale=2; ($size_diff * 100) / $FORGE_SIZE" | bc 2>/dev/null || echo "0")
        
        echo "Size Comparison:"
        echo -e "  ${CYAN}📦${NC} Electron-Forge: ${forge_mb} MB"
        echo -e "  ${CYAN}📦${NC} Electron-Builder: ${builder_mb} MB"
        echo -e "  ${CYAN}📦${NC} Difference: ${size_diff_mb} MB (${percentage}%)"
        echo ""
        
        if [ $size_diff -lt 0 ]; then
            echo -e "  ${GREEN}🏆${NC} Electron-Builder wins by $(echo "scale=2; -$size_diff/1048576" | bc) MB"
        elif [ $size_diff -gt 0 ]; then
            echo -e "  ${GREEN}🏆${NC} Electron-Forge wins by ${size_diff_mb} MB"
        else
            echo -e "  ${YELLOW}🤝${NC} Both builds are identical in size"
        fi
    fi
}

# Function to show recommendations
show_recommendations() {
    echo ""
    echo -e "${YELLOW}💡 RECOMMENDATIONS FOR PORTABLE BUILDS${NC}"
    echo "================================================"
    
    if [ -n "$FORGE_SIZE" ] && [ -n "$BUILDER_SIZE" ]; then
        if [ $BUILDER_SIZE -lt $FORGE_SIZE ]; then
            echo -e "  ${GREEN}✅${NC} Electron-Builder provides smaller portable builds"
            echo -e "  ${GREEN}✅${NC} Consider using electron-builder for distribution"
            echo -e "  ${GREEN}✅${NC} Better for bandwidth-constrained environments"
        else
            echo -e "  ${YELLOW}⚠️${NC} Electron-Forge provides smaller portable builds"
            echo -e "  ${YELLOW}⚠️${NC} Consider keeping electron-forge for size optimization"
            echo -e "  ${YELLOW}⚠️${NC} May be better for storage-constrained environments"
        fi
    fi
    
    echo ""
    echo "Portable build benefits:"
    echo -e "  ${BLUE}🔧${NC} Smaller package sizes (no installer overhead)"
    echo -e "  ${BLUE}🔧${NC} No installation required (run anywhere)"
    echo -e "  ${BLUE}🔧${NC} Faster distribution and testing"
    echo -e "  ${BLUE}🔧${NC} Fair comparison between build systems"
    echo ""
    echo "Usage recommendations:"
    echo -e "  ${GREEN}🚀${NC} Development: Use smaller build for faster iteration"
    echo -e "  ${GREEN}🚀${NC} Testing: Use both for comprehensive testing"
    echo -e "  ${GREEN}🚀${NC} Production: Choose based on size vs features"
}

# Function to generate GitHub Actions output
generate_github_output() {
    if [ -n "$FORGE_SIZE" ] && [ -n "$BUILDER_SIZE" ]; then
        local forge_mb=$(echo "scale=2; $FORGE_SIZE/1048576" | bc 2>/dev/null || echo "0")
        local builder_mb=$(echo "scale=2; $BUILDER_SIZE/1048576" | bc 2>/dev/null || echo "0")
        local size_diff=$((BUILDER_SIZE - FORGE_SIZE))
        local size_diff_mb=$(echo "scale=2; $size_diff/1048576" | bc 2>/dev/null || echo "0")
        local percentage=$(echo "scale=2; ($size_diff * 100) / $FORGE_SIZE" | bc 2>/dev/null || echo "0")
        
        echo "::set-output name=forge_size::$forge_mb"
        echo "::set-output name=builder_size::$builder_mb"
        echo "::set-output name=size_difference::$size_diff_mb"
        echo "::set-output name=percentage_difference::$percentage"
        
        if [ $size_diff -lt 0 ]; then
            echo "::set-output name=winner::electron-builder"
            echo "::set-output name=recommendation::Use Electron-Builder for smaller builds"
        elif [ $size_diff -gt 0 ]; then
            echo "::set-output name=winner::electron-forge"
            echo "::set-output name=recommendation::Use Electron-Forge for smaller builds"
        else
            echo "::set-output name=winner::tie"
            echo "::set-output name=recommendation::Both builds are the same size"
        fi
    fi
}

# Main analysis
echo "Starting portable build size analysis..."
echo ""

# Analyze Electron-Forge build (portable zip)
analyze_directory "out" "Electron-Forge"

# Analyze Electron-Builder build (portable exe)
analyze_directory "dist-electron-builder" "Electron-Builder"

# Compare builds
compare_builds

# Show detailed analysis
show_detailed_analysis

# Show recommendations
show_recommendations

# Generate GitHub Actions output
generate_github_output

echo ""
echo -e "${GREEN}✅ Portable build analysis complete!${NC}"
echo ""
echo "To build both portable systems for comparison:"
echo "  1. yarn build:win-forge      # Electron-Forge portable"
echo "  2. yarn build:win-builder    # Electron-Builder portable"
echo "  3. Run this script again     # ./scripts/analyze-size.sh"
echo ""
echo "Expected portable sizes:"
echo "  - Electron-Forge: 80-110 MB (.zip)"
echo "  - Electron-Builder: 70-100 MB (.exe)"
