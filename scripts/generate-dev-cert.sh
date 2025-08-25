#!/bin/bash

# Generate Local Development Certificates Script
# This script creates self-signed certificates for local development

set -e

echo "🔐 Generating Local Development Certificates"
echo "============================================="
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

# Check if OpenSSL is available
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is required but not installed"
        echo "Please install OpenSSL:"
        echo "  macOS: brew install openssl"
        echo "  Ubuntu: sudo apt-get install openssl"
        echo "  Windows: Download from https://www.openssl.org/"
        exit 1
    fi
    print_success "OpenSSL found"
}

# Create certificates directory
create_cert_dir() {
    if [ ! -d "certificates" ]; then
        mkdir -p certificates
        print_success "Created certificates directory"
    else
        print_info "Certificates directory already exists"
    fi
}

# Generate self-signed certificate for development
generate_dev_cert() {
    print_info "Generating self-signed Windows development certificate..."
    
    # Generate private key
    openssl genrsa -out certificates/dev_private.key 2048
    
    # Generate certificate signing request
    openssl req -new -key certificates/dev_private.key -out certificates/dev_cert.csr -subj "/C=US/ST=Development/L=Development/O=Allen Digital/OU=Development/CN=allen-ui-console-dev"
    
    # Generate self-signed certificate
    openssl x509 -req -days 365 -in certificates/dev_cert.csr -signkey certificates/dev_private.key -out certificates/dev_certificate.crt
    
    # Convert to PFX format for Windows
    openssl pkcs12 -export -out certificates/dev_certificate.pfx -inkey certificates/dev_private.key -in certificates/dev_certificate.crt -passout pass:devpassword
    
    print_success "Windows development certificate generated"
}

# Update environment file
update_env_file() {
    print_info "Updating development environment file..."
    
    # Check if .env.development exists
    if [ -f ".env.development" ]; then
        # Update existing file
        sed -i.bak '/LOCAL_CERTIFICATE_PATH/d' .env.development
        sed -i.bak '/LOCAL_CERTIFICATE_PASSWORD/d' .env.development
    else
        # Create new file
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
ASTRA_ELECTRON_SENTRY_DSN=

EOF
    fi
    
    # Add local certificate paths
    echo "" >> .env.development
    echo "# Local Development Certificates" >> .env.development
    echo "LOCAL_CERTIFICATE_PATH=certificates/dev_certificate.pfx" >> .env.development
    echo "LOCAL_CERTIFICATE_PASSWORD=devpassword" >> .env.development
    
    print_success "Environment file updated"
}

# Create certificate info file
create_cert_info() {
    print_info "Creating certificate information file..."
    
    cat > certificates/README.md << EOF
# Development Certificates

These are self-signed certificates generated for local development and testing.

## Files

- \`dev_private.key\` - Private key
- \`dev_certificate.crt\` - Certificate (PEM format)
- \`dev_certificate.pfx\` - Certificate (PFX format for Windows)
- \`dev_cert.csr\` - Certificate signing request

## Usage

These certificates are automatically used by the development build process.
The password for all certificates is: \`devpassword\`

## Security Notice

⚠️ **These are self-signed certificates for development only!**
- Do not use in production
- Do not commit to version control
- Regenerate if compromised

## Regenerating Certificates

To regenerate these certificates, run:
\`\`\`bash
./scripts/generate-dev-cert.sh
\`\`\`
EOF
    
    print_success "Certificate information file created"
}

# Show certificate details
show_cert_details() {
    print_info "Certificate Details:"
    echo ""
    echo "Certificate Information:"
    openssl x509 -in certificates/dev_certificate.crt -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"
    echo ""
    echo "Files created:"
    ls -la certificates/
    echo ""
    print_success "Development certificates are ready!"
}

# Main execution
main() {
    check_openssl
    create_cert_dir
    generate_dev_cert
    update_env_file
    create_cert_info
    show_cert_details
    
    echo ""
    print_success "Development Certificate Setup Complete!"
    echo "=============================================="
    echo ""
    echo "You can now use these certificates for local development:"
    echo ""
    echo "  yarn dev:build        - Build with local certificates"
    echo "  yarn dev:package      - Package with local certificates"
    echo "  yarn dev:make         - Create installers with local certificates"
    echo ""
    echo "Certificate password: devpassword"
    echo ""
    print_warning "Remember: These are self-signed certificates for development only!"
}

# Run the script
main "$@"
