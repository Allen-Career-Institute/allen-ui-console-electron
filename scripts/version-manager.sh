#!/bin/bash

# Version Manager Script for Allen UI Console Electron
# This script helps manage versioning for releases

set -e

echo "📦 Version Manager for Allen UI Console Electron"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get current version
get_current_version() {
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo "$CURRENT_VERSION"
}

# Show current version
show_current_version() {
    CURRENT_VERSION=$(get_current_version)
    print_info "Current version: $CURRENT_VERSION"
}

# Calculate next version
calculate_next_version() {
    local version_type=$1
    local current_version=$(get_current_version)
    
    # Split version into components
    IFS='.' read -r major minor patch <<< "$current_version"
    
    case $version_type in
        "major")
            new_major=$((major + 1))
            echo "$new_major.0.0"
            ;;
        "minor")
            new_minor=$((minor + 1))
            echo "$major.$new_minor.0"
            ;;
        "patch")
            new_patch=$((patch + 1))
            echo "$major.$minor.$new_patch"
            ;;
        *)
            print_error "Invalid version type: $version_type"
            print_info "Valid types: major, minor, patch"
            exit 1
            ;;
    esac
}

# Update version in package.json
update_version() {
    local new_version=$1
    local current_version=$(get_current_version)
    
    print_info "Updating version: $current_version -> $new_version"
    
    # Update package.json
    npm version "$new_version" --no-git-tag-version
    
    print_success "Version updated to $new_version"
}

# Show version history
show_version_history() {
    print_info "Recent version tags:"
    git tag --sort=-version:refname | head -10
}

# Create release tag
create_release_tag() {
    local version=$1
    local message=${2:-"Release version $version"}
    
    print_info "Creating release tag: v$version"
    
    # Check if tag already exists
    if git tag -l "v$version" | grep -q "v$version"; then
        print_warning "Tag v$version already exists"
        read -p "Do you want to delete and recreate it? (y/n): " recreate
        if [[ $recreate == "y" || $recreate == "Y" ]]; then
            git tag -d "v$version"
            git push origin ":refs/tags/v$version" 2>/dev/null || true
        else
            print_info "Skipping tag creation"
            return
        fi
    fi
    
    # Create and push tag
    git tag -a "v$version" -m "$message"
    git push origin "v$version"
    
    print_success "Release tag v$version created and pushed"
}

# Interactive version bump
interactive_bump() {
    show_current_version
    echo ""
    print_info "Select version increment type:"
    echo "1) Patch (1.0.0 -> 1.0.1) - Bug fixes"
    echo "2) Minor (1.0.0 -> 1.1.0) - New features"
    echo "3) Major (1.0.0 -> 2.0.0) - Breaking changes"
    echo "4) Custom version"
    echo "5) Cancel"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            new_version=$(calculate_next_version "patch")
            update_version "$new_version"
            ;;
        2)
            new_version=$(calculate_next_version "minor")
            update_version "$new_version"
            ;;
        3)
            new_version=$(calculate_next_version "major")
            update_version "$new_version"
            ;;
        4)
            read -p "Enter custom version (e.g., 1.2.3): " custom_version
            if [[ $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                update_version "$custom_version"
            else
                print_error "Invalid version format. Use semantic versioning (e.g., 1.2.3)"
                exit 1
            fi
            ;;
        5)
            print_info "Version bump cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  current              Show current version"
    echo "  bump [type]          Bump version (patch|minor|major)"
    echo "  set [version]        Set specific version"
    echo "  interactive          Interactive version bump"
    echo "  history              Show version history"
    echo "  tag [version]        Create release tag"
    echo "  help                 Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 current                    # Show current version"
    echo "  $0 bump patch                 # Bump patch version"
    echo "  $0 bump minor                 # Bump minor version"
    echo "  $0 bump major                 # Bump major version"
    echo "  $0 set 1.2.3                  # Set version to 1.2.3"
    echo "  $0 interactive                # Interactive version bump"
    echo "  $0 tag 1.2.3                  # Create release tag v1.2.3"
    echo ""
    echo "Version Types:"
    echo "  patch: 1.0.0 -> 1.0.1 (bug fixes)"
    echo "  minor: 1.0.0 -> 1.1.0 (new features)"
    echo "  major: 1.0.0 -> 2.0.0 (breaking changes)"
}

# Main execution
main() {
    case "${1:-help}" in
        "current")
            show_current_version
            ;;
        "bump")
            if [ -z "$2" ]; then
                print_error "Version type required (patch|minor|major)"
                exit 1
            fi
            new_version=$(calculate_next_version "$2")
            update_version "$new_version"
            ;;
        "set")
            if [ -z "$2" ]; then
                print_error "Version required"
                exit 1
            fi
            update_version "$2"
            ;;
        "interactive")
            interactive_bump
            ;;
        "history")
            show_version_history
            ;;
        "tag")
            if [ -z "$2" ]; then
                version=$(get_current_version)
            else
                version=$2
            fi
            create_release_tag "$version"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run the script
main "$@"
