# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for building and releasing the Allen UI Console
Electron app.

## Overview

The project includes two GitHub Actions workflows:

1. **PR Build** (`.github/workflows/pr-build.yml`)
   - Triggers on pull requests to `main` and `develop` branches
   - Builds for all platforms (macOS, Windows, Linux)
   - Creates artifacts for testing (no GitHub release)
   - Artifacts are retained for 30 days

2. **Release** (`.github/workflows/release.yml`)
   - Triggers on pushes to `main` branch
   - Builds for all platforms with code signing
   - Creates GitHub release with downloadable assets
   - Can be manually triggered with custom version

## Required GitHub Secrets

### Environment Configuration

- `STAGE_URL`: URL for staging environment
- `PROD_URL`: URL for production environment
- `CUSTOM_URL`: URL for custom environment

### For Code Signing (Release Workflow Only)

#### Windows Code Signing

- `WINDOWS_CERTIFICATE_BASE64`: Base64-encoded certificate file (.pfx)
- `CSC_KEY_PASSWORD`: Password for the certificate

### How to Set Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret

### Setting Up Windows Code Signing

#### 1. Get Code Signing Certificate

- Purchase from a Certificate Authority (DigiCert, Sectigo, etc.)
- Or use a self-signed certificate for testing

#### 2. Convert to Base64

```bash
base64 -i "path/to/certificate.pfx" | pbcopy
```

#### 3. Add to GitHub Secrets

Use the base64 output for `WINDOWS_CERTIFICATE_BASE64`

## Environment-Specific Builds

### PR Builds (Stage Environment)

- **Environment**: `NODE_ENV=stage`
- **URLs**: Uses `STAGE_URL` from GitHub secrets
- **Code Signing**: Disabled
- **Purpose**: Testing and validation

### Release Builds (Production Environment)

- **Environment**: `NODE_ENV=production`
- **URLs**: Uses `PROD_URL` from GitHub secrets
- **Code Signing**: Enabled with proper certificates
- **Purpose**: Public distribution

### Local Development

- **Environment**: `NODE_ENV=development`
- **URLs**: Uses local configuration
- **Code Signing**: Optional (self-signed certificates)
- **Purpose**: Local testing and development

## Environment Variables

The workflows use these environment variables:

- `NODE_VERSION`: Node.js version (default: '18')
- `YARN_VERSION`: Yarn version (default: '4.9.2')
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NODE_ENV`: Environment (stage/production/development)
- `STAGE_URL`: Staging environment URL
- `PROD_URL`: Production environment URL
- `CUSTOM_URL`: Custom environment URL

## Workflow Triggers

### PR Build Workflow

- **Automatic**: On pull request to `main` or `develop`
- **Manual**: Not available (PR-specific)

### Release Workflow

- **Automatic**: On push to `main` branch
- **Manual**: Go to **Actions** → **Release** → **Run workflow**
  - Can specify custom version number

## Build Platforms

Both workflows build for:

- **Windows**: 64-bit (x64) and 32-bit (ia32)

## Artifacts and Releases

### PR Build Artifacts

- Stored as GitHub Actions artifacts
- Available for download from the Actions tab
- Retained for 30 days
- Named: `allen-ui-console-win32-{arch}-pr-{pr-number}`

### Release Assets

- Published to GitHub Releases
- Available for public download
- Retained indefinitely
- Named: `allen-ui-console-win32-{arch}`

## Troubleshooting

### Common Issues

1. **Build Fails on Windows**
   - Check if all dependencies are installed
   - Verify Windows build tools are available
   - Ensure Node.js and Yarn are properly configured

2. **Code Signing Fails**
   - Verify `WINDOWS_CERTIFICATE_BASE64` is properly base64-encoded
   - Check `CSC_KEY_PASSWORD` is correct
   - Ensure certificate is not expired

3. **Release Creation Fails**
   - Check if `GITHUB_TOKEN` has sufficient permissions
   - Verify tag doesn't already exist
   - Ensure all build jobs completed successfully

### Debugging

1. Check the **Actions** tab in your repository
2. Click on the failed workflow run
3. Expand the failed job to see detailed logs
4. Look for specific error messages

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use app-specific passwords** for Apple ID
3. **Rotate certificates regularly**
4. **Limit repository access** to trusted contributors
5. **Review workflow permissions** regularly

## Customization

### Adding New Architectures

Edit the `matrix.include` section in both workflow files:

```yaml
include:
  - os: windows-latest
    platform: win32
    arch: arm64 # Add new Windows architecture
```

### Modifying Build Steps

The workflows use these npm scripts:

- `yarn build:ts`: Build TypeScript
- `yarn renderer:build`: Build React renderer
- `yarn make`: Build Electron app

### Changing Retention Periods

- PR artifacts: 30 days (in `pr-build.yml`)
- Release artifacts: 90 days (in `release.yml`)

## Support

For issues with:

- **GitHub Actions**: Check GitHub documentation
- **Code Signing**: Contact your certificate provider
- **Windows Build Tools**: Check Microsoft documentation
- **Project-specific**: Create an issue in this repository
