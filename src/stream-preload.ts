// Stream window preload script
import { contextBridge, ipcRenderer } from 'electron';
import { StreamElectronAPI } from './types/preload';

// Set process name for OS task manager visibility
try {
  if (typeof process !== 'undefined') {
    process.title = 'Astra-Stream';
  }
} catch (error) {}

// Prevent any reload attempts from the renderer process
window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = '';
  console.log('Page unload prevented in stream window');
});

// Ensure we're in a safe environment before proceeding
if (typeof window === 'undefined') {
  console.error('Window object not available in preload script');
  process.exit(1);
}

// Override reload functions to prevent them from working
// Use a safer approach that doesn't redefine the location property
try {
  const originalLocation = window.location;

  // Try to override the reload method if it exists
  if (originalLocation && typeof originalLocation.reload === 'function') {
    const originalReload = originalLocation.reload;
    originalLocation.reload = function () {
      console.log('Reload function blocked in stream window');
      return false;
    };
    console.log('Successfully overrode location.reload');
  }

  // Try to override href setter if possible
  if (originalLocation && originalLocation.href !== undefined) {
    try {
      Object.defineProperty(originalLocation, 'href', {
        set: function (value: string) {
          console.log('Location href change blocked in stream window');
          return false;
        },
        get: function () {
          return originalLocation.href;
        },
        configurable: true,
      });
      console.log('Successfully overrode location.href setter');
    } catch (hrefError) {
      console.log(
        'Could not override location.href:',
        hrefError instanceof Error ? hrefError.message : 'Unknown error'
      );
    }
  }
} catch (error) {
  console.log(
    'Could not override location methods:',
    error instanceof Error ? error.message : 'Unknown error'
  );
}

// Override history methods to prevent navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
const originalGo = history.go;
const originalBack = history.back;
const originalForward = history.forward;

history.pushState = function () {
  console.log('pushState blocked in stream window');
  return false;
};

history.replaceState = function () {
  console.log('replaceState blocked in stream window');
  return false;
};

history.go = function () {
  console.log('history.go blocked in stream window');
  return false;
};

history.back = function () {
  console.log('history.back blocked in stream window');
  return false;
};

history.forward = function () {
  console.log('history.forward blocked in stream window');
  return false;
};

// Block additional reload-related functions
if (typeof window.stop === 'function') {
  const originalStop = window.stop;
  window.stop = function () {
    console.log('window.stop blocked in stream window');
    return false;
  };
}

// Block any attempts to use eval or similar functions
if (typeof window.eval === 'function') {
  const originalEval = window.eval;
  window.eval = function () {
    console.log('eval blocked in stream window');
    return false;
  };
}

// Block any attempts to use Function constructor
if (typeof window.Function === 'function') {
  const originalFunction = window.Function;
  window.Function = function (...args: any[]) {
    console.log('Function constructor blocked in stream window');
    return originalFunction(...args);
  } as FunctionConstructor;
}

// Block any attempts to use setTimeout/setInterval with code strings
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

// Store original functions
const originalSetTimeoutTyped = window.setTimeout;
const originalSetIntervalTyped = window.setInterval;

// Override setTimeout
window.setTimeout = function (fn: any, delay?: number, ...args: any[]) {
  if (typeof fn === 'string') {
    console.log('setTimeout with string blocked in stream window');
    return originalSetTimeoutTyped(() => {}, 0);
  }
  return originalSetTimeoutTyped(fn, delay, ...args);
} as typeof window.setTimeout;

// Override setInterval
window.setInterval = function (fn: any, delay?: number, ...args: any[]) {
  if (typeof fn === 'string') {
    console.log('setInterval with string blocked in stream window');
    return originalSetIntervalTyped(() => {}, 0);
  }
  return originalSetIntervalTyped(fn, delay, ...args);
} as typeof window.setInterval;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    isStreamWindow: true,
    requestStreamConfig: (): Promise<any> =>
      ipcRenderer.invoke('request-stream-config'),
    onStreamControl: (callback: (event: any, ...args: any[]) => void): void => {
      ipcRenderer.on('stream-control', callback);
    },
    onCleanupResources: (
      callback: (event: any, ...args: any[]) => void
    ): void => {
      ipcRenderer.on('cleanup-resources', callback);
    },
    sendMediaChunk: (
      meetingId: string,
      chunkData: any,
      chunkIndex: number,
      isLastChunk: boolean = false
    ): Promise<any> =>
      ipcRenderer.invoke('sendMessage', {
        type: 'MEDIA_CHUNK_DATA',
        payload: {
          meetingId,
          chunkData,
          chunkIndex,
          timestamp: Date.now(),
          isLastChunk,
        },
      }),

    // Remove listeners
    removeAllListeners: (channel: string): void => {
      ipcRenderer.removeAllListeners(channel);
    },
  } as StreamElectronAPI);

  console.log('Successfully exposed electronAPI to renderer process');
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}

// Add error handler for uncaught errors
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception in preload script:', error);
});

process.on(
  'unhandledRejection',
  (reason: unknown, promise: Promise<unknown>) => {
    console.error('Unhandled rejection in preload script:', reason, promise);
  }
);

// Extend the global Window interface for stream window
declare global {
  interface Window {
    streamElectronAPI: StreamElectronAPI;
  }
}
