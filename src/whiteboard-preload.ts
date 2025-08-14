// Whiteboard window preload script
import { contextBridge, ipcRenderer } from 'electron';
import { WhiteboardElectronAPI } from './types/preload';

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
