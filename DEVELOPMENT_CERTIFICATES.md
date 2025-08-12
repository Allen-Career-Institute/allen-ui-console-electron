# Development Certificate Setup Guide

This guide explains how to set up certificates for local development and avoid packaging issues.

## 🏠 **Local Development Setup**

### **Why Disable Code Signing for Development?**

Code signing is essential for production releases but can cause issues during development:

- **Certificate Requirements**: Production certificates are expensive and require proper setup
- **Build Speed**: Code signing slows down builds
- **Development Iteration**: Frequent rebuilds don't need signing
- **Testing**: Unsigned apps work fine for local testing

### **Development vs Production Configuration**

The project uses different configurations for development and production:

#### **Development (Local)**

- **Code Signing**: Optional (self-signed certificates)
- **Build Speed**: Fast
- **Testing**: Full functionality
- **Distribution**: Local only

#### **Production (GitHub Actions)**

- **Code Signing**: Enabled with proper certificates
- **Build Speed**: Slower due to signing
- **Testing**: Full functionality + security
- **Distribution**: Public releases

## 🔧 **Local Development Setup**

### **1. Environment Variables for Development**

Create a `.env.development` file in the root directory:

```env
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
STAGE_URL=https://stage.allen.com
PROD_URL=https://app.allen.com
CUSTOM_URL=https://custom.allen.com

# Sentry Configuration (optional for dev)
SENTRY_DSN=
SENTRY_DSN_DEV=

# Local Development Certificates (optional)
LOCAL_CERTIFICATE_PATH=certificates/dev_certificate.pfx
LOCAL_CERTIFICATE_PASSWORD=devpassword
```

### **2. Generate Local Development Certificates**

For testing code signing locally, you can generate self-signed certificates:

```bash
./scripts/generate-dev-cert.sh
```

This will:

- Create self-signed certificates for development
- Update your `.env.development` file
- Set up certificate paths automatically

### **3. Development Scripts**

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev:build": "yarn build:ts && yarn renderer:build && electron-forge make --config forge.config.dev.js",
    "dev:package": "electron-forge package --config forge.config.dev.js",
    "dev:make": "electron-forge make --config forge.config.dev.js",
    "dev:publish": "electron-forge publish --config forge.config.dev.js"
  }
}
```

### **4. Development Forge Configuration**

Create `forge.config.dev.js` for development builds:

```javascript
module.exports = {
  packagerConfig: {
    icon: './assets/icon',
    asar: true,
    extraResource: ['./assets/'],
    ignore: [
      /^\/(?!src|assets|package\.json)/,
      /node_modules\/(?!agora-rtc-sdk-ng)/,
      /\.git/,
      /\.github/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.env/,
      /\.log/,
    ],
    // Disable code signing for development
    osxSign: false,
    osxNotarize: false,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'allen_ui_console_dev',
        authors: 'Allen Digital',
        description: 'Allen UI Console Electron App (Development)',
        // Disable Windows code signing for development
        certificateFile: null,
        certificatePassword: null,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Allen Digital',
          homepage: 'https://github.com/your-username/allen-ui-console-electron',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          maintainer: 'Allen Digital',
          homepage: 'https://github.com/your-username/allen-ui-console-electron',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-updater',
      config: {
        repository: {
          owner: 'dinesh-kumar-allen',
          name: 'allen-ui-console-electron',
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'dinesh-kumar-allen',
          name: 'allen-ui-console-electron',
        },
        prerelease: true, // Mark as pre-release for development builds
        draft: true, // Create as draft for development builds
      },
    },
  ],
};
```

## 🚀 **Development Workflow**

### **Local Development Commands**

```bash
# Start development server
yarn dev

# Build for development (no code signing)
yarn dev:build

# Package for development
yarn dev:package

# Make installers for development
yarn dev:make

# Publish development build (optional)
yarn dev:publish
```

### **Development vs Production Builds**

| Aspect           | Development            | Production   |
| ---------------- | ---------------------- | ------------ |
| **Code Signing** | Optional (self-signed) | Enabled      |
| **Build Speed**  | Fast                   | Slower       |
| **Security**     | Basic                  | Full         |
| **Distribution** | Local/Internal         | Public       |
| **Auto-updates** | Disabled               | Enabled      |
| **Platform**     | Windows only           | Windows only |

## 🔐 **Certificate Management**

### **When You Need Certificates**

You only need certificates for:

1. **Production Releases**: When publishing to GitHub Releases
2. **Distribution**: When sharing apps outside your organization
3. **Microsoft Store**: When submitting to Microsoft Store

### **Certificate Storage**

#### **Development (Optional Self-Signed Certificates)**

```bash
# Local development certificates
export LOCAL_CERTIFICATE_PATH="certificates/dev_certificate.pfx"
export LOCAL_CERTIFICATE_PASSWORD="devpassword"
```

#### **Production (With Certificates)**

```bash
# Windows
export CSC_LINK="base64-encoded-certificate"
export CSC_KEY_PASSWORD="certificate-password"
```

### **Certificate File Locations**

#### **Windows Certificates**

- **Development**: Local `certificates/` directory (self-signed)
- **Production**: Base64-encoded in GitHub Secrets

## 🛠️ **Troubleshooting Development Issues**

### **Common Development Problems**

#### **1. Code Signing Errors**

```bash
# Error: No identity found
# Solution: Generate local certificates or disable signing
./scripts/generate-dev-cert.sh
```

#### **2. Build Failures**

```bash
# Error: Certificate not found
# Solution: Use development configuration
yarn dev:build
```

#### **3. Packaging Issues**

```bash
# Error: Cannot find certificate
# Solution: Check forge.config.dev.js
# Ensure certificateFile points to correct path
```

#### **4. Windows Build Issues**

```bash
# Error: Windows build tools not found
# Solution: Install Windows build tools
npm install --global windows-build-tools
```

### **Development Environment Checklist**

- [ ] `.env.development` file created
- [ ] `forge.config.dev.js` created
- [ ] Development scripts added to `package.json`
- [ ] Windows build tools installed
- [ ] Optional: Local certificates generated

## 🔄 **Switching Between Development and Production**

### **Development Mode**

```bash
# Set development environment
export NODE_ENV=development

# Optional: Set local certificates
export LOCAL_CERTIFICATE_PATH="certificates/dev_certificate.pfx"
export LOCAL_CERTIFICATE_PASSWORD="devpassword"

# Build for development
yarn dev:build
```

### **Production Mode**

```bash
# Set production environment
export NODE_ENV=production

# Set production certificates
export CSC_LINK="your-production-certificate"
export CSC_KEY_PASSWORD="your-certificate-password"

# Build for production
yarn build
```

## 📁 **File Structure**

```
allen-ui-console-electron/
├── forge.config.js          # Production configuration
├── forge.config.dev.js      # Development configuration
├── .env.development         # Development environment variables
├── .env.production          # Production environment variables
├── scripts/
│   └── setup-secrets.sh     # Certificate setup script
└── .github/
    └── workflows/
        ├── pr-build.yml     # PR builds (no signing)
        └── release.yml      # Production releases (with signing)
```

## 🎯 **Best Practices**

### **Development**

1. **Always use development configuration** for local builds
2. **Disable code signing** to speed up development
3. **Use environment variables** to control behavior
4. **Test functionality** without signing requirements

### **Production**

1. **Use proper certificates** for releases
2. **Enable code signing** for security
3. **Test signed builds** before release
4. **Use GitHub Actions** for automated builds

### **Security**

1. **Never commit certificates** to the repository
2. **Use GitHub Secrets** for production certificates
3. **Rotate certificates** regularly
4. **Limit access** to production certificates

## 🆘 **Getting Help**

### **Development Issues**

- Check the troubleshooting section above
- Verify environment variables are set correctly
- Ensure development configuration is being used

### **Certificate Issues**

- Run `./scripts/setup-secrets.sh` for guidance
- Check [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
- Contact your certificate provider

### **Build Issues**

- Check Electron Forge documentation
- Verify all dependencies are installed
- Check for platform-specific requirements
