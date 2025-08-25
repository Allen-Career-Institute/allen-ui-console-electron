// Whiteboard window preload script
import { contextBridge } from 'electron';
import { WhiteboardElectronAPI } from './types/preload';

// Set process name for OS task manager visibility
try {
  if (typeof process !== 'undefined') {
    process.title = 'Astra-Whiteboard';
  }
} catch (error) {}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
  } as WhiteboardElectronAPI);

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

// Extend the global Window interface for whiteboard window
declare global {
  interface Window {
    whiteboardElectronAPI: WhiteboardElectronAPI;
  }
}
