# Import Patterns Guide

This guide explains the correct import patterns to use in the Allen UI Console Electron project.

## 🎯 **Import Path Configuration**

The project uses TypeScript path mapping configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 📁 **Correct Import Patterns**

### **1. Type Definitions**

Use the `@/` alias for importing from the `src/types` directory:

```typescript
// ✅ Correct
import { RecordingConfig } from '@/types/electron';
import { StreamWindowConfig } from '@/types/electron';
import { WhiteboardWindowConfig } from '@/types/electron';

// ❌ Incorrect (relative paths)
import { RecordingConfig } from '../types/electron';
import { StreamWindowConfig } from '../types/electron';
import { WhiteboardWindowConfig } from '../types/electron';
```

### **2. Module Imports**

Use the `@/` alias for importing from the `src/modules` directory:

```typescript
// ✅ Correct
import { NativeScreenCapture } from '@/modules/nativeScreenCapture';
import { DEFAULT_URL, ENV } from '@/modules/config';

// ❌ Incorrect (relative paths)
import { NativeScreenCapture } from '../modules/nativeScreenCapture';
import { DEFAULT_URL, ENV } from '../modules/config';
```

### **3. Relative Imports Within Same Directory**

For files in the same directory, you can use relative imports:

```typescript
// ✅ Correct (same directory)
import { DEFAULT_URL, ENV } from './config';
import { setupIpcHandlers } from './ipcHandlers';

// ✅ Correct (parent directory)
import { createMainWindow } from '../modules/windowManager';
```

## 🔧 **TypeScript Configuration**

### **Path Mapping**

The `tsconfig.json` configuration enables the `@/` alias:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "rootDir": "./src"
  }
}
```

### **Module Resolution**

- **Module Resolution**: `node`
- **Base URL**: `.` (project root)
- **Root Directory**: `./src`

## 📋 **Common Import Patterns**

### **1. Type Imports**

```typescript
// From types directory
import { RecordingConfig } from '@/types/electron';
import { StreamWindowConfig } from '@/types/electron';
import { WhiteboardWindowConfig } from '@/types/electron';
```

### **2. Module Imports**

```typescript
// From modules directory
import { DEFAULT_URL, ENV } from '@/modules/config';
import { createMainWindow } from '@/modules/windowManager';
import { getStreamWindow } from '@/modules/streamWindow';
```

### **3. Third-party Imports**

```typescript
// External packages
import { app, BrowserWindow } from 'electron';
import path from 'path';
import Store from 'electron-store';
```

### **4. Relative Imports**

```typescript
// Same directory
import { DEFAULT_URL, ENV } from './config';

// Parent directory (when appropriate)
import { createMainWindow } from '../modules/windowManager';
```

## 🚨 **Common Issues and Solutions**

### **1. Module Not Found Errors**

**Error**: `Cannot find module '../types/electron'`

**Solution**: Use the `@/` alias:

```typescript
// ❌ Before
import { RecordingConfig } from '../types/electron';

// ✅ After
import { RecordingConfig } from '@/types/electron';
```

### **2. Path Resolution Issues**

**Error**: `Module resolution failed`

**Solution**: Ensure TypeScript configuration is correct:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### **3. Build Failures**

**Error**: `TypeScript compilation failed`

**Solution**: Check all import paths use the correct pattern:

```bash
# Check for incorrect imports
grep -r "from '\.\./types" src/
grep -r "from \"\.\./types" src/
```

## 🎯 **Best Practices**

### **1. Use Path Aliases**

- Always use `@/` for imports from `src/` directory
- This ensures consistent imports across the project
- Makes refactoring easier

### **2. Avoid Deep Relative Paths**

```typescript
// ❌ Avoid deep relative paths
import { something } from '../../../types/electron';

// ✅ Use path aliases
import { something } from '@/types/electron';
```

### **3. Keep Imports Organized**

```typescript
// 1. External packages
import { app, BrowserWindow } from 'electron';
import path from 'path';

// 2. Internal modules (with @/ alias)
import { DEFAULT_URL } from '@/modules/config';
import { RecordingConfig } from '@/types/electron';

// 3. Relative imports (same directory)
import { helper } from './helper';
```

### **4. Use Type Imports**

```typescript
// ✅ Use type imports for types only
import type { RecordingConfig } from '@/types/electron';

// ✅ Use regular imports for values
import { DEFAULT_URL } from '@/modules/config';
```

## 🔍 **Validation Commands**

### **Check TypeScript Compilation**

```bash
# Build TypeScript (includes path alias resolution)
yarn build:ts

# Type check only (no build)
yarn typecheck
```

### **Build Process**

The `yarn build:ts` command now works correctly because:

1. **Type Definitions**: Type definitions are now in `.ts` files (not `.d.ts`) so they can be
   imported normally
2. **Path Aliases**: The `@/` path aliases work correctly with the `tsconfig.json` configuration
3. **DOM Types**: Added `DOM` to TypeScript lib configuration for browser APIs like `MediaStream`

This ensures that path aliases work correctly across all platforms, especially Windows.

### **Find Incorrect Imports**

```bash
# Find relative imports to types
grep -r "from '\.\./types" src/
grep -r "from \"\.\./types" src/

# Find relative imports to modules
grep -r "from '\.\./modules" src/
grep -r "from \"\.\./modules" src/
```

## 📝 **Migration Guide**

If you have existing code with incorrect imports:

1. **Find incorrect imports**:

   ```bash
   grep -r "from '\.\./types" src/
   ```

2. **Replace with correct pattern**:

   ```typescript
   // Before
   import { RecordingConfig } from '../types/electron';

   // After
   import { RecordingConfig } from '@/types/electron';
   ```

3. **Test compilation**:
   ```bash
   yarn build:ts
   ```

This ensures consistent, maintainable import patterns throughout the project!
