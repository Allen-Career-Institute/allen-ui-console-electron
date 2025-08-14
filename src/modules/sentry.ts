// Conditional Sentry Loading - Only loads in production to reduce bundle size
let Sentry: any = null;
let isInitialized = false;

// Initialize Sentry only in production
export async function initializeSentry(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Sentry disabled in non-production environment');
    return;
  }

  try {
    // Dynamic import to reduce bundle size
    const { init } = await import('@sentry/electron');
    const { Integrations } = await import('@sentry/tracing');

    init({
      dsn: process.env.SENTRY_DSN || 'your-sentry-dsn-here',
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });

    isInitialized = true;
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.warn(
      'Failed to initialize Sentry:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Conditional error reporting
export function captureException(
  error: Error,
  context: Record<string, any> = {}
): void {
  if (!isInitialized || process.env.NODE_ENV !== 'production') {
    console.error('Error (Sentry disabled):', error, context);
    return;
  }

  try {
    Sentry?.captureException(error, context);
  } catch (sentryError) {
    console.error('Failed to send to Sentry:', sentryError);
  }
}

// Conditional message reporting
export function captureMessage(
  message: string,
  level: string = 'info',
  context: Record<string, any> = {}
): void {
  if (!isInitialized || process.env.NODE_ENV !== 'production') {
    console.log(`Message (Sentry disabled): ${message}`, context);
    return;
  }

  try {
    Sentry?.captureMessage(message, level, context);
  } catch (sentryError) {
    console.error('Failed to send message to Sentry:', sentryError);
  }
}

// Get Sentry instance (for advanced usage)
export function getSentry(): any {
  return isInitialized ? Sentry : null;
}

// Check if Sentry is available
export function isSentryAvailable(): boolean {
  return isInitialized && process.env.NODE_ENV === 'production';
}
