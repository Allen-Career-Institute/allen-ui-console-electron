#!/bin/bash

# GitHub Actions Secrets Setup Script for Allen UI Console Electron
# This script helps you prepare the necessary secrets for GitHub Actions

set -e

echo "🔐 GitHub Actions Secrets Setup for Allen UI Console Electron"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are available
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v base64 &> /dev/null; then
        print_error "base64 is required but not installed"
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        print_warning "openssl is recommended for certificate operations"
    fi
    
    print_success "Requirements check completed"
}

# macOS Code Signing Setup
setup_macos_signing() {
    echo ""
    print_info "Setting up macOS Code Signing"
    echo "--------------------------------"
    
    echo "For macOS code signing, you'll need:"
    echo "1. Apple Developer Account (free or paid)"
    echo "2. App-specific password for your Apple ID"
    echo "3. Developer ID Application certificate"
    echo "4. Your Apple Developer Team ID"
    echo ""
    
    read -p "Do you have an Apple Developer account? (y/n): " has_apple_account
    
    if [[ $has_apple_account == "y" || $has_apple_account == "Y" ]]; then
        echo ""
        print_info "Apple Developer Setup Instructions:"
        echo "1. Go to https://developer.apple.com"
        echo "2. Sign in with your Apple ID"
        echo "3. Go to 'Certificates, Identifiers & Profiles'"
        echo "4. Create a 'Developer ID Application' certificate"
        echo "5. Download the certificate (.p12 file)"
        echo ""
        
        read -p "Enter your Apple ID email: " apple_id
        read -p "Enter your Apple Developer Team ID: " team_id
        
        echo ""
        print_info "App-Specific Password Setup:"
        echo "1. Go to https://appleid.apple.com"
        echo "2. Sign in with your Apple ID"
        echo "3. Go to 'Security' → 'App-Specific Passwords'"
        echo "4. Click 'Generate Password'"
        echo "5. Use this password for APPLE_ID_PASS secret"
        echo ""
        
        read -p "Enter your app-specific password: " app_password
        
        echo ""
        print_info "Certificate Setup:"
        echo "If you have a .p12 certificate file, we can convert it to base64"
        
        read -p "Do you have a .p12 certificate file? (y/n): " has_cert
        
        if [[ $has_cert == "y" || $has_cert == "Y" ]]; then
            read -p "Enter the path to your .p12 certificate file: " cert_path
            
            if [[ -f "$cert_path" ]]; then
                print_info "Converting certificate to base64..."
                base64_cert=$(base64 -i "$cert_path")
                print_success "Certificate converted successfully"
                
                echo ""
                print_info "Certificate password:"
                read -s -p "Enter the password for your certificate: " cert_password
                echo ""
                
                echo ""
                print_success "macOS Code Signing Setup Complete!"
                echo "Add these secrets to your GitHub repository:"
                echo ""
                echo "APPLE_ID: $apple_id"
                echo "APPLE_ID_PASS: $app_password"
                echo "APPLE_TEAM_ID: $team_id"
                echo "CSC_LINK: [base64 certificate - see below]"
                echo "CSC_KEY_PASSWORD: $cert_password"
                echo ""
                echo "Base64 certificate (CSC_LINK):"
                echo "$base64_cert"
            else
                print_error "Certificate file not found: $cert_path"
            fi
        else
            print_warning "You'll need to create a certificate manually"
            echo "Follow the instructions at: https://developer.apple.com/account/resources/certificates/list"
        fi
    else
        print_warning "macOS code signing will be skipped"
        echo "You can still build for macOS, but the app won't be signed"
    fi
}

# Windows Code Signing Setup
setup_windows_signing() {
    echo ""
    print_info "Setting up Windows Code Signing"
    echo "-----------------------------------"
    
    echo "For Windows code signing, you'll need:"
    echo "1. Code signing certificate (.pfx file)"
    echo "2. Certificate password"
    echo ""
    echo "You can:"
    echo "- Purchase a certificate from a CA (DigiCert, Sectigo, etc.)"
    echo "- Use a self-signed certificate for testing"
    echo "- Skip code signing (app will work but may show security warnings)"
    echo ""
    
    read -p "Do you have a Windows code signing certificate? (y/n): " has_win_cert
    
    if [[ $has_win_cert == "y" || $has_win_cert == "Y" ]]; then
        read -p "Enter the path to your .pfx certificate file: " win_cert_path
        
        if [[ -f "$win_cert_path" ]]; then
            print_info "Converting certificate to base64..."
            base64_win_cert=$(base64 -i "$win_cert_path")
            print_success "Certificate converted successfully"
            
            echo ""
            read -s -p "Enter the password for your certificate: " win_cert_password
            echo ""
            
            echo ""
            print_success "Windows Code Signing Setup Complete!"
            echo "Add these secrets to your GitHub repository:"
            echo ""
            echo "CSC_LINK: [base64 certificate - see below]"
            echo "CSC_KEY_PASSWORD: $win_cert_password"
            echo ""
            echo "Base64 certificate (CSC_LINK):"
            echo "$base64_win_cert"
        else
            print_error "Certificate file not found: $win_cert_path"
        fi
    else
        print_warning "Windows code signing will be skipped"
        echo "You can still build for Windows, but the app won't be signed"
    fi
}

# GitHub Repository Setup
setup_github_repo() {
    echo ""
    print_info "GitHub Repository Setup"
    echo "-------------------------"
    
    echo "To add secrets to your GitHub repository:"
    echo "1. Go to your repository on GitHub"
    echo "2. Click 'Settings' tab"
    echo "3. Click 'Secrets and variables' → 'Actions'"
    echo "4. Click 'New repository secret'"
    echo "5. Add each secret with the values provided above"
    echo ""
    
    read -p "Enter your GitHub repository URL: " repo_url
    
    if [[ $repo_url == *"github.com"* ]]; then
        repo_name=$(echo $repo_url | sed 's/.*github\.com[:/]\([^/]*\/[^/]*\).*/\1/')
        secrets_url="https://github.com/$repo_name/settings/secrets/actions"
        
        echo ""
        print_success "GitHub Repository Setup Complete!"
        echo "Add secrets at: $secrets_url"
    else
        print_warning "Please enter a valid GitHub repository URL"
    fi
}

# Main execution
main() {
    check_requirements
    setup_macos_signing
    setup_windows_signing
    setup_github_repo
    
    echo ""
    print_success "Setup Complete!"
    echo "=================="
    echo ""
    echo "Next steps:"
    echo "1. Add the secrets to your GitHub repository"
    echo "2. Push your code to trigger the workflows"
    echo "3. Check the Actions tab to monitor builds"
    echo ""
    echo "For more information, see: GITHUB_ACTIONS_SETUP.md"
}

# Run the script
main "$@"
