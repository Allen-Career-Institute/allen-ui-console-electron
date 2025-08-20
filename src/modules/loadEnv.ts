import { app } from 'electron';
import path from 'path';
import { setEnv, setSentryDsn, setSentryEndpoint, setUrlByEnv } from './config';

// Load environment variables using hybrid approach
let envLoadError: Error | null = null;

// Function to load runtime environment variables from .env.local
function loadRuntimeEnv() {
  try {
    const fs = require('fs');
    const envPath = app.isPackaged
      ? path.join(process.resourcesPath, '.env.local')
      : path.resolve(process.cwd(), '.env.local');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent
        .split('\n')
        .filter((line: string) => line.trim() && !line.startsWith('#'))
        .reduce(
          (acc: Record<string, string>, line: string) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts
                .join('=')
                .trim()
                .replace(/^["']|["']$/g, '');
              acc[key.trim()] = value;
            }
            return acc;
          },
          {} as Record<string, string>
        );

      // Override webpack-defined variables with runtime values
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value as string;
      });
      setEnv(envVars.ENV as 'development' | 'stage' | 'production');
      setUrlByEnv(
        envVars.CUSTOM_URL || (envVars.PROD_URL as string),
        'production'
      );
      setUrlByEnv(envVars.CUSTOM_URL || (envVars.STAGE_URL as string), 'stage');
      setUrlByEnv(
        envVars.CUSTOM_URL || (envVars.DEV_URL as string),
        'development'
      );
      setSentryDsn(envVars.ASTRA_ELECTRON_SENTRY_DSN as string);
      setSentryEndpoint(envVars.ASTRA_ELECTRON_SENTRY_ENDPOINT as string);

      console.log('✅ Runtime environment variables loaded from:', envPath);
      console.log('📋 Loaded variables:', Object.keys(envVars).join(', '));
      return true;
    } else {
      console.log(
        'ℹ️  Runtime .env.local file not found, using webpack defaults'
      );
      throw new Error('Runtime .env.local file not found');
    }
  } catch (error) {
    console.warn('⚠️  Failed to load runtime environment variables:', error);
    throw error;
  }
}

const loadEnv = () => {
  // Try to load runtime environment variables
  try {
    loadRuntimeEnv();
  } catch (error) {
    envLoadError =
      error instanceof Error
        ? error
        : new Error('Unknown error loading runtime environment variables');
    console.error('Failed to load runtime environment variables:', error);
  }
};

const getLoadEnvError = () => {
  return envLoadError;
};

export { loadEnv, getLoadEnvError };
