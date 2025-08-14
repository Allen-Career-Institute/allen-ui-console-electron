#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for local builds

set -e

echo "🔧 Development Environment Setup for Allen UI Console Electron"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if .env.development exists
setup_env_file() {
    if [ ! -f ".env.development" ]; then
        print_info "Creating .env.development file..."
        if [ -f "env.development.example" ]; then
            cp env.development.example .env.development
            print_success "Created .env.development from example"
        else
            print_warning "No example file found, creating basic .env.development"
            cat > .env.development << EOF
# Development Environment
NODE_ENV=development
APP_VERSION=1.0.0-dev

# Disable code signing for development
CSC_IDENTITY_AUTO_DISCOVERY=false
CSC_LINK=
CSC_KEY_PASSWORD=
APPLE_ID=
APPLE_ID_PASS=
APPLE_TEAM_ID=

# URLs
STAGE_URL=https://console.allen-stage.in
PROD_URL=https://astra.allen.in
CUSTOM_URL=http://localhost:3000

# Sentry Configuration (optional)
SENTRY_DSN=
SENTRY_DSN_DEV=
EOF
            print_success "Created basic .env.development file"
        fi
    else
        print_info ".env.development already exists"
    fi
}

# Check if forge.config.dev.js exists
check_dev_config() {
    if [ ! -f "forge.config.dev.js" ]; then
        print_error "forge.config.dev.js not found!"
        echo "Please ensure the development configuration file exists."
        exit 1
    else
        print_success "Development configuration found"
    fi
}

# Set environment variables for development
set_dev_env() {
    print_info "Setting development environment variables..."
    
    # Export development environment variables
    export NODE_ENV=development
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    
    # Load .env.development if it exists
    if [ -f ".env.development" ]; then
        print_info "Loading .env.development..."
        export $(grep -v '^#' .env.development | xargs)
    fi
    
    print_success "Development environment variables set"
}

# Test development build
test_dev_build() {
    print_info "Testing development build..."
    
    # Check if yarn is available
    if ! command -v yarn &> /dev/null; then
        print_error "yarn is not installed or not in PATH"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        yarn install
    fi
    
    # Test TypeScript build
    print_info "Testing TypeScript build..."
    yarn build:ts
    
    # Test renderer build
    print_info "Testing renderer build..."
    yarn renderer:build
    
    print_success "Development build test completed"
}

# Show available commands
show_commands() {
    echo ""
    print_success "Development Setup Complete!"
    echo "================================"
    echo ""
    echo "Available development commands:"
    echo ""
    echo "  yarn dev              - Start development server"
    echo "  yarn dev:build        - Build for development (no code signing)"
    echo "  yarn dev:package      - Package for development"
    echo "  yarn dev:make         - Make installers for development"
    echo "  yarn dev:publish      - Publish development build (optional)"
    echo ""
    echo "Certificate options:"
    echo "  ./scripts/generate-dev-cert.sh  - Generate local certificates"
    echo ""
    echo "Environment variables:"
    echo "  NODE_ENV=development"
    echo "  CSC_IDENTITY_AUTO_DISCOVERY=false"
    echo ""
    echo "Configuration files:"
    echo "  .env.development      - Development environment variables"
    echo "  forge.config.dev.js   - Development Forge configuration"
    echo ""
    print_info "You can now build and test your app without code signing!"
    print_info "For local code signing, run: ./scripts/generate-dev-cert.sh"
}

# Main execution
main() {
    setup_env_file
    check_dev_config
    set_dev_env
    test_dev_build
    show_commands
}

# Run the script
main "$@"
