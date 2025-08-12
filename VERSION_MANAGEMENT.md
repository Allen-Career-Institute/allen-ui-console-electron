# Version Management Guide

This guide explains how version management works in the Allen UI Console Electron app.

## 🎯 **Overview**

The project uses **Semantic Versioning (SemVer)** with automatic version incrementing for releases.
Versions follow the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

## 🚀 **Automatic Version Management**

### **GitHub Actions Workflow**

The release workflow automatically handles version management:

1. **Auto-increment**: Automatically increments version based on type
2. **Manual override**: Allows manual version specification
3. **Package.json update**: Updates version in package.json
4. **Git commit**: Commits version change back to repository
5. **Release creation**: Creates GitHub release with new version

### **Workflow Triggers**

#### **Automatic (Push to main)**

- **Version Type**: Defaults to `patch`
- **Behavior**: Auto-increments current version
- **Example**: 1.0.0 → 1.0.1

#### **Manual (Workflow Dispatch)**

- **Version**: Optional manual version
- **Version Type**: Choose increment type (patch/minor/major)
- **Behavior**: Auto-increment or use manual version

## 🛠️ **Local Version Management**

### **Version Manager Script**

Use the version manager script for local version operations:

```bash
# Show current version
./scripts/version-manager.sh current

# Bump version
./scripts/version-manager.sh bump patch    # 1.0.0 → 1.0.1
./scripts/version-manager.sh bump minor    # 1.0.0 → 1.1.0
./scripts/version-manager.sh bump major    # 1.0.0 → 2.0.0

# Set specific version
./scripts/version-manager.sh set 1.2.3

# Interactive version bump
./scripts/version-manager.sh interactive

# Show version history
./scripts/version-manager.sh history

# Create release tag
./scripts/version-manager.sh tag 1.2.3
```

### **NPM Scripts**

Convenient npm scripts for version management:

```bash
# Show current version
yarn version:current

# Bump version
yarn version:bump patch
yarn version:bump minor
yarn version:bump major

# Set specific version
yarn version:set 1.2.3

# Interactive version bump
yarn version:interactive

# Show version history
yarn version:history

# Create release tag
yarn version:tag
```

## 📋 **Version Workflow**

### **Development Workflow**

1. **Start Development**

   ```bash
   yarn dev
   ```

2. **Make Changes**
   - Add features, fix bugs, etc.

3. **Test Changes**

   ```bash
   yarn dev:build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

### **Release Workflow**

#### **Option 1: Automatic Release (Push to main)**

1. **Push to main branch**
2. **GitHub Actions automatically**:
   - Increments patch version (1.0.0 → 1.0.1)
   - Updates package.json
   - Commits version change
   - Builds and releases

#### **Option 2: Manual Release (Workflow Dispatch)**

1. **Go to GitHub Actions**
2. **Run "Release" workflow**
3. **Choose options**:
   - **Version**: Leave empty for auto-increment
   - **Version Type**: patch/minor/major
4. **Workflow automatically**:
   - Increments version based on type
   - Updates package.json
   - Commits version change
   - Builds and releases

## 🔄 **Version Types**

### **Patch (Bug Fixes)**

- **When to use**: Bug fixes, minor improvements
- **Example**: 1.0.0 → 1.0.1
- **GitHub Actions**: Default for push to main

```bash
# Local
yarn version:bump patch

# GitHub Actions
# Automatic on push to main
```

### **Minor (New Features)**

- **When to use**: New features, non-breaking changes
- **Example**: 1.0.0 → 1.1.0
- **GitHub Actions**: Manual workflow dispatch

```bash
# Local
yarn version:bump minor

# GitHub Actions
# Manual workflow dispatch → Version Type: minor
```

### **Major (Breaking Changes)**

- **When to use**: Breaking changes, major refactoring
- **Example**: 1.0.0 → 2.0.0
- **GitHub Actions**: Manual workflow dispatch

```bash
# Local
yarn version:bump major

# GitHub Actions
# Manual workflow dispatch → Version Type: major
```

## 📁 **Version Files**

### **Package.json**

```json
{
  "name": "allen-ui-console-electron",
  "version": "1.0.0",
  ...
}
```

### **Git Tags**

- **Format**: `v1.0.0`, `v1.0.1`, etc.
- **Created**: Automatically by GitHub Actions
- **Purpose**: Release tracking and rollback

### **GitHub Releases**

- **Format**: `Release v1.0.0`
- **Created**: Automatically by GitHub Actions
- **Assets**: Windows installers for the version

## 🎯 **Best Practices**

### **Version Naming**

1. **Use Semantic Versioning**: MAJOR.MINOR.PATCH
2. **Be Consistent**: Always use the same format
3. **Document Changes**: Use conventional commits

### **Release Process**

1. **Test Thoroughly**: Ensure builds work before release
2. **Use Appropriate Type**: Choose correct version increment
3. **Review Changes**: Check what's included in the release
4. **Document Release**: Add release notes

### **Conventional Commits**

Use conventional commit messages for better version management:

```bash
# Bug fix (patch)
git commit -m "fix: resolve login issue"

# New feature (minor)
git commit -m "feat: add dark mode support"

# Breaking change (major)
git commit -m "feat!: remove deprecated API"
```

## 🔧 **Configuration**

### **GitHub Actions Configuration**

The release workflow is configured in `.github/workflows/release.yml`:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., 1.0.0) - leave empty for auto-increment'
        required: false
        type: string
      version_type:
        description: 'Version increment type (patch, minor, major)'
        required: false
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
```

### **Version Manager Script**

The version manager script (`scripts/version-manager.sh`) provides:

- **Version calculation**: Automatic increment logic
- **Package.json updates**: Safe version updates
- **Git operations**: Tag creation and management
- **Interactive mode**: User-friendly version selection

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. Version Conflict**

```bash
# Error: Version already exists
# Solution: Use different version or delete existing tag
./scripts/version-manager.sh set 1.0.2
```

#### **2. Git Tag Issues**

```bash
# Error: Tag already exists
# Solution: Delete and recreate tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
./scripts/version-manager.sh tag 1.0.0
```

#### **3. Package.json Update Failed**

```bash
# Error: Cannot update package.json
# Solution: Check file permissions and git status
git status
chmod +x scripts/version-manager.sh
```

### **Manual Version Reset**

If you need to reset to a specific version:

```bash
# Set specific version
yarn version:set 1.0.0

# Commit changes
git add package.json
git commit -m "Reset version to 1.0.0"
git push
```

## 📊 **Version History**

### **Viewing History**

```bash
# Show recent versions
yarn version:history

# Show git tags
git tag --sort=-version:refname

# Show release history
# Go to GitHub → Releases
```

### **Rollback**

```bash
# Rollback to specific version
git checkout v1.0.0
yarn version:set 1.0.0
git add package.json
git commit -m "Rollback to version 1.0.0"
git push
```

## 🎉 **Summary**

The version management system provides:

1. **Automatic Incrementing**: No manual version tracking needed
2. **Flexible Control**: Manual override when needed
3. **Semantic Versioning**: Clear version meaning
4. **Git Integration**: Automatic tagging and releases
5. **Local Tools**: Easy version management during development

This ensures consistent, reliable version management for your Electron app releases!
