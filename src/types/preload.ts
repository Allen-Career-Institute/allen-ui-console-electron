// Shared types for preload scripts
export interface BaseElectronAPI {
  isElectron: boolean;
  requestStreamConfig: () => Promise<any>;
  onStreamControl: (callback: (event: any, ...args: any[]) => void) => void;
  onCleanupResources: (callback: (event: any, ...args: any[]) => void) => void;
  sendMediaChunk: (
    meetingId: string,
    chunkData: any,
    chunkIndex: number,
    isLastChunk?: boolean
  ) => Promise<any>;
  removeAllListeners: (channel: string) => void;
}

export interface MainElectronAPI extends BaseElectronAPI {
  sendMessage: (message: any) => Promise<any>;
}

export interface StreamElectronAPI extends BaseElectronAPI {}

export interface WhiteboardElectronAPI extends BaseElectronAPI {}

// Unified interface for all preload scripts
export type ElectronAPI =
  | MainElectronAPI
  | StreamElectronAPI
  | WhiteboardElectronAPI;
