import { contextBridge, ipcRenderer } from 'electron';
import { MainElectronAPI } from './types/preload';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Detect if running in Electron environment
  isElectron: true,
  // IPC Communication interface
  sendMessage: async (message: any): Promise<any> => {
    try {
      return await ipcRenderer.invoke('sendMessage', message);
    } catch (error) {
      return {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Request stream configuration
  requestStreamConfig: async (): Promise<any> => {
    try {
      return await ipcRenderer.invoke('request-stream-config');
    } catch (error) {
      return {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Stream control event listener
  onStreamControl: (callback: (event: any, ...args: any[]) => void): void => {
    ipcRenderer.on('stream-control', callback);
  },
  // Cleanup resources event listener
  onCleanupResources: (
    callback: (event: any, ...args: any[]) => void
  ): void => {
    ipcRenderer.on('cleanup-resources', callback);
  },
  sendMediaChunk: async (
    meetingId: string,
    chunkData: any,
    chunkIndex: number,
    isLastChunk: boolean = false
  ): Promise<any> => {
    try {
      return await ipcRenderer.invoke('sendMessage', {
        type: 'MEDIA_CHUNK_DATA',
        payload: {
          meetingId,
          chunkData,
          chunkIndex,
          timestamp: Date.now(),
          isLastChunk,
        },
      });
    } catch (error) {
      return {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Remove all listeners
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },
} as MainElectronAPI);

// Extend the global Window interface
declare global {
  interface Window {
    electronAPI: MainElectronAPI;
  }
}
