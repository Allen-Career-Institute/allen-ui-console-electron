import { BrowserWindow, IpcMainEvent, IpcRendererEvent } from 'electron';

export interface WhiteboardWindowConfig {
  url: string;
  meetingId: string;
  features?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}
export interface StreamWindowConfig {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  url: string;
  hosts: any;
  configuration: any;
  meetingId: string;
  deviceIds?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
    speakerDeviceId?: string;
  };
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: Electron.NativeImage;
  display_id: string;
  appIcon?: Electron.NativeImage;
}

export interface ScreenSharingState {
  isSharing: boolean;
  sourceId: string | null;
  sourceName: string | null;
}

export interface RecordingConfig {
  enabled: boolean;
  chunkDuration: number; // Duration in milliseconds (default: 10000 for 10s)
  maxChunks: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: string;
  audioBitrate: string;
  fps: number;
  resolution: string;
  preset: string;
  tune: string;
  memoryLimit: number;
  autoRestart: boolean;
  maxRestartAttempts: number;
  restartDelay: number;
  storagePath: string;
  retentionHours: number;
  quality: string;
  // New fields for media recording
  mergeInterval: number; // Rolling merge interval in milliseconds (default: 8000 for 8s)
  retentionDays: number; // Days to keep recordings (default: 5)
  enableAudio: boolean; // Whether to record audio
  enableVideo: boolean; // Whether to record video
  audioSampleRate: number; // Audio sample rate
  audioChannels: number; // Audio channels (1 for mono, 2 for stereo)
}

export interface RecordingProcess {
  process: any;
  config: RecordingConfig;
  startTime: number;
  chunks: any[];
  status:
    | 'recording'
    | 'stopped'
    | 'error'
    | 'combining'
    | 'paused'
    | 'resumed';
  error?: string;
  restartAttempts: number;
  lastRestart: number | null;
  // New fields for media recording
  mediaRecorder?: any;
  stream?: MediaStream;
  isPaused?: boolean;
  currentChunk?: number;
}

export interface RecordingMessage {
  type:
    | 'start'
    | 'stop'
    | 'chunk'
    | 'error'
    | 'status'
    | 'pause'
    | 'resume'
    | 'chunk_created'
    | 'recording_stopped';
  meetingId: string;
  data?: any;
  error?: string;
}

export interface RecordingChunk {
  id: string;
  path: string;
  isRecording: boolean;

  chunkNumber: number;

  timestamp: number;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  metadata?: any;
  // New fields for media recording
  number: number;
  filename: string;
  filepath: string;
  memoryUsage?: any;
  // EBML header tracking for WebM chunks
  hasEBMLHeader?: boolean;
}

export interface RecordingStatus {
  meetingId: string;

  chunksInQueue: number;
  rollingOutputFile: string;
  isMerging: boolean;
  lastUpdate: number;

  isRecording: boolean;
  status?:
    | 'recording'
    | 'stopped'
    | 'error'
    | 'combining'
    | 'paused'
    | 'resumed';
  startTime?: number;
  duration?: number;
  chunks?: RecordingChunk[];
  error?: string;
  // New fields for media recording
  isPaused?: boolean;
  currentChunk?: number;
  totalChunks?: number;
  streamInfo?: {
    hasAudio: boolean;
    hasVideo: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
  };
}

export interface MediaRecorderConfig {
  mimeType: string;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
  chunkDuration: number;
  enableAudio: boolean;
  enableVideo: boolean;
}

export interface StreamControl {
  type: 'audio' | 'video';
  enabled: boolean;
  deviceId?: string;
}

export interface RecordingManifest {
  meetingId: string;
  startTime: number;
  endTime?: number;
  status: 'recording' | 'completed' | 'error' | 'paused';
  chunks: RecordingChunk[];
  config: RecordingConfig;
  metadata: {
    totalDuration: number;
    totalSize: number;
    chunkCount: number;
    lastMergeTime?: number;
    lastCleanupTime?: number;
  };
}

export interface MainWindowConfig {
  width: number;
  height: number;
  show: boolean;
  webPreferences: {
    nodeIntegration: boolean;
    contextIsolation: boolean;
    preload: string;
    webSecurity: boolean;
    allowRunningInsecureContent: boolean;
  };
}

export interface IpcHandler {
  (event: IpcMainEvent, ...args: any[]): void;
}

export interface IpcRendererHandler {
  (event: IpcRendererEvent, ...args: any[]): void;
}

export interface WindowManager {
  getMainWindow(): BrowserWindow | null;
  createMainWindow(): BrowserWindow;
  closeMainWindow(): void;
  minimizeMainWindow(): void;
  maximizeMainWindow(): void;
  restoreMainWindow(): void;
}

export interface StreamWindowManager {
  getStreamWindow(): BrowserWindow | null;
  createStreamWindow(config: StreamWindowConfig): BrowserWindow;
  closeStreamWindow(): void;
  safeCloseStreamWindow(reason?: string): void;
  showStreamWindow(): void;
  minimizeStreamWindow(): void;
  isStreamWindowSettingUp(): boolean;
  getStreamWindowConfig(): StreamWindowConfig | null;
}

export interface WhiteboardWindowManager {
  getWhiteboardWindow(): BrowserWindow | null;
  createWhiteboardWindow(config: WhiteboardWindowConfig): BrowserWindow;
  closeWhiteboardWindow(): void;
  safeCloseWhiteboardWindow(reason?: string): void;
  forceCloseWhiteboardWindow(): boolean;
}

export interface Config {
  ENV: string;
  RECORDING_CONFIG: RecordingConfig;
  [key: string]: any;
}

export interface AutoUpdaterConfig {
  enabled: boolean;
  updateServerUrl?: string;
  allowPrerelease: boolean;
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
}

export interface SentryConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
}

export interface AppConfig {
  recording: RecordingConfig;
  autoUpdater: AutoUpdaterConfig;
  sentry: SentryConfig;
  [key: string]: any;
}
