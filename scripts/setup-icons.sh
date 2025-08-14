#!/bin/bash

# Icon setup script for Allen Console Electron App
# This script helps manage icons for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v yarn &> /dev/null; then
        print_error "yarn is not installed. Please install yarn first."
        exit 1
    fi
    
    if ! command -v electron-icon-builder &> /dev/null; then
        print_warning "electron-icon-builder not found globally. Installing locally..."
        yarn add -D electron-icon-builder
    fi
    
    print_success "Dependencies check completed"
}

# Function to generate icons
generate_icons() {
    print_status "Generating icons for all platforms..."
    
    if [ ! -f "assets/icons/png/1024x1024.png" ]; then
        print_error "Source icon (1024x1024.png) not found in assets/icons/png/"
        exit 1
    fi
    
    yarn icons:generate
    
    print_success "Icons generated successfully"
}

# Function to verify icon setup
verify_icons() {
    print_status "Verifying icon setup..."
    
    local missing_icons=()
    
    # Check Windows icon
    if [ ! -f "assets/icons/win/icon.ico" ]; then
        missing_icons+=("Windows icon (assets/icons/win/icon.ico)")
    fi
    
    # Check macOS icon
    if [ ! -f "assets/icons/mac/icon.icns" ]; then
        missing_icons+=("macOS icon (assets/icons/mac/icon.icns)")
    fi
    
    # Check Linux icons
    local linux_icons=("16x16.png" "24x24.png" "32x32.png" "48x48.png" "64x64.png" "128x128.png" "256x256.png" "512x512.png" "1024x1024.png")
    for icon in "${linux_icons[@]}"; do
        if [ ! -f "assets/icons/png/$icon" ]; then
            missing_icons+=("Linux icon ($icon)")
        fi
    done
    
    if [ ${#missing_icons[@]} -eq 0 ]; then
        print_success "All icons are present and properly configured"
    else
        print_warning "Missing icons:"
        for icon in "${missing_icons[@]}"; do
            echo "  - $icon"
        done
        print_status "Run 'yarn icons:generate' to generate missing icons"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  generate    Generate icons for all platforms"
    echo "  verify      Verify current icon setup"
    echo "  setup       Full setup (check dependencies, generate icons, verify)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # Full setup process"
    echo "  $0 generate  # Generate icons only"
    echo "  $0 verify    # Verify icons only"
}

# Main script logic
main() {
    case "${1:-setup}" in
        "generate")
            check_dependencies
            generate_icons
            ;;
        "verify")
            verify_icons
            ;;
        "setup")
            check_dependencies
            generate_icons
            verify_icons
            print_success "Icon setup completed successfully!"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
